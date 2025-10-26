// Minimal service worker to unregister itself
// This fixes the 500 error for browsers that previously registered the SW

self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Unregister this service worker
    self.registration.unregister().then(() => {
      // Get all clients (open tabs/windows)
      return self.clients.matchAll();
    }).then((clients) => {
      // Reload each client to clear the SW
      clients.forEach(client => {
        if (client.url && client.navigate) {
          client.navigate(client.url);
        }
      });
    })
  );
});
