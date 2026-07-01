import { app } from 'electron';
import { Jimp } from 'jimp';
import path from 'node:path';
import { mkdirSync, statSync } from 'node:fs';
import { mediaRepository } from '../db/repositories/mediaRepository';
import { capabilityService } from './capabilityService';
import { getAudienceTargetSize } from '../windows/windowManager';
import { planFit, shouldOptimizeImage, effectiveTarget, renditionExt, type Size } from './mediaPipeline';
import { shouldTranscodeVideo, buildFfmpegArgs, videoTarget } from './videoPipeline';
import { enqueueTranscode } from './transcodeSidecar';
import log from '../infra/logger';

// Image pre-scaling on import (B6b). Decodes oversized images ONCE at import time
// and writes a projector-fit rendition to a userData cache, so the projector never
// decodes a 20MP/4K image live. Pure-JS (jimp) so there is no native packaging
// surface — the native sidecar is reserved for video transcode (B6c).
//
// ALWAYS error-isolated: any failure (odd format, decode error, huge file, no disk)
// leaves no rendition and the ORIGINAL is served. A bad file can never block or crash
// the import (§5.7).

function cacheDir(): string {
  const dir = path.join(app.getPath('userData'), 'media-cache');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function optimizeImage(id: number, originalPath: string): Promise<void> {
  try {
    const ext = path.extname(originalPath);
    const bytes = statSync(originalPath).size;
    const decision = shouldOptimizeImage(ext, bytes);
    if (!decision.ok) {
      log.info(`Media optimize: skip ${id} (${decision.reason}); serving original.`);
      return;
    }

    const target = effectiveTarget(getAudienceTargetSize(), capabilityService.get().tier);
    const image = await Jimp.read(originalPath);
    const source: Size = { width: image.width, height: image.height };
    const fit = planFit(source, target);
    if (!fit) return; // already fits the projector — the original is optimal

    image.resize({ w: fit.width, h: fit.height });
    const out = path.join(cacheDir(), `${id}_${fit.width}x${fit.height}${renditionExt(ext)}`);
    await image.write(out as `${string}.${string}`);
    mediaRepository.setRendition(id, out);
    log.info(
      `Media optimize: ${id} ${source.width}x${source.height} → ${fit.width}x${fit.height}.`,
    );
  } catch (e) {
    log.warn(`Media optimize failed for ${id}; serving original:`, e);
  }
}

// Queue a video for out-of-process transcode to a projector-fit H.264 rendition (B6c).
// NON-BLOCKING: returns immediately (videos are slow) — the original is served until
// the background transcode records its rendition. Error-isolated: a skip/failure just
// leaves the original. Pre-flight guards format/size; the sidecar caps time + isolates
// the encode in a child process.
export function optimizeVideo(id: number, originalPath: string): void {
  try {
    const ext = path.extname(originalPath);
    const bytes = statSync(originalPath).size;
    const decision = shouldTranscodeVideo(ext, bytes);
    if (!decision.ok) {
      log.info(`Media optimize: skip video ${id} (${decision.reason}); serving original.`);
      return;
    }
    const tier = capabilityService.get().tier;
    const target = videoTarget(getAudienceTargetSize(), tier);
    const out = path.join(cacheDir(), `${id}_v${target.width}x${target.height}.mp4`);
    enqueueTranscode({ id, input: originalPath, output: out, args: buildFfmpegArgs(originalPath, out, target, tier) });
    log.info(`Media optimize: queued video ${id} → ${target.width}x${target.height} (background).`);
  } catch (e) {
    log.warn(`Media optimize: could not queue video ${id}; serving original:`, e);
  }
}
