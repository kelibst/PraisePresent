import { songRepository } from '../db/repositories/songRepository';
import { parsePlainText } from './songImport';
import type { Song, SongCreate, SongImportText } from '@/shared/schemas/song';

export const songService = {
  list: () => songRepository.list(),
  get: (id: number) => songRepository.get(id),
  create: (input: SongCreate) => songRepository.create(input),
  update: (input: Song) => songRepository.update(input),
  delete: (id: number) => songRepository.delete(id),
  importText: (input: SongImportText): number =>
    songRepository.create({
      title: input.title,
      author: input.author,
      ccli: '',
      tags: [],
      sections: parsePlainText(input.text),
    }),
};
