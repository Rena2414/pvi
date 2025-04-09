
const CACHE_NAME = "pwa-cache-v1";



const ASSETS = [
    "index.html",
    "dashboard.html",
    "mainWindow.html",
    "messages.html",
    "tasks.html",

    "css/styles.css",
    "css/respSize.css",

    "css/assets/images/Background.png",
    "css/assets/images/cat.jpg",
    "css/assets/images/delete.png",
    "css/assets/images/edit.png",
    "css/assets/images/gameModelRender.png",
    "css/assets/images/plane.png",
    "css/assets/images/pohoda.png",
    "css/assets/images/sherlock.jpg",
    "css/assets/images/icon192.png",
    "css/assets/images/icon128.png",

    "scripts.js",
  ];



self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кешування ресурсів...");
      return cache.addAll(ASSETS).catch(console.error);
    })
  );
});



self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {

        const networkFetch = fetch(event.request).then((networkResponse) => {

          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });


        return cachedResponse || networkFetch;
      });
    })
  );
});



self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) 
          .map((key) => caches.delete(key))   
      );
    }).then(() => {
      console.log("Новий Service Worker активовано.");
      return self.clients.claim(); 
    })
  );
});