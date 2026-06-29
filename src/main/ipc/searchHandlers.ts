import { CHANNELS } from '@/shared/constants/channels';
import { searchQueryRequest } from '@/shared/schemas/search';
import { searchService } from '../services/searchService';
import { handle } from './registry';
import type { SearchResults } from '@/shared/schemas/search';

// Global-search IPC — zod-validated at the main boundary (§5.3). One query fans
// over the existing scripture/song/media services; the renderer never reaches
// those services directly (§1.3). The ⌘K palette (Stage B2) consumes this.
export function registerSearchHandlers(): void {
  handle(
    CHANNELS.search.query,
    searchQueryRequest,
    ({ query, limit }): SearchResults => searchService.query(query, limit),
  );
}
