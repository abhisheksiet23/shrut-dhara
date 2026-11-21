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
    allowlist: [
      /^\/(?:read(?:\/[^.]*)?|listen(?:\/shastraparijna)?|library|acharanga|bookmarks|settings)?\/?$/,
    ],
  }),
);

const isMedia = (url: URL, request: Request) =>
  url.origin === self.location.origin &&
  (request.destination === 'audio' || request.headers.has('range')) &&
  (url.pathname.startsWith('/audio/') || /^\/narration\/shastraparijna\/s\d+\.mp3$/.test(url.pathname));

registerRoute(
  ({ url, request }) => isMedia(url, request),
  async ({ request, url }) => {
    const cache = await caches.open('shrutdhara-media-v1');
    const saved = await cache.match(url.pathname);
    if (saved) return request.headers.has('range') ? createPartialResponse(request, saved) : saved;
    // The real narration may stream online when not saved; the tone fixture never does.
    if (url.pathname.startsWith('/narration/')) return fetch(request);
    return new Response('Save the complete audio before offline playback.', { status: 503 });
  },
);

// Deliberately retain the browser's waiting-worker lifecycle. No skipWaiting or clientsClaim.
