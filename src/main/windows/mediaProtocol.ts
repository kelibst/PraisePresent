import { protocol, net } from 'electron';
import { pathToFileURL } from 'node:url';
import { mediaRepository } from '../db/repositories/mediaRepository';
import { MEDIA_SCHEME } from '@/shared/constants/media';
import log from '../infra/logger';

// Secure local-media access for the audience/presenter windows (CLAUDE.md §1.3).
// The renderer can ONLY ask for `app-media://media/<id>`; the handler resolves
// <id> to a path via the media library (an ALLOW-LIST) — a path never comes from
// the URL, so there is no traversal/arbitrary-file-read surface. A missing id or
// gone file returns 404, which the audience renders as black (§5.7), never a
// crash or a leaked path.

// MUST run before app 'ready' (privileged schemes are registered at startup).
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]);
}

// Run after app 'ready'. Resolves an id to its allow-listed file and streams it.
export function handleMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    try {
      const id = Number(new URL(request.url).pathname.replace(/^\/+/, ''));
      if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 400 });
      const filePath = mediaRepository.getPath(id);
      if (!filePath) return new Response(null, { status: 404 });
      // net.fetch on a file URL handles range requests (video seeking) for us.
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (e) {
      log.error('app-media protocol error:', e);
      return new Response(null, { status: 404 });
    }
  });
}
