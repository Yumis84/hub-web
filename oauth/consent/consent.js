import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const cfg=window.HUB_CONFIG,$=s=>document.querySelector(s),id=new URLSearchParams(location.search).get("authorization_id");
const fail=m=>{$("#loading").hidden=true;$("#consent").hidden=true;$("#error").textContent=m};
if(!id){fail("Некорректный OAuth-запрос: отсутствует authorization_id");}
else{
 const sb=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const access_token=localStorage.hub_access_token,refresh_token=localStorage.hub_refresh_token;
 if(!access_token||!refresh_token){
   $("#loading").hidden=true;$("#needLogin").hidden=false;
   $("#loginLink").href="../../?oauth_return="+encodeURIComponent(location.href);
 }else{
  try{
   const{data:sd,error:se}=await sb.auth.setSession({access_token,refresh_token});if(se)throw se;if(sd?.session?.access_token){localStorage.hub_access_token=sd.session.access_token;if(sd.session.refresh_token)localStorage.hub_refresh_token=sd.session.refresh_token;}
   const{data,error}=await sb.auth.oauth.getAuthorizationDetails(id);if(error)throw error;
   if(data?.redirect_url&&!data.authorization_id){location.assign(data.redirect_url);}
   else{
    $("#loading").hidden=true;$("#consent").hidden=false;
    $("#clientName").textContent=data?.client?.name||data?.client_name||"AI-клиент";
    $("#scopes").textContent=(data?.scope||"email").split(" ").join(", ");
   }
   $("#approve").onclick=async()=>{try{$("#approve").disabled=true;const{data,error}=await sb.auth.oauth.approveAuthorization(id);if(error)throw error;if(!data?.redirect_url)throw new Error("OAuth approval не вернул redirect_url");const u=new URL(data.redirect_url);if(!u.searchParams.get("code")&&!u.searchParams.get("error"))throw new Error("OAuth redirect не содержит code");location.replace(data.redirect_url)}catch(e){fail(e.message)}};
   $("#deny").onclick=async()=>{try{$("#deny").disabled=true;const{data,error}=await sb.auth.oauth.denyAuthorization(id);if(error)throw error;location.assign(data.redirect_url)}catch(e){fail(e.message)}};
  }catch(e){
   if(/session|token|jwt|auth/i.test(e.message||"")){$("#loading").hidden=true;$("#needLogin").hidden=false;$("#loginLink").href="../../?oauth_return="+encodeURIComponent(location.href)}
   else fail(e.message||String(e));
  }
 }
}