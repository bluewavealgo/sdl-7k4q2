const V="sdl-202610300743";
const CORE=["./","index.html","app.css?v=202610300743","app.js?v=202610300743","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png",
 "vendor/firebase-app-compat.js","vendor/firebase-auth-compat.js","vendor/firebase-firestore-compat.js","vendor/pdf.min.js","vendor/pdf.worker.min.js"];
/* a new version installs quietly and waits; it is applied only when the user presses Sync */
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:"reload"})))));});
self.addEventListener("message",e=>{if(e.data==="skipWaiting")self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){
    if(u.pathname.endsWith("/news.json"))return; /* news is fetched live, only on Sync */
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||(r.mode==="navigate"?c.match("index.html"):null)).then(m=>m||fetch(r).then(res=>{if(res.ok&&!u.search)c.put(r,res.clone());return res;}))).catch(()=>caches.match("index.html")));return;}
  if(/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){
    e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res;})));}
});