const CACHE = "studyflow-v3";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.webmanifest",
  "/studyflow-icon.svg",
  "/offline.html"
];

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
  );

  self.clients.claim();
});


self.addEventListener("fetch", event => {

  const request = event.request;

  const url =
    new URL(request.url);


  if(
    request.method !== "GET" ||
    url.pathname.startsWith("/api/")
  ){
    return;
  }


  event.respondWith(

    fetch(request)

      .then(response => {

        const copy =
          response.clone();


        caches
          .open(CACHE)
          .then(cache =>
            cache.put(
              request,
              copy
            )
          );


        return response;

      })

      .catch(async () => {

        const cached =
          await caches.match(request);


        if(cached){
          return cached;
        }


        if(
          request.mode === "navigate"
        ){
          return caches.match(
            "/offline.html"
          );
        }

      })

  );

});
