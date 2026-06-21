// sw.js — Service Worker for AMICI ERP
const CACHE_NAME = 'amici-static-v1';
const STATIC_ASSETS = ['/','/index.html','/style.css','/favicon.svg'];

self.addEventListener('install',(event)=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate',(event)=>{
  event.waitUntil(Promise.all([clients.claim(),caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))]));
});

self.addEventListener('fetch',(event)=>{
  const url=new URL(event.request.url);
  if(STATIC_ASSETS.includes(url.pathname))
    event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));
});

self.addEventListener('push',(event)=>{
  let payload={};
  try{payload=event.data?event.data.json():{};}catch(e){payload={body:event.data?event.data.text():''};}
  const title=payload.title||'AMICI ERP';
  const options={
    body:payload.body||'You have a new update.',
    icon:payload.icon||'/favicon.svg',
    badge:payload.badge||'/favicon.svg',
    tag:payload.tag||'amici-notification',
    renotify:true,
    vibrate:[200,100,200],
    data:{url:payload.url||'/',event_type:payload.event_type||null},
    actions:[{action:'open',title:'View'},{action:'dismiss',title:'Dismiss'}],
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',(event)=>{
  event.notification.close();
  if(event.action==='dismiss')return;
  const targetUrl=event.notification?.data?.url||'/';
  const fullDestUrl=new URL(targetUrl,self.location.origin).href;
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of clients){if(c.url===fullDestUrl){if('focus'in c){c.postMessage({type:'open-url',url:fullDestUrl});return c.focus();}}}
    for(const c of clients){const u=new URL(c.url);if(u.origin===self.location.origin){if('navigate'in c&&'focus'in c){await c.navigate(fullDestUrl);c.postMessage({type:'open-url',url:fullDestUrl});return c.focus();}}}
    if(self.clients.openWindow)return self.clients.openWindow(fullDestUrl);
  })());
});
