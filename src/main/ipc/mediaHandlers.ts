import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { mediaAdd, mediaId } from '@/shared/schemas/media';
import { mediaService } from '../services/mediaService';
import { handle } from './registry';

const noInput = z.undefined();

// Media domain IPC — every payload zod-validated at the main boundary (§5.3).
// File enumeration/dialog/serving all live in main (§1.3); the renderer only
// gets library metadata + the app-media:// urls it builds from item ids.
export function registerMediaHandlers(): void {
  handle(CHANNELS.media.list, noInput, () => mediaService.list());
  handle(CHANNELS.media.import, noInput, () => mediaService.import());
  handle(CHANNELS.media.add, mediaAdd, ({ paths }) => mediaService.add(paths));
  handle(CHANNELS.media.remove, mediaId, ({ id }) => mediaService.remove(id));
}
