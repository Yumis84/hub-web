import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cfg=window.HUB_CONFIG;
const msg=document.querySelector("#message");
if(!cfg?.supabaseUrl||!cfg?.supabasePublishableKey){msg.textContent="Не настроена публичная конфигурация Hub.";throw new Error("Missing HUB_CONFIG")}
const supabase=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let mode="login";
const $=s=>document.querySelector(s), form=$("#form"), submit=$("#submit");
function setMode(next){mode=next;$("#tabLogin").classList.toggle("active",mode==="login");$("#tabSignup").classList.toggle("active",mode==="signup");$("#nameWrap").hidden=mode!=="signup";submit.textContent=mode==="login"?"Войти":"Создать аккаунт";msg.textContent="";$("#password").autocomplete=mode==="login"?"current-password":"new-password"}
$("#tabLogin").onclick=()=>setMode("login");$("#tabSignup").onclick=()=>setMode("signup");
function render(session){const u=session?.user;$("#auth").hidden=!!u;$("#account").hidden=!u;if(u){$("#userEmail").textContent=u.email??"—";$("#userId").textContent=u.id}}
form.onsubmit=async e=>{e.preventDefault();msg.textContent="";submit.disabled=true;try{const email=$("#email").value.trim(),password=$("#password").value;if(mode==="signup"){const name=$("#name").value.trim();const{data,error}=await supabase.auth.signUp({email,password,options:{data:name?{name}:undefined}});if(error)throw error;if(!data.session)msg.textContent="Аккаунт создан. Подтвердите email, если подтверждение включено.";else render(data.session)}else{const{data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;render(data.session)}}catch(e){msg.textContent=e?.message||"Ошибка авторизации"}finally{submit.disabled=false}};
$("#logout").onclick=async()=>{await supabase.auth.signOut()};
const{data:{session}}=await supabase.auth.getSession();render(session);
supabase.auth.onAuthStateChange((_event,session)=>render(session));