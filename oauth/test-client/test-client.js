const PROJECT="enhcnvzzkyvusthfjnci";
const CLIENT_ID="7fb1bfc7-1a30-436e-9951-8347bd142b34";
const REDIRECT="https://yumis84.github.io/hub-web/oauth/callback/";
const enc=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const random=n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return enc(b)};
document.querySelector("#connect").onclick=async()=>{
 const verifier=random(64),state=random(32);
 const challenge=enc(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(verifier)));
 sessionStorage.setItem("hub_oauth_verifier",verifier);sessionStorage.setItem("hub_oauth_state",state);
 const q=new URLSearchParams({response_type:"code",client_id:CLIENT_ID,redirect_uri:REDIRECT,state,code_challenge:challenge,code_challenge_method:"S256",scope:"email"});
 location.assign(`https://${PROJECT}.supabase.co/auth/v1/oauth/authorize?${q}`);
};