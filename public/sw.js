self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
  const data=e.data?.json()||{title:'AMICI ERP',body:'New notification'};
  e.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/favicon.svg'}));
});
