import type { MediaKind } from '@/shared/schemas/media';

// PURE media classification by file extension (CLAUDE.md §5.5 keeps testable
// logic out of the native-DB modules). Unknown/unsupported extensions return
// null so the caller skips them rather than registering junk.

const EXT_KIND: Record<string, MediaKind> = {
  // images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  avif: 'image',
  // video
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mkv: 'video',
  m4v: 'video',
  // audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  flac: 'audio',
  aac: 'audio',
};

export function classifyMedia(filePath: string): MediaKind | null {
  const dot = filePath.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = filePath.slice(dot + 1).toLowerCase();
  return EXT_KIND[ext] ?? null;
}

// File basename (cross-platform), used as the default display name.
export function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}
