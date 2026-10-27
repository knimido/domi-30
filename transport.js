/* Exact-origin, nonce-bound connection to the Google HTML-service bridge.
   All credentials remain in message bodies; never in URLs. */
window.PartyTransport=(()=>{
 let remote=null,origin='',frame=null,connecting=null,channel='';
 const pending=new Map();
 const googleOrigin=o=>/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(o)||/^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(o);
 function connect(){
  if(connecting)return connecting;
  connecting=new Promise((resolve,reject)=>{
   const endpoint=window.PARTY_CONFIG?.backendUrl||'';
   if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)){reject(Error('The Google connection URL is missing or invalid in config.js.'));return;}
   channel=Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
   const timeout=setTimeout(()=>{window.removeEventListener('message',ready);frame?.remove();connecting=null;reject(Error('Google did not connect. Check the deployment is available to Anyone and that the new Code.gs and Bridge.html were deployed. Then reload.'));},30000);
   function ready(e){
    if(!googleOrigin(e.origin)||e.data?.type!=='party-ready'||e.data.channel!==channel)return;
    remote=e.source;origin=e.origin;clearTimeout(timeout);window.removeEventListener('message',ready);
    remote.postMessage({type:'party-connect',channel},origin);resolve();
   }
   window.addEventListener('message',ready);
   frame=document.createElement('iframe');frame.title='Game connection';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-10px';frame.tabIndex=-1;
   frame.src=endpoint+'?bridge=1&channel='+channel;document.body.appendChild(frame);
  });
  return connecting;
 }
 window.addEventListener('message',e=>{
  if(e.source!==remote||e.origin!==origin||e.data?.channel!==channel||e.data.type!=='party-result')return;
  const item=pending.get(e.data.id);if(!item)return;pending.delete(e.data.id);clearTimeout(item.timer);
  e.data.ok?item.resolve(e.data.result):item.reject(Error(e.data.error||'Google could not save this request.'));
 });
 async function call(action,p={}){
  await connect();
  return new Promise((resolve,reject)=>{
   const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(id);reject(Error('The connection took too long. Check your internet and retry. Your recording or answer is still here.'));},action==='audioUpload'?90000:45000);
   pending.set(id,{resolve,reject,timer});remote.postMessage({type:'party-call',channel,id,action,params:p},origin);
  });
 }
 return {call};
})();
