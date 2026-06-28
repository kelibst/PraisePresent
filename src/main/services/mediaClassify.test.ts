import { describe, it, expect } from 'vitest';
import { classifyMedia, baseName } from './mediaClassify';

describe('classifyMedia', () => {
  it('classifies images, video, and audio by extension (case-insensitive)', () => {
    expect(classifyMedia('/a/b/photo.JPG')).toBe('image');
    expect(classifyMedia('bg.png')).toBe('image');
    expect(classifyMedia('clip.mp4')).toBe('video');
    expect(classifyMedia('loop.WEBM')).toBe('video');
    expect(classifyMedia('track.mp3')).toBe('audio');
    expect(classifyMedia('voice.flac')).toBe('audio');
  });

  it('returns null for unsupported or extension-less files', () => {
    expect(classifyMedia('notes.txt')).toBeNull();
    expect(classifyMedia('archive.zip')).toBeNull();
    expect(classifyMedia('README')).toBeNull();
    expect(classifyMedia('.hiddenfile')).toBeNull(); // "hiddenfile" is not a known ext
  });
});

describe('baseName', () => {
  it('extracts the file name across posix and windows separators', () => {
    expect(baseName('/home/user/Pictures/bg.jpg')).toBe('bg.jpg');
    expect(baseName('C:\\Media\\clip.mp4')).toBe('clip.mp4');
    expect(baseName('plain.png')).toBe('plain.png');
  });
});
