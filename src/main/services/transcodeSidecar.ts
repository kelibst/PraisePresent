import { app } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { rmSync } from 'node:fs';
import { mediaRepository } from '../db/repositories/mediaRepository';
import log from '../infra/logger';

// Out-of-process video transcode sidecar (B6c). ffmpeg runs as a CHILD PROCESS, so a
// crash/OOM on a pathological video is crash-isolated — it can never take down the
// live service (CLAUDE.md §5.7). Jobs run ONE AT A TIME (a serialized queue) so a weak
// machine is never thrashed, with a watchdog timeout that kills a runaway encode. On
// success the rendition path is recorded; on any failure the original is served.

const TRANSCODE_TIMEOUT_MS = 15 * 60 * 1000; // watchdog: kill an encode that runs away

export type TranscodeJob = { id: number; input: string; output: string; args: string[] };

let queue: TranscodeJob[] = [];
let running = false;
let activeProc: ChildProcess | null = null;

// Resolve the ffmpeg binary. Packaged: the per-platform binary copied OUTSIDE the asar
// to resources/ (forge extraResource) so it's executable. Dev/test: resolve the
// ffmpeg-static binary lazily so a packaged build never needs the module present.
function ffmpegPath(): string | null {
  if (app.isPackaged) {
    const name = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    return path.join(process.resourcesPath, name);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('ffmpeg-static') as string | null) ?? null;
  } catch {
    return null;
  }
}

export function enqueueTranscode(job: TranscodeJob): void {
  queue.push(job);
  void pump();
}

async function pump(): Promise<void> {
  if (running) return;
  const bin = ffmpegPath();
  if (!bin) {
    log.warn('ffmpeg binary unavailable; skipping transcode queue (originals served).');
    queue = [];
    return;
  }
  running = true;
  try {
    while (queue.length > 0) {
      const job = queue.shift()!;
      await runOne(bin, job);
    }
  } finally {
    running = false;
  }
}

function cleanupOutput(output: string): void {
  try {
    rmSync(output, { force: true });
  } catch {
    /* best-effort — never throws */
  }
}

function runOne(bin: string, job: TranscodeJob): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    try {
      const proc = spawn(bin, job.args, { stdio: ['ignore', 'ignore', 'pipe'] });
      activeProc = proc;
      let stderrTail = '';
      const timer = setTimeout(() => {
        log.warn(`Transcode ${job.id} exceeded the watchdog; killing ffmpeg.`);
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
      }, TRANSCODE_TIMEOUT_MS);
      proc.stderr?.on('data', (d: Buffer) => {
        stderrTail = (stderrTail + d.toString()).slice(-400);
      });
      proc.on('error', (e) => {
        clearTimeout(timer);
        activeProc = null;
        log.warn(`Transcode ${job.id} spawn error; serving original:`, e);
        cleanupOutput(job.output);
        done();
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        activeProc = null;
        if (code === 0) {
          mediaRepository.setRendition(job.id, job.output);
          log.info(`Transcode ${job.id} complete → ${job.output}`);
        } else {
          log.warn(`Transcode ${job.id} failed (code ${code}); serving original. ${stderrTail}`);
          cleanupOutput(job.output);
        }
        done();
      });
    } catch (e) {
      log.warn(`Transcode ${job.id} could not start; serving original:`, e);
      done();
    }
  });
}

// Drop the queue and kill any in-flight encode (call on app quit) so we never strand
// a child process or leave a half-written rendition.
export function cancelAllTranscodes(): void {
  queue = [];
  if (activeProc) {
    try {
      activeProc.kill('SIGKILL');
    } catch {
      /* ignore */
    }
    activeProc = null;
  }
}
