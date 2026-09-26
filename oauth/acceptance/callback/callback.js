const cfg=window.HUB_ACCEPTANCE_CONFIG,p=new URLSearchParams(location.search),s=document.querySelector("#status"),o=document.querySelector("#out"),tests=document.querySelector("#tests"),results=document.querySelector("#results"),edge=cfg.supabaseUrl+"/functions/v1/mcp-project-acceptance";
async function call(token,tool,args={}){try{const r=await fetch(edge,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({tool,arguments:args})});let body;try{body=await r.json()}catch{body={non_json:true}}return{status:r.status,ok:r.ok,body}}catch(e){return{status:0,ok:false,body:{error:"NETWORK_OR_CORS",detail:e?.message||String(e)}}}}
async function ready(){const token=sessionStorage.getItem("hub_acceptance_access_token");if(token){tests.hidden=false;return true}return false}
try{if(p.get("error"))throw new Error(p.get("error")+": "+(p.get("error_description")||""));const code=p.get("code");if(code){const state=p.get("state"),expected=sessionStorage.getItem("hub_acceptance_oauth_state"),verifier=sessionStorage.getItem("hub_acceptance_oauth_verifier");if(!state||!expected||state!==expected||!verifier)throw new Error("OAuth state/PKCE validation failed");const clientId=sessionStorage.getItem("hub_acceptance_oauth_client_id");if(!clientId)throw new Error("Missing acceptance OAuth client_id");const r=await fetch(cfg.supabaseUrl+"/auth/v1/oauth/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,client_id:clientId,redirect_uri:cfg.redirectUri,code_verifier:verifier})});const tok=await r.json();if(!r.ok||!tok.access_token)throw new Error(tok.error_description||tok.error||("Token HTTP "+r.status));sessionStorage.setItem("hub_acceptance_access_token",tok.access_token);sessionStorage.removeItem("hub_acceptance_oauth_state");sessionStorage.removeItem("hub_acceptance_oauth_verifier");s.textContent="PASS — acceptance OAuth token получен.";o.textContent="Токен сохранён только в sessionStorage текущей вкладки."}else if(await ready()){s.textContent="Acceptance OAuth token уже есть в этой вкладке.";o.textContent="Можно запускать HTTP acceptance."}else throw new Error("OAuth callback code отсутствует");await ready()}catch(e){s.textContent="FAIL";o.textContent=e.message||String(e)}
document.querySelector("#run").onclick=async()=>{const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Проверка…";const list=await call(token,"project_list"),unknown=await call(token,"__unknown__"),noAuth=await call(null,"project_list"),invalid=await call("invalid-token","project_list");const sanitized=x=>({status:x.status,ok:x.ok,error:x.body?.error??null,count:Array.isArray(x.body?.data)?x.body.data.length:undefined,data:x.ok?x.body?.data:undefined});results.textContent=JSON.stringify({no_authorization:sanitized(noAuth),invalid_token:sanitized(invalid),project_list:sanitized(list),unknown_tool:sanitized(unknown)},null,2)}
document.querySelector("#diag").onclick=async()=>{const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Диагностика…";const d=await call(token,"__diagnostic__");results.textContent=JSON.stringify({diagnostic:d.body?.diagnostic??null,status:d.status,error:d.body?.error??null},null,2)};

document.querySelector("#bootstrap").onclick=async()=>{const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Подключение acceptance agent…";const b=await call(token,"__bootstrap__");if(!b.ok){results.textContent=JSON.stringify({bootstrap:{status:b.status,error:b.body?.error??"FAILED"}},null,2);return}const d=await call(token,"__diagnostic__");const list=await call(token,"project_list");results.textContent=JSON.stringify({bootstrap:{status:b.status,ok:b.ok},diagnostic:d.body?.diagnostic??null,project_list:{status:list.status,ok:list.ok,error:list.body?.error??null,count:Array.isArray(list.body?.data)?list.body.data.length:undefined}},null,2)};

document.querySelector("#project").onclick=async()=>{
 const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Project API E2E…";
 const fx=await call(token,"__project_fixture__");
 if(!fx.ok){results.textContent=JSON.stringify({fixture:{status:fx.status,error:fx.body?.error??"FAILED"}},null,2);return}
 const pid=fx.body?.fixture?.project_space_id;
 const list=await call(token,"project_list");
 const get=await call(token,"project_get",{project_space_id:pid});
 const ctx=await call(token,"project_context_get",{project_space_id:pid,workstream:"main",query:"OAUTH",max_items:30});
 const caps=await call(token,"project_capabilities_list",{project_space_id:pid});
 const text=JSON.stringify(ctx.body?.data??null);
 const summarize=x=>({status:x.status,ok:x.ok,error:x.body?.error??null,data:x.ok?x.body?.data:undefined});
 results.textContent=JSON.stringify({
  fixture:{status:fx.status,ok:fx.ok},
  project_list:summarize(list),
  project_get:summarize(get),
  project_context_get:{...summarize(ctx),shared_marker_visible:text.includes("SHARED-OAUTH-926"),private_marker_excluded:!text.includes("PRIVATE-OAUTH-926")},
  project_capabilities_list:summarize(caps)
 },null,2);
};

document.querySelector("#negative").onclick=async()=>{
 const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Negative security gates…";
 const x=await call(token,"__negative_assertions__");
 results.textContent=JSON.stringify({status:x.status,ok:x.ok,error:x.body?.error??null,assertions:x.body?.assertions??null},null,2);
};

document.querySelector("#sanitize").onclick=async()=>{
 const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Error sanitization…";
 const x=await call(token,"project_get",{project_space_id:"definitely-not-a-uuid"});
 const raw=JSON.stringify(x.body??{});
 results.textContent=JSON.stringify({
  status:x.status,ok:x.ok,error:x.body?.error??null,
  bounded_error:x.status===403&&x.body?.error==="PROJECT_ACCESS_DENIED",
  no_internal_details:!/(postgres|postgrest|schema|relation|function|sql|permission denied|uuid)/i.test(raw)
 },null,2);
};

document.querySelector("#broker").onclick=async()=>{
 const token=sessionStorage.getItem("hub_acceptance_access_token");results.textContent="Broker READ E2E…";
 results.textContent="1/5 bootstrap…"; const boot=await call(token,"__broker_bootstrap__"); if(!boot.ok){results.textContent=JSON.stringify({bootstrap:boot},null,2);return}
 results.textContent="2/5 fixture…"; const fx=await call(token,"__broker_fixture__"); if(!fx.ok){results.textContent=JSON.stringify({fixture:fx},null,2);return}
 const pid=fx.body?.fixture?.project_space_id, cid=fx.body?.fixture?.project_connection_id;
 const idem="broker-oauth-"+Date.now();
 const rq=await call(token,"__broker_request__",{project_space_id:pid,idempotency_key:idem}); if(!rq.ok){results.textContent=JSON.stringify({request:{status:rq.status,error:rq.body?.error}},null,2);return}
 const rid=rq.body?.request?.id;
 const run=await call(token,"__broker_run__",{request_id:rid,project_connection_id:cid});
 results.textContent="5/5 final read…"; const get=await call(token,"__broker_get__",{request_id:rid});
 const raw=JSON.stringify({run:run.body,get:get.body});
 results.textContent=JSON.stringify({
  bootstrap:{status:boot.status,ok:boot.ok},
  fixture:{status:fx.status,ok:fx.ok},
  request:{status:rq.status,ok:rq.ok,id:rid,request_status:rq.body?.request?.status},
  execution:{status:run.status,ok:run.ok,data:run.body?.execution??null},
  final:{status:get.status,ok:get.ok,data:get.body?.request??null},
  no_secret_material:!/(secret|password|api[_-]?key|bearer|access[_-]?token)/i.test(raw)
 },null,2);
};

document.querySelector("#brokerRuntime").onclick=async()=>{
 const token=sessionStorage.getItem("hub_acceptance_access_token"); results.textContent="Broker Runtime E2E…";
 const boot=await call(token,"__broker_bootstrap__"); if(!boot.ok){results.textContent=JSON.stringify({bootstrap:boot},null,2);return}
 const fx=await call(token,"__broker_fixture__"); if(!fx.ok){results.textContent=JSON.stringify({fixture:fx},null,2);return}
 const pid=fx.body?.fixture?.project_space_id, cid=fx.body?.fixture?.project_connection_id;
 results.textContent="3/5 request…"; const rq=await call(token,"__broker_request__",{project_space_id:pid,idempotency_key:"broker-runtime-"+Date.now()});
 if(!rq.ok){results.textContent=JSON.stringify({request:{status:rq.status,error:rq.body?.error}},null,2);return}
 const rid=rq.body?.request?.id;
 results.textContent="4/5 worker HTTP…"; const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),12000); let wr; try{wr=await fetch("https://trrhyahuzqbozxanaczw.supabase.co/functions/v1/broker-worker-acceptance",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token,"apikey":"sb_publishable_gJ2s1m3TcfLlVymFoOHfkQ_iMxO7rB5"},body:JSON.stringify({request_id:rid,project_connection_id:cid}),signal:ctl.signal});}catch(e){clearTimeout(tm);results.textContent=JSON.stringify({stage:"worker_http",error:e?.name==="AbortError"?"TIMEOUT_12S":String(e)},null,2);return} clearTimeout(tm);
 const wb=await wr.json().catch(()=>({}));
 const get=await call(token,"__broker_get__",{request_id:rid});
 const raw=JSON.stringify({worker:wb,final:get.body});
 results.textContent=JSON.stringify({
  bootstrap:{status:boot.status,ok:boot.ok},
  fixture:{status:fx.status,ok:fx.ok},
  request:{status:rq.status,ok:rq.ok,id:rid,request_status:rq.body?.request?.status},
  worker:{status:wr.status,ok:wr.ok,data:wb.execution??null,error:wb.error??null},
  final:{status:get.status,ok:get.ok,data:get.body?.request??null},
  dedicated_runtime:wb.execution?.runtime_key==="acceptance-broker-worker",
  no_secret_material:!/(secret|password|api[_-]?key|bearer|access[_-]?token|service[_-]?role)/i.test(raw)
 },null,2);
};
