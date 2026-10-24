import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const read = path => readFileSync(new URL(path,import.meta.url),"utf8");
const html=read("../index.html");
const app=read("../app.js");
const cabinet=read("../cabinet.js");
const css=read("../style.css");
for(const id of ["auth","account","cabinetNav","cabinetBottom","cabinetPage","cabinetLegacy","form","userEmail","prepareAi","logout"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing HTML id: "+id);
}
for(const tag of ["div","section","nav"]){
  const open=(html.match(new RegExp("<"+tag+"(?:\\s|>)","g"))||[]).length;
  const close=(html.match(new RegExp("</"+tag+">","g"))||[]).length;
  assert.equal(open,close,tag+" tags must balance");
}
assert.ok(app.includes("if(legacyBootstrapButton)legacyBootstrapButton.onclick=bootstrap"),"Legacy null binding guard missing");
assert.ok(cabinet.includes("textContent"),"UI should render Hub values as text");
const approved=["Сегодня","Входящие","Сообщество","Проекты","Агенты","Сервисы","Настройки"];
for(const label of approved)assert.ok(cabinet.includes(label));
assert.equal((cabinet.match(/\{id:"(?:today|inbox|community|projects|agents|services|settings)"/g)||[]).length,7,"Exactly seven approved navigation sections are required");
assert.match(cabinet,/tuya_connection_revoke_v1/);
assert.match(cabinet,/service_connections\?select=id,region,status,created_at/);
assert.match(cabinet,/target\.protocol!=="https:" \|\| target\.origin!==location\.origin/);
assert.ok(!cabinet.includes("innerHTML"),"Service UI must not render provider data as HTML");
assert.ok(css.includes(".cabinet-sidebar"));
assert.ok(css.includes(".cabinet-bottom"));
for(const path of ["../app.js","../cabinet.js","../config.js"]){
  execFileSync(process.execPath,["--check",fileURLToPath(new URL(path,import.meta.url))],{stdio:"pipe"});
}
console.log("PASS: cabinet static markup, navigation and JavaScript syntax");
