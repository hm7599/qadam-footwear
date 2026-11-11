// Register the service worker (PWA + push notifications)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  });
}
