/* Real Chromium UI; synthetic local transport only. Not OAuth/PostgREST acceptance. */
const {createRequire}=require('node:module');
const {readFileSync,mkdirSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.HUB_PLAYWRIGHT_MODULE||'playwright');
const root=resolve(__dirname,'..');
const artifact=resolve(root,'browser-evidence');mkdirSync(artifact,{recursive:true});
const html=readFileSync(resolve(root,'preview-dist/index.html'));
const sections=['today','inbox','community','projects','agents','services','settings'];
const labels=['Сегодня','Входящие','Сообщество','Проекты','Агенты','Сервисы','Настройки'];
const checks=[];let browser,server;
async function check(name,fn){try{await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}catch(e){checks.push({name,status:'FAIL',error:e.message});console.log('FAIL '+name+': '+e.message);}}
async function visible(page,selector){assert.equal(await page.locator(selector).isVisible(),true,selector+' should be visible');}
async function login(page){await page.locator('#previewEnter').click();await page.locator('#account').waitFor({state:'visible'});}
async function nav(page,section,width){
 if(width<720&&!(await page.locator('#cabinetBottom').getAttribute('class')).includes('expanded'))await page.locator('.cabinet-more').tap();
 const link=page.locator((width<720?'#cabinetBottom':'#cabinetNav')+' [data-section="'+section+'"]');
 if(width<720)await link.tap();else await link.click();
 await page.waitForFunction(s=>location.hash==='#/'+s,section);
 await page.waitForTimeout(20);
}
(async()=>{
 server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.HUB_CHROME?{executablePath:process.env.HUB_CHROME}:{})});
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<720,hasTouch:width<720});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(url);await login(page);
  if(width<720)await check(width+' mobile menu discoverable and keyboard-expandable',async()=>{
   const more=page.locator('.cabinet-more');assert.equal(await more.getAttribute('aria-expanded'),'false');
   await more.focus();await page.keyboard.press('Enter');assert.equal(await more.getAttribute('aria-expanded'),'true');
   for(const s of sections)await visible(page,'#cabinetBottom [data-section="'+s+'"]');
   await page.keyboard.press('Shift+Tab');assert.equal(await page.locator(':focus').getAttribute('data-section'),'settings');
   await page.keyboard.press('Enter');assert.equal(await page.locator('#cabinetHeading').textContent(),'Настройки');
  });
  for(let i=0;i<sections.length;i++){
   const section=sections[i];await nav(page,section,width);
   await check(width+' '+section+' navigation/overflow',async()=>{
    assert.equal(await page.locator('#cabinetHeading').textContent(),labels[i]);
    const stats=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(stats.doc<=stats.viewport+1&&stats.body<=stats.viewport+1,JSON.stringify(stats));
    await visible(page,'.cabinet-global-logout');
    if(width<720){await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
     const content=await page.locator(section==='agents'?'#cabinetLegacy':'#cabinetPage').boundingBox();
     const bottom=await page.locator('#cabinetBottom').boundingBox();assert.ok(content.y+content.height<=bottom.y+1,'bottom navigation covers content');}
   });
   await check(width+' '+section+' logout clears local session',async()=>{
    await page.locator('.cabinet-global-logout').click();await visible(page,'#auth');
    assert.equal(await page.locator('#account').isVisible(),false);
    assert.equal(await page.evaluate(()=>['access_token','refresh_token','user'].some(k=>localStorage.getItem('hub_preview_'+k))),false);
    await login(page);
   });
  }
  await check(width+' logout target is at least44x44',async()=>{const r=await page.locator('.cabinet-global-logout').boundingBox();assert.ok(r.width>=44&&r.height>=44,JSON.stringify(r));});
  await nav(page,'today',width);await page.screenshot({path:resolve(artifact,'today-'+width+'.png'),fullPage:true});
  await nav(page,'settings',width);await page.screenshot({path:resolve(artifact,'settings-'+width+'.png'),fullPage:true});
  await check(width+' no JS errors or external network',async()=>{assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.startsWith(url)||r.startsWith('data:')),JSON.stringify(requests));});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 for(const [scenario,expected]of [['empty','Не подключён'],['forbidden','Недоступен'],['error','Недоступен'],['connected','Подключён · DEMO']]){
  await page.goto(url+'?scenario='+scenario+'#/services');await login(page);
  await check('services '+scenario+' safe state',async()=>{await page.waitForFunction(x=>document.querySelector('.service-badge')?.textContent===x,expected);
   assert.ok(!(await page.locator('#cabinetPage').textContent()).includes('not for UI'));
   if(scenario==='forbidden')assert.match(await page.locator('.service-message').textContent(),/Доступ запрещён/);
   if(scenario==='connected')await visible(page,'.service-device');
  });
 }
 page.on('dialog',d=>d.accept());
 await check('synthetic service revoke uses confirmation and resets UI',async()=>{await page.locator('.service-danger').click();await page.waitForFunction(()=>document.querySelector('.service-badge')?.textContent==='Не подключён');assert.equal(await page.locator('.service-device').count(),0);});
 await page.goto(url+'?scenario=invalid');
 await check('invalid login stays signed out with visible error',async()=>{await page.locator('#previewEnter').click();await page.waitForFunction(()=>document.querySelector('#message')?.textContent.includes('Ошибка входа'));await visible(page,'#auth');assert.equal(await page.locator('#account').isVisible(),false);});
 await page.goto(url+'?scenario=empty');await login(page);
 await page.evaluate(()=>HUB_PREVIEW.seedExpired());await page.goto(url+'?scenario=expired');
 await check('expired cached session plus rejected refresh closes cabinet',async()=>{await page.waitForTimeout(150);await visible(page,'#auth');assert.equal(await page.locator('#account').isVisible(),false);});
 await context.close();
})().catch(e=>{checks.push({name:'harness',status:'FAIL',error:e.stack});console.error(e);}).finally(async()=>{
 if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));
 const result={environment:'Chromium with synthetic transport; no signed OAuth',pass:checks.filter(x=>x.status==='PASS').length,fail:checks.filter(x=>x.status==='FAIL').length,checks};
 writeFileSync(resolve(artifact,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,fail:result.fail}));if(result.fail)process.exitCode=1;
});
