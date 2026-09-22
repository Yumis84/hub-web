const PROJECT="enhcnvzzkyvusthfjnci";
const CLIENT_ID="7fb1bfc7-1a30-436e-9951-8347bd142b34";
const REDIRECT="https://yumis84.github.io/hub-web/oauth/callback/";
const $=s=>document.querySelector(s),p=new URLSearchParams(location.search);
const fail=m=>{$("#status").hidden=true;$("#fail").hidden=false;$("#error").textContent=m};
try{
 if(p.get("error"))throw new Error(p.get("error")+": "+(p.get("error_description")||""));
 const code=p.get("code"),state=p.get("state"),expected=sessionStorage.getItem("hub_oauth_state"),verifier=sessionStorage.getItem("hub_oauth_verifier");
 if(!code||!state||!expected||state!==expected||!verifier)throw new Error("OAuth state/PKCE validation failed");
 const r=await fetch(`https://${PROJECT}.supabase.co/auth/v1/oauth/token`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,client_id:CLIENT_ID,redirect_uri:REDIRECT,code_verifier:verifier})});
 const tok=await r.json();if(!r.ok||!tok.access_token)throw new Error(tok.error_description||tok.error||("Token HTTP "+r.status));
 sessionStorage.removeItem("hub_oauth_state");sessionStorage.removeItem("hub_oauth_verifier");
 const g=await fetch(window.HUB_CONFIG.supabaseUrl+"/functions/v1/mcp-gateway/rpc",{method:"POST",headers:{Authorization:"Bearer "+tok.access_token,apikey:window.HUB_CONFIG.supabasePublishableKey,"Content-Type":"application/json"},body:JSON.stringify({name:"agent_list",arguments:{}})});
 const raw=await g.text();let data;try{data=JSON.parse(raw)}catch{throw new Error("Gateway non-JSON "+g.status+": "+raw.slice(0,160))}
 if(!g.ok||data.error)throw new Error(data.error||("Gateway HTTP "+g.status));
 if((data.result?.length??0)!==1)throw new Error("Delegated boundary FAIL: OAuth client должен видеть ровно одного привязанного агента, получено "+(data.result?.length??0));$("#status").hidden=true;$("#ok").hidden=false;$("#result").textContent="PASS — OAuth token принят; active agent_connection найден через RLS; доступ ограничен одним привязанным агентом.";
}catch(e){fail(e.message||String(e))}