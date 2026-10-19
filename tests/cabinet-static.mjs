import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
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
for(const label of ["Сегодня","Проекты","Агенты","Сервисы"])assert.ok(cabinet.includes(label));
assert.ok(css.includes(".cabinet-sidebar"));
assert.ok(css.includes(".cabinet-bottom"));
for(const path of ["../app.js","../cabinet.js","../config.js"]){
  execFileSync(process.execPath,["--check",new URL(path,import.meta.url).pathname],{stdio:"pipe"});
}
console.log("PASS: cabinet static markup, navigation and JavaScript syntax");
