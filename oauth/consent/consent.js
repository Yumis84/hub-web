import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const cfg=window.HUB_CONFIG,$=s=>document.querySelector(s),id=new URLSearchParams(location.search).get("authorization_id");
const fail=m=>{$("#loading").hidden=true;$("#consent").hidden=true;$("#error").textContent=m};
const clearWebSession=()=>{localStorage.removeItem("hub_access_token");localStorage.removeItem("hub_refresh_token");localStorage.removeItem("hub_user")};
const showLogin=()=>{
 $("#loading").hidden=true;
 $("#needLogin").hidden=false;
 $("#loginLink").href="../../?oauth_return="+encodeURIComponent(location.href);
};
if(!id){fail("Некорректный OAuth-запрос: отсутствует authorization_id");}
else{
 const sb=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const access_token=localStorage.hub_access_token,refresh_token=localStorage.hub_refresh_token;
 if(!access_token||!refresh_token){
   showLogin();
 }else{
  try{
   const{data:sd,error:se}=await sb.auth.setSession({access_token,refresh_token});
   const session=sd?.session;
   const invalidCredentials=se&&(
    se.status===401||["refresh_token_not_found","refresh_token_already_used","session_not_found","session_expired","bad_jwt"].includes(se.code)
   );
   if(se&&!invalidCredentials)throw se;
   if(invalidCredentials||!session?.access_token){
    showLogin();
   }else{
    localStorage.hub_access_token=session.access_token;
    if(session.refresh_token)localStorage.hub_refresh_token=session.refresh_token;
    const currentUser=sd?.session?.user||sd?.user;
    $("#currentUser").textContent=currentUser?.email||"Неизвестный пользователь";
    const{data,error}=await sb.auth.oauth.getAuthorizationDetails(id);if(error)throw error;
    if(data?.redirect_url&&!data.authorization_id){location.assign(data.redirect_url);}
    else{
     $("#loading").hidden=true;$("#consent").hidden=false;
     $("#clientName").textContent=data?.client?.name||data?.client_name||"AI-клиент";
     $("#scopes").textContent=(data?.scope||"email").split(" ").join(", ");
    }
    $("#approve").onclick=async()=>{try{$("#approve").disabled=true;const{error:be}=await sb.schema("app").rpc("bind_oauth_authorization",{p_authorization_id:id});if(be)throw be;const{data,error}=await sb.auth.oauth.approveAuthorization(id);if(error)throw error;if(!data?.redirect_url)throw new Error("OAuth approval не вернул redirect_url");const u=new URL(data.redirect_url);if(!u.searchParams.get("code")&&!u.searchParams.get("error"))throw new Error("OAuth redirect не содержит code");location.replace(data.redirect_url)}catch(e){fail(e.message)}};
    $("#switchAccount").onclick=async()=>{try{await sb.auth.signOut({scope:"local"})}catch{}clearWebSession();location.assign("../../?oauth_return="+encodeURIComponent(location.href))};
    $("#deny").onclick=async()=>{try{$("#deny").disabled=true;const{data,error}=await sb.auth.oauth.denyAuthorization(id);if(error)throw error;location.assign(data.redirect_url)}catch(e){fail(e.message)}};
   }
  }catch(e){
   fail(e.message||String(e));
  }
 }
}