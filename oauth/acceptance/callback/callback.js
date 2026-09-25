const cfg=window.HUB_ACCEPTANCE_CONFIG,p=new URLSearchParams(location.search),s=document.querySelector("#status"),o=document.querySelector("#out");
try{
 if(p.get("error"))throw new Error(p.get("error")+": "+(p.get("error_description")||""));
 const code=p.get("code"),state=p.get("state"),expected=sessionStorage.getItem("hub_acceptance_oauth_state"),verifier=sessionStorage.getItem("hub_acceptance_oauth_verifier");
 if(!code||!state||!expected||state!==expected||!verifier)throw new Error("OAuth state/PKCE validation failed");
 const clientId=sessionStorage.getItem("hub_acceptance_oauth_client_id");if(!clientId)throw new Error("Missing acceptance OAuth client_id");
 const r=await fetch(cfg.supabaseUrl+"/auth/v1/oauth/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,client_id:clientId,redirect_uri:cfg.redirectUri,code_verifier:verifier})});
 const tok=await r.json();if(!r.ok||!tok.access_token)throw new Error(tok.error_description||tok.error||("Token HTTP "+r.status));
 sessionStorage.setItem("hub_acceptance_access_token",tok.access_token);sessionStorage.removeItem("hub_acceptance_oauth_state");sessionStorage.removeItem("hub_acceptance_oauth_verifier");
 s.textContent="PASS — acceptance OAuth token получен.";o.textContent="Токен сохранён только в sessionStorage текущей вкладки.";
}catch(e){s.textContent="FAIL";o.textContent=e.message||String(e)}