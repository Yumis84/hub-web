import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cfg=window.HUB_CONFIG;
const msg=document.querySelector("#message");
if(!cfg?.supabaseUrl||!cfg?.supabasePublishableKey){msg.textContent="Не настроена публичная конфигурация Hub.";throw new Error("Missing HUB_CONFIG")}
const supabase=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const HUB_WEB_URL="https://yumis84.github.io/hub-web/";
let mode="login";
const $=s=>document.querySelector(s), form=$("#form"), submit=$("#submit"), resend=$("#resend");
function setMode(next){mode=next;$("#tabLogin").classList.toggle("active",mode==="login");$("#tabSignup").classList.toggle("active",mode==="signup");$("#nameWrap").hidden=mode!=="signup";submit.textContent=mode==="login"?"Войти":"Создать аккаунт";resend.hidden=true;msg.textContent="";$("#password").autocomplete=mode==="login"?"current-password":"new-password"}
$("#tabLogin").onclick=()=>setMode("login");$("#tabSignup").onclick=()=>setMode("signup");
function render(session){const u=session?.user;$("#auth").hidden=!!u;$("#account").hidden=!u;if(u){$("#userEmail").textContent=u.email??"—";$("#userId").textContent=u.id}}
form.onsubmit=async e=>{e.preventDefault();msg.textContent="";submit.disabled=true;try{const email=$("#email").value.trim(),password=$("#password").value;if(mode==="signup"){const name=$("#name").value.trim();const{data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:HUB_WEB_URL,data:name?{name}:undefined}});if(error)throw error;if(!data.session){msg.textContent="Аккаунт создан. Откройте письмо и подтвердите email.";resend.hidden=false}else render(data.session)}else{const{data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;render(data.session)}}catch(e){msg.textContent=e?.message||"Ошибка авторизации";if((e?.message||"").toLowerCase().includes("email"))resend.hidden=false}finally{submit.disabled=false}};
resend.onclick=async()=>{const email=$("#email").value.trim();if(!email){msg.textContent="Введите email.";return}resend.disabled=true;msg.textContent="";try{const{error}=await supabase.auth.resend({type:"signup",email,options:{emailRedirectTo:HUB_WEB_URL}});if(error)throw error;msg.textContent="Письмо подтверждения отправлено повторно. Проверьте входящие и спам."}catch(e){msg.textContent=e?.message||"Не удалось отправить письмо повторно"}finally{resend.disabled=false}};
$("#logout").onclick=async()=>{await supabase.auth.signOut()};
const{data:{session}}=await supabase.auth.getSession();render(session);
supabase.auth.onAuthStateChange((_event,session)=>render(session));