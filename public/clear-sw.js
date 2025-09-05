// Clear Service Worker Script - Use this for debugging
// Add ?clear-sw=1 to any URL to clear service worker and caches

(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const clearSW = urlParams.get('clear-sw');
  
  if (clearSW === '1') {
    console.log('🧹 Clearing Service Worker and Caches...');
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
          console.log('🗑️ Unregistered service worker:', registration.scope);
        }
      });
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        console.log('✅ All caches cleared!');
        // Remove the query parameter and reload
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.location.replace(newUrl);
      });
    }
  }
})();