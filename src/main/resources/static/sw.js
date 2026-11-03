const CACHE_NAME='reuse-plus-gallery-v7-dark-menu';
const CORE=['./','./index.html','./styles.css','./script.js','./manifest.webmanifest','./assets/favicon.svg','./assets/reuse-plus-logo.svg','./assets/photo-unavailable.svg','./assets/scene-fallback.svg','./assets/experience.css','./assets/refinement.css','./assets/header.css','./assets/lora-italic-latin.woff2','./assets/scene-entry.mjs','./assets/typography.mjs','./assets/inter-latin.woff2'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('reuse-plus-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Private responses, API, uploads and other origins are never cached.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/uploads/'))return;
 const known=CORE.some(asset=>new URL(asset,self.location.href).pathname===url.pathname);
 if(!known||url.search)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,clone));}return response;}).catch(()=>caches.match(event.request)));
});
