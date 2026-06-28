// The custom scheme that serves DB-allowlisted local media to the audience and
// presenter windows. Shared so the main protocol handler and the renderer agree
// on the exact URL shape (CLAUDE.md §5.2 — one source of truth). Pure constants,
// no platform APIs.
export const MEDIA_SCHEME = 'app-media';

// app-media://media/<id> — the handler (main) resolves <id> to a path via the
// media library; the renderer builds this from a MediaItem.id.
export function mediaUrl(id: number): string {
  return `${MEDIA_SCHEME}://media/${id}`;
}
