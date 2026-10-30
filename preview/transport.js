/* Synthetic preview only. This file is never loaded by the working index.html. */
(() => {
  'use strict';
  const PREFIX='hub_preview_';
  const user={id:'00000000-0000-4000-8000-000000000001',email:'demo@preview.invalid'};
  let scenario=new URLSearchParams(location.search).get('scenario')||'empty';
  const allowed=['empty','connected','forbidden','error','loading','invalid','expired','revoke-failed','offline','unauthorized','unavailable','nas-unconfirmed'];
  if(!allowed.includes(scenario))scenario='empty';
  const reply=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}}));
  const token=(exp)=>'preview.'+btoa(JSON.stringify({sub:user.id,exp}))+'.not-a-signed-token';
  const session=()=>({access_token:token(Math.floor(Date.now()/1000)+3600),refresh_token:'synthetic-preview-only',user});
  let disconnected=false;const permissions=[];
  const deviceStores=new Map(),proofs=new Map(),replays=new Map();
  const devicesFor=()=>{if(!deviceStores.has(user.id))deviceStores.set(user.id,[]);return deviceStores.get(user.id);};
  const fixture=()=>({id:'demo-device',provider:'TUYA',category:'home',type:'Лампа',name:'Синтетическая лампа IoT',network:scenario==='offline'?'offline':'online',authorization:scenario==='unauthorized'?'unauthorized':'authorized',readiness:scenario==='unavailable'?'unavailable':'ready',read_allowed:scenario!=='unauthorized',last_success_at:'2026-10-29T10:00:00Z',capabilities:['status','diagnostics','history'],history:[{at:'2026-10-29T10:00:00Z',action:'CHECK',result:'SYNTHETIC'}]});
  const inventory=()=>{const own=devicesFor();return [...(['connected','offline','unauthorized','unavailable','nas-unconfirmed','revoke-failed'].includes(scenario)&&!disconnected&&user.id.endsWith('001')?[fixture()]:[]),...own].filter(x=>!x.revoked);};
  const calls=[];
  window.HUB_CONFIG=Object.freeze({supabaseUrl:'https://preview.invalid',supabasePublishableKey:'preview-only-not-a-key',mode:'preview'});
  window.fetch=(input,options={})=>{
    const u=new URL(typeof input==='string'?input:input.url,location.href);
    calls.push({origin:u.origin,path:u.pathname,method:options.method||'GET'});
    if(u.origin!=='https://preview.invalid')return Promise.reject(new Error('PREVIEW_EXTERNAL_NETWORK_DENIED'));
    if(u.pathname==='/auth/v1/user')return scenario==='expired'?reply({msg:'Synthetic expired session'},401):reply(user);
    if(u.pathname==='/auth/v1/token')return ['invalid','expired'].includes(scenario)?reply({msg:'Неверные тестовые данные'},401):reply(session());
    if(u.pathname==='/auth/v1/signup'||u.pathname==='/auth/v1/resend')return reply({user});
    if(u.pathname==='/rest/v1/rpc/inbox_page_v2')return reply({items:[],next_cursor:null});
    if(u.pathname==='/rest/v1/rpc/project_space_list_v1')return reply([{id:'synthetic-project',name:'Синтетический проект',status:'ACTIVE'}]);
    if(u.pathname==='/rest/v1/rpc/project_space_get')return reply({description:'Только демонстрационный контекст.'});
    if(u.pathname==='/rest/v1/rpc/consilium_commons_list_v1')return reply([]);
    if(u.pathname.startsWith('/rest/v1/rpc/device_')){
      const op=u.pathname.split('/').at(-1),p=JSON.parse(options.body||'{}');
      if(scenario==='loading')return new Promise(resolve=>setTimeout(()=>resolve(new Response(JSON.stringify({items:inventory()}))),800));
      if(scenario==='forbidden')return reply({error:'PRIVATE_SERVER_DETAIL_SENTINEL'},403);
      if(scenario==='error')return reply({error:'PRIVATE_SERVER_DETAIL_SENTINEL'},500);
      if(op==='device_inventory_v1')return reply({items:inventory(),has_more:false});
      if(op==='device_connection_options_v1')return reply({items:p.p_provider==='SYNOLOGY'?(user.id.endsWith('001')?[{id:'owned-nas-one',name:'Синтетический NAS 1'},{id:'owned-nas-two',name:'Синтетический NAS 2'}]:[{id:'second-owner-nas',name:'NAS второго тестового пользователя'}]):p.p_provider==='TUYA'&&user.id.endsWith('001')?[{id:'owned-tuya-connection',name:'Синтетическое подключение Tuya'}]:[]});
      if(op==='device_connection_verify_v1'){
        const own=p.p_provider==='SYNOLOGY'?(user.id.endsWith('001')?['owned-nas-one','owned-nas-two']:['second-owner-nas']):p.p_provider==='TUYA'&&user.id.endsWith('001')?['owned-tuya-connection']:[];if(!own.includes(p.p_connection_id))return reply({},403);
        const id=crypto.randomUUID();proofs.set(id,{owner:user.id,connection:p.p_connection_id,provider:p.p_provider,until:Date.now()+60000});return reply({network:'online',authorization:'authorized',readiness:'ready',proof_id:id,...(p.p_provider==='SYNOLOGY'?{owner_confirmed:scenario!=='nas-unconfirmed'}:{})});
      }
      if(op==='device_register_existing_v1'){
        const key=user.id+':'+p.p_request_key;
        if(replays.has(key))return reply(replays.get(key));
        const proof=proofs.get(p.p_proof_id);
        if(!proof||proof.owner!==user.id||proof.connection!==p.p_connection_id||proof.until<Date.now()||p.p_read!==true||p.p_provider!==proof.provider||(p.p_provider==='SYNOLOGY'&&scenario==='nas-unconfirmed'))return reply({},403);
        proofs.delete(p.p_proof_id);const d={...fixture(),id:crypto.randomUUID(),name:p.p_provider==='SYNOLOGY'?'Синтетический NAS '+(p.p_connection_id==='owned-nas-two'?'2':'1'):'Синтетическое добавленное устройство',...(p.p_provider==='SYNOLOGY'?{provider:'SYNOLOGY',category:'network',type:'NAS'}:{})};devicesFor().push(d);replays.set(key,{id:d.id});return reply({id:d.id});
      }
      const d=inventory().find(x=>x.id===p.p_device_id);if(!d)return reply({},403);
      if(op==='device_detail_v1')return reply(d);
      if(op==='device_diagnose_v1')return reply({...d,secret:'PRIVATE_SERVER_DETAIL_SENTINEL'});
      if(op==='device_revoke_v1'){if(scenario==='revoke-failed')return reply(false);d.revoked=true;if(d.id==='demo-device')disconnected=true;return reply(true);}
      return reply({},403);
    }
    if(u.pathname==='/rest/v1/rpc/tuya_connection_revoke_v1'){if(scenario==='revoke-failed')return reply(false);disconnected=true;return reply(true);}
    if(u.pathname==='/rest/v1/service_connections'){
      if(scenario==='loading')return new Promise(resolve=>setTimeout(()=>resolve(new Response('[]',{status:200})),800));
      if(scenario==='forbidden')return reply({private:'not for UI'},403);
      if(scenario==='error')return reply({private:'not for UI'},500);
      return reply(['connected','revoke-failed'].includes(scenario)&&!disconnected&&user.id.endsWith('001')?[{id:'00000000-0000-4000-8000-000000000002',region:'DEMO',status:'ACTIVE'}]:[]);
    }
    if(u.pathname==='/rest/v1/agents')return reply([{id:'00000000-0000-4000-8000-000000000003',name:'Демо-агент'}]);
    if(u.pathname==='/rest/v1/project_spaces')return reply([{id:'00000000-0000-4000-8000-000000000004',name:'Тестовый проект'}]);
    if(u.pathname==='/rest/v1/tuya_agent_device_permissions')return reply(permissions);
    if(u.pathname==='/rest/v1/rpc/tuya_permission_set_v1'){
      const p=JSON.parse(options.body);
      if(p.p_revoke){const i=permissions.findIndex(x=>x.agent_id===p.p_agent_id&&x.device_id===p.p_device_id&&x.permission===p.p_permission);if(i<0)return reply(false);permissions.splice(i,1);}
      else permissions.push({project_space_id:p.p_project_space_id,agent_id:p.p_agent_id,device_id:p.p_device_id,permission:p.p_permission});
      return reply(true);
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
    switchUser(){user.id=user.id.endsWith('001')?'00000000-0000-4000-8000-000000000099':'00000000-0000-4000-8000-000000000001';user.email=user.id.endsWith('001')?'demo@preview.invalid':'second@preview.invalid';},
    scenario:()=>scenario,
    setScenario(value){if(!allowed.includes(value))throw Error('PREVIEW_SCENARIO_INVALID');scenario=value;disconnected=false;permissions.splice(0);},
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

