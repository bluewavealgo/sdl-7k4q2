const V="sdl-v6";
const CORE=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
const CDN=["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];
/* no skipWaiting on install: a new version waits until you press Refresh in the app */
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:"reload"}))).then(()=>Promise.all(CDN.map(u=>c.add(u).catch(()=>{}))))));});
self.addEventListener("message",e=>{if(e.data==="skipWaiting")self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){
    /* cache first: the app you see stays the same until you choose to refresh */
    e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==="navigate"?c.match("index.html"):null)).then(m=>m||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;}))).catch(()=>caches.match("index.html")));return;}
  if(/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(u.hostname)){
    e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res;})));}
});