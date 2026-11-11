// QADAM Men's Footwear - Service Worker & Push Notification Handler
const CACHE_NAME = "qadam-cache-v6";
const OFFLINE_URL = "/index.html";

// App shell shared by both installable apps (customer "/" and admin "/admin")
const PRECACHE_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/manifest-admin.json",
  "/favicon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/admin-192.png",
  "/icons/admin-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always live data

  // Pages: network first so new deployments show immediately; fall back to cached shell offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(OFFLINE_URL, copy));
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Manifests: network first (they decide which app is installed)
  if (url.pathname.endsWith(".json")) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Static files (hashed JS/CSS, images, fonts): cache first, then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && /.(js|css|svg|png|jpe?g|webp|gif|woff2?)$/i.test(url.pathname)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

// PUSH NOTIFICATION LISTENER
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received:', event);
  let data = {
    title: 'QADAM Drop Alert',
    body: 'A new limited edition sneaker just dropped. Check it out now!',
    icon: '/icons/icon-192.png',
    badge: '/favicon-32.png',
    url: '/',
    tag: 'qadam-notification'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const isOrder = data.kind === "new-order";
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/favicon-32.png",
    tag: data.tag || ("qadam-notification-" + Date.now()),
    renotify: true,
    requireInteraction: !!data.requireInteraction,
    data: { url: data.url || "/" },
    vibrate: isOrder ? [300, 120, 300, 120, 300] : [200, 100, 200],
    actions: isOrder
      ? [{ action: "open", title: "View order" }, { action: "close", title: "Later" }]
      : [{ action: "explore", title: "View Drop" }, { action: "close", title: "Dismiss" }]
  };

  event.waitUntil((async () => {
    // Let any open tab know (storefront shows in-app alert; admin triggers order popup/sound)
    const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
    wins.forEach((w) => w.postMessage({ type: "QADAM_PUSH", payload: data }));
    await self.registration.showNotification(data.title, options);
  })());
});

// NOTIFICATION CLICK LISTENER
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (client.url !== fullUrl && 'navigate' in client) {
            try { await client.navigate(fullUrl); } catch { /* ignore */ }
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// Let the page activate a new service worker immediately ("Update" button)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
