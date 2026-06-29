import { dialog } from 'electron';
import { existsSync, unlinkSync } from 'node:fs';
import { mediaRepository } from '../db/repositories/mediaRepository';
import { classifyMedia, baseName } from './mediaClassify';
import { optimizeImage, optimizeVideo } from './mediaOptimizer';
import log from '../infra/logger';
import type { MediaItem } from '@/shared/schemas/media';

// Media service: a library that references files by their original path (no
// copy). `add` is the single registration path (the OS picker and a future
// drag-drop both funnel here); unsupported files are skipped, not errored, so
// one bad selection never fails the whole import (§5.7).

const FILTERS = [
  {
    name: 'Media',
    extensions: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'svg',
      'avif',
      'mp4',
      'webm',
      'mov',
      'mkv',
      'm4v',
      'mp3',
      'wav',
      'ogg',
      'm4a',
      'flac',
      'aac',
    ],
  },
  { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif'] },
  { name: 'Video', extensions: ['mp4', 'webm', 'mov', 'mkv', 'm4v'] },
  { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] },
];

export const mediaService = {
  list: (): MediaItem[] => mediaRepository.list(),

  // Register known paths (classifiable ones only). Returns the full library so
  // the renderer refreshes in one round-trip. Images are pre-scaled to a projector
  // -fit rendition on import (B6b) — error-isolated, so a bad file never fails the
  // import; it just keeps its original.
  add: async (paths: string[]): Promise<MediaItem[]> => {
    for (const p of paths) {
      const kind = classifyMedia(p);
      if (!kind) {
        log.warn(`Media add: skipping unsupported file ${p}`);
        continue;
      }
      // Defense-in-depth: only register files that actually exist, so a bad
      // renderer-supplied path can't seed the app-media:// allow-list (§1.3).
      if (!existsSync(p)) {
        log.warn(`Media add: skipping non-existent file ${p}`);
        continue;
      }
      const id = mediaRepository.add(baseName(p), p, kind);
      if (kind === 'image') await optimizeImage(id, p);
      else if (kind === 'video') optimizeVideo(id, p); // background (non-blocking)
    }
    return mediaRepository.list();
  },

  // Open the OS file picker (main-side), then register the chosen files.
  import: async (): Promise<MediaItem[]> => {
    const result = await dialog.showOpenDialog({
      title: 'Add media',
      properties: ['openFile', 'multiSelections'],
      filters: FILTERS,
    });
    if (result.canceled || result.filePaths.length === 0) return mediaRepository.list();
    return mediaService.add(result.filePaths);
  },

  remove: (id: number): MediaItem[] => {
    // Delete the cached rendition (if any) so we don't leak files; the original is
    // never touched (the library only references it). Best-effort — never throws.
    const info = mediaRepository.getServeInfo(id);
    if (info?.rendition) {
      try {
        unlinkSync(info.rendition);
      } catch (e) {
        log.warn(`Media remove: could not delete rendition for ${id}:`, e);
      }
    }
    mediaRepository.remove(id);
    return mediaRepository.list();
  },
};
