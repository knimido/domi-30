/* Cookie-free, simple POST requests. No iframe, Google browser session, or
   google.script.run dependency. Authentication stays in the JSON request body. */
window.PartyTransport=(()=>{
 const protocol='domi-party-3.1';
 async function call(action,params={}){
  const endpoint=window.PARTY_CONFIG?.backendUrl||'';
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))throw Error('The Google connection URL is missing or invalid in config.js.');
  const id=crypto.randomUUID(),controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),action==='audioUpload'?90000:45000);
  let response,text;
  try{
   response=await fetch(endpoint,{
    method:'POST',credentials:'omit',redirect:'follow',
    headers:{'Content-Type':'text/plain;charset=UTF-8'},
    body:JSON.stringify({protocol,id,action,params}),
    signal:controller.signal
   });
   text=await response.text();
  }catch(e){
   if(controller.signal.aborted)throw Error('Google took too long to respond. Your input is still here. Refresh to check whether a save arrived before trying it again.');
   throw Error('Could not reach the Google game service. Check your connection and that the latest Code.gs was published with access set to Anyone.');
  }finally{clearTimeout(timeout);}
  if(!response.ok)throw Error('Google returned an error ('+response.status+'). Check the web-app deployment and try again.');
  let data;try{data=JSON.parse(text);}catch(e){throw Error('Google returned a page instead of game data. Publish the updated Code.gs as a new version of the existing deployment, with access set to Anyone.');}
  if(data.protocol!==protocol||data.id!==id||typeof data.ok!=='boolean')throw Error('Google is running an older or unexpected version. Publish the latest Code.gs and reload this page.');
  if(!data.ok)throw Error(data.error||'Google could not save this request.');
  return data.result;
 }
 return {call};
})();
