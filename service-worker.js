/*
We can't hardcode an absolute path if we want this to work in development
and production, because this page will be hosted at the github.io/projectname
subroute. Instead, we'll use relative paths.

We didn't include the images in assets because every browser has a cache limit,
which can range anywhere from 50 MB to 250 MB. We've prioritized caching the
JavaScript and HTML files so that the site is at least functional.
*/
const FILES_TO_CACHE = [
   "./index.html",
   "./events.html",
   "./tickets.html",
   "./schedule.html",
   "./assets/css/style.css",
   "./assets/css/bootstrap.css",
   "./assets/css/tickets.css",
   "./dist/app.bundle.js",
   "./dist/events.bundle.js",
   "./dist/tickets.bundle.js",
   "./dist/schedule.bundle.js"
];

const APP_PREFIX = 'FoodFest-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;

/*
We use self instead of window.addEventListener because service workers run
before the window object has even been created. Hence, we use the self keyword
to instantiate listeners on the service worker. The context of self here refers
to the service worker object.
*/
self.addEventListener('install', function (e) {
   /*
   We use e.waitUntil to tell the browser to wait until the work is complete
   before terminating the service worker. This ensures that the service worker
   doesn't move on from the installing phase until it's finished executing all
   of its code.
   */
   e.waitUntil(
      /*
      We use caches.open to find the specific cache by name, then add every
      file in the FILES_TO_CACHE array to the cache.
      */
      caches.open(CACHE_NAME).then(function (cache) {
         console.log('installing cache : ' + CACHE_NAME)
         return cache.addAll(FILES_TO_CACHE)
      })
   )
});


/*
.keys() returns an array of all cache names, which we're calling keyList.
keyList is a parameter that contains all cache names under <username>.github.io.
Because we may host many sites from the same URL, we should filter out caches
that have the app prefix. We'll capture the ones that have that prefix,
stored in APP_PREFIX, and save them to an array called cacheKeeplist using
the .filter() method.
*/
self.addEventListener('activate', function (e) {
   e.waitUntil(
      caches.keys().then(function (keyList) {
         let cacheKeeplist = keyList.filter(function (key) {
            return key.indexOf(APP_PREFIX);
         });

         /*
         Remember that we set up CACHE_NAME as a global constant to
         help keep track of which cache to use.
         */
         cacheKeeplist.push(CACHE_NAME);

         /*
         This last bit of the activate listener returns a Promise that
         resolves once all old versions of the cache have been deleted.
         */
         return Promise.all(keyList.map(function (key, i) {
            if (cacheKeeplist.indexOf(key) === -1) {
               console.log('deleting cache : ' + keyList[i]);
               return caches.delete(keyList[i]);
            };
         }));
      })
   );
});


// Retrieve info from the cache
/*
Here, we listen for the fetch event, log the URL of the requested resource,
and then begin to define how we will respond to the request.
*/
self.addEventListener('fetch', function (e) {
   console.log('fetch request : ' + e.request.url)
   // We respondWith to intercept the fetch request
   e.respondWith(
      /*
      Check to see if the request is stored in the cache or not. If it is
      stored in the cache, e.respondWith will deliver the resource directly
      from the cache; otherwise the resource will be retrieved normally.
      Use .match() to determine if the resource already exists in caches.
      */
      caches.match(e.request).then(function (request) {
         /*
         If it does, we'll log the URL to the console with a message and then
         return the cached resource.
         */
         if (request) { // if cache is available, respond with cache
            console.log('responding with cache : ' + e.request.url)
            return request
         }
         /*
         If the resource is not in caches, we allow the resource to be retrieved
         from the online network as usual
         */
         else {       // if there are no cache, try fetching request
            console.log('file is not cached, fetching : ' + e.request.url)
            return fetch(e.request)
         };

         // You can omit if/else for console.log & put one line below like this too.
         // return request || fetch(e.request)
      })
   );
});