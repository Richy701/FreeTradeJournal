/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import type { RouteHandlerCallback } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Activate a new deploy immediately: without skipWaiting/clientsClaim it sits
// in "waiting" until every tab is closed, so open tabs keep serving stale
// chunks (the 404 window). The page then applies the update quietly on the
// next in-app navigation (src/lib/sw-update.ts) instead of reloading mid-task.
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Workbox precaching (VitePWA injects the manifest)
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  /\/images\/.*/i,
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })],
  })
);

// Cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// Page loads go to the network first so a refresh always gets the newest
// deploy (cache-first served the old precached index.html, and users needed
// several refreshes to pick up a release). The precached shell is only the
// fallback for offline or a server slower than 3s. /__/ is Firebase's
// reserved namespace: the Google sign-in popup opens /__/auth/handler on this
// origin (proxied in vercel.json) and must reach the network.
const pagesNetworkFirst = new NetworkFirst({
  cacheName: 'pages',
  networkTimeoutSeconds: 3,
  plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 })],
});
const shellFallback = createHandlerBoundToURL('/index.html');
const navigationHandler: RouteHandlerCallback = async (options) => {
  try {
    const response = await pagesNetworkFirst.handle(options);
    if (response) return response;
  } catch {
    // Offline with nothing cached for this URL: fall through to the shell
  }
  return shellFallback(options);
};
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/api/, /^\/__\//],
});
registerRoute(navigationRoute);

// ─── Push Notification Handlers ─────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let title = 'FreeTradeJournal';
  let options: NotificationOptions = {
    body: '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'ftj-notification',
  };

  try {
    const data = event.data.json();
    title = data.title || title;
    options = {
      body: data.body || '',
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      data: data.data || {},
      tag: data.tag || 'ftj-notification',
    };
  } catch {
    options.body = event.data.text() || 'You have a new notification.';
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(url);
    })
  );
});
