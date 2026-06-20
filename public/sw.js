self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch handler to meet PWA requirements
  event.respondWith(
    fetch(event.request).catch((err) => {
      // Return a basic offline message if network is down
      return new Response("Antigravity Fin is offline. Vui lòng kết nối Internet.");
    })
  );
});
