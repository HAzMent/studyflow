const CACHE = "studyflow-sw-safe-v1";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.webmanifest",
  "/studyflow-icon.svg",
  "/offline.html",
  "/taskflow-pro.js",
  "/taskflow-pro.css"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache =>
        cache.addAll(STATIC_FILES)
      )
  );

  self.skipWaiting();

});


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate", event => {

  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() =>
        self.clients.claim()
      )
  );

});


/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch", event => {

  const request = event.request;
  const url = new URL(request.url);


  // Only handle normal web requests.
  if(
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ){
    return;
  }


  // Never let the PWA cache interfere with local development.
  if(
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1"
  ){
    return;
  }


  // API calls and non-GET requests must always go directly
  // to the server.
  if(
    request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  ){
    return;
  }


  event.respondWith(
    (async () => {

      try {

        const response =
          await fetch(request);


        // Cache only successful same-origin responses.
        if(
          response &&
          response.ok &&
          url.origin === self.location.origin
        ){

          try {

            const cache =
              await caches.open(CACHE);

            await cache.put(
              request,
              response.clone()
            );

          } catch(cacheError){

            console.warn(
              "StudyFlow SW cache write skipped:",
              cacheError
            );

          }

        }


        return response;

      } catch(networkError){

        const cached =
          await caches.match(request);

        if(cached){
          return cached;
        }


        if(
          request.mode === "navigate"
        ){

          const offline =
            await caches.match(
              "/offline.html"
            );

          if(offline){
            return offline;
          }

        }


        // CRITICAL:
        // respondWith() must ALWAYS receive a Response.
        return Response.error();

      }

    })()
  );

});
