/* Synthetic preview only. This file is never loaded by the working index.html. */
(() => {
  'use strict';
  const PREFIX='hub_preview_';
  const user={id:'00000000-0000-4000-8000-000000000001',email:'demo@preview.invalid'};
  let scenario=new URLSearchParams(location.search).get('scenario')||'empty';
  const allowed=['empty','connected','forbidden','error','loading','invalid','expired'];
  if(!allowed.includes(scenario))scenario='empty';
  const reply=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}}));
  const token=(exp)=>'preview.'+btoa(JSON.stringify({sub:user.id,exp}))+'.not-a-signed-token';
  const session=()=>({access_token:token(Math.floor(Date.now()/1000)+3600),refresh_token:'synthetic-preview-only',user});
  let disconnected=false;
  const calls=[];
  window.HUB_CONFIG=Object.freeze({supabaseUrl:'https://preview.invalid',supabasePublishableKey:'preview-only-not-a-key',mode:'preview'});
  window.fetch=(input,options={})=>{
    const u=new URL(typeof input==='string'?input:input.url,location.href);
    calls.push({origin:u.origin,path:u.pathname,method:options.method||'GET'});
    if(u.origin!=='https://preview.invalid')return Promise.reject(new Error('PREVIEW_EXTERNAL_NETWORK_DENIED'));
    if(u.pathname==='/auth/v1/user')return scenario==='expired'?reply({msg:'Synthetic expired session'},401):reply(user);
    if(u.pathname==='/auth/v1/token')return ['invalid','expired'].includes(scenario)?reply({msg:'Неверные тестовые данные'},401):reply(session());
    if(u.pathname==='/auth/v1/signup'||u.pathname==='/auth/v1/resend')return reply({user});
    if(u.pathname==='/rest/v1/rpc/tuya_connection_revoke_v1'){disconnected=true;return reply(null);}
    if(u.pathname==='/rest/v1/service_connections'){
      if(scenario==='loading')return new Promise(resolve=>setTimeout(()=>resolve(new Response('[]',{status:200})),800));
      if(scenario==='forbidden')return reply({private:'not for UI'},403);
      if(scenario==='error')return reply({private:'not for UI'},500);
      return reply(scenario==='connected'&&!disconnected?[{id:'00000000-0000-4000-8000-000000000002',region:'DEMO',status:'ACTIVE'}]:[]);
    }
    if(u.pathname==='/rest/v1/tuya_devices')return reply([{device_id:'synthetic-lamp',display_name:'Синтетическая лампа',category:'Тест',online:true}]);
    return reply({error:'PREVIEW_ROUTE_DISABLED'},403);
  };
  const prepareForm=()=>{
    const e=document.getElementById('email'),p=document.getElementById('password');
    e.value=user.email;p.value='preview-only';e.readOnly=true;p.readOnly=true;
    e.autocomplete='off';p.autocomplete='off';
  };
  const clear=()=>['access_token','refresh_token','user'].forEach(k=>localStorage.removeItem(PREFIX+k));
  window.HUB_PREVIEW=Object.freeze({
    calls,
    scenario:()=>scenario,
    setScenario(value){if(!allowed.includes(value))throw Error('PREVIEW_SCENARIO_INVALID');scenario=value;disconnected=false;},
    seedExpired(){clear();localStorage.setItem(PREFIX+'access_token',token(1));localStorage.setItem(PREFIX+'refresh_token','synthetic-preview-only');localStorage.setItem(PREFIX+'user',JSON.stringify(user));},
    clear
  });
  prepareForm();
  document.getElementById('previewEnter').onclick=()=>{prepareForm();document.getElementById('form').requestSubmit();};
  document.getElementById('previewReset').onclick=()=>{clear();location.hash='#/today';location.reload();};
  const select=document.getElementById('previewScenario');select.value=scenario;
  select.onchange=()=>{
    const u=new URL(location.href);u.searchParams.set('scenario',select.value);location.assign(u.href);
  };
  // Never offer real production connector instructions in this isolated preview.
  const help=document.querySelector('.helpBody');
  if(help)help.textContent='В предпросмотре подключения отключены. Проверяются только интерфейс и синтетические состояния.';
})();
