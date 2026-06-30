import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { song, songCreate, songId, songImportText } from '@/shared/schemas/song';
import { songService } from '../services/songService';
import { handle } from './registry';

const noInput = z.undefined();

// Songs domain IPC — every payload zod-validated at the main boundary (§5.3).
export function registerSongHandlers(): void {
  handle(CHANNELS.songs.list, noInput, () => songService.list());
  handle(CHANNELS.songs.get, songId, ({ id }) => songService.get(id));
  handle(CHANNELS.songs.create, songCreate, (input) => songService.create(input));
  handle(CHANNELS.songs.update, song, (input) => {
    songService.update(input);
  });
  handle(CHANNELS.songs.delete, songId, ({ id }) => {
    songService.delete(id);
  });
  handle(CHANNELS.songs.importText, songImportText, (input) => songService.importText(input));
}
