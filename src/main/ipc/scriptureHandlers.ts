import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { referenceLookup, keywordSearch } from '@/shared/schemas/scripture';
import { scriptureService } from '../services/scriptureService';
import { handle } from './registry';

const noInput = z.undefined();

// Scripture domain IPC — every payload zod-validated at the main boundary (§5.3).
export function registerScriptureHandlers(): void {
  handle(CHANNELS.scripture.listTranslations, noInput, () => scriptureService.listTranslations());
  handle(CHANNELS.scripture.listBooks, noInput, () => scriptureService.listBooks());
  handle(CHANNELS.scripture.lookupReference, referenceLookup, ({ query }) =>
    scriptureService.lookupReference(query),
  );
  handle(CHANNELS.scripture.searchKeyword, keywordSearch, ({ query, limit }) =>
    scriptureService.searchKeyword(query, limit),
  );
}
