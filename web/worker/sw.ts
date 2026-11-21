/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { createPartialResponse } from 'workbox-range-requests';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    allowlist: [/^\/(?:read(?:\/[^.]*)?|listen|library|bookmarks|settings)?\/?$/],
  }),
);

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/audio/') &&
    (request.destination === 'audio' || request.headers.has('range')),
  async ({ request, url }) => {
    const cache = await caches.open('shrutdhara-media-v1');
    const saved = await cache.match(url.pathname);
    if (!saved)
      return new Response('Save the complete audio before offline playback.', { status: 503 });
    if (request.headers.has('range')) return createPartialResponse(request, saved);
    return saved;
  },
);

// Deliberately retain the browser's waiting-worker lifecycle. No skipWaiting or clientsClaim.
