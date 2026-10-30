import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.env.HUB_PREVIEW_OUT||resolve(root,'preview-dist');
const read=p=>readFileSync(resolve(root,p),'utf8');
const css=read('style.css'),cabinet=read('cabinet.js'),devices=read('devices.js'),connections=read('connections.js');
let app=read('app.js');
// Isolate synthetic browser storage. No working config or keys are read/copied.
app=app.replace('const STORE=cfg.mode===','const STORE=cfg.mode==="preview"?"hub_preview_":cfg.mode===');
const csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
const toolbar=`<aside class="preview-toolbar" aria-label="Изолированный предпросмотр"><strong>Предпросмотр IoT Hub · Только синтетические данные</strong><span>Вход, письма и сервисы имитируются локально. Не вводите личные данные.</span><div><button id="previewEnter" type="button">Войти в демо</button><button id="previewReset" type="button">Сбросить демо</button><label>Состояние сервиса<select id="previewScenario"><option value="empty">Не подключён</option><option value="connected">Виртуальное устройство</option><option value="forbidden">Нет доступа (403)</option><option value="error">Ошибка (500)</option><option value="revoke-failed">Отзыв не подтверждён</option><option value="loading">Загрузка</option><option value="invalid">Ошибка входа</option><option value="expired">Сессия истекла</option></select></label></div></aside>`;
const previewCSS='.preview-toolbar{background:#eaf0ff;color:#1d2939;padding:14px 18px;display:grid;gap:8px;font:14px system-ui}.preview-toolbar span{line-height:1.4}.preview-toolbar>div{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.preview-toolbar button,.preview-toolbar select{padding:10px;border-radius:8px;border:1px solid #a9badb;background:white;color:#2147a1;font:inherit;min-height:44px}.preview-toolbar label{margin:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center}';
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
let html=read('index.html').replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+csp+'"><link rel="icon" href="data:,">');
html=html.replace(/<link rel="stylesheet"[^>]+>/,'<style>'+css+'\n'+previewCSS+'</style>');
html=html.replace('<body>','<body>'+toolbar).replace('● Hub Core подключён','Демо: подключение к Hub отключено');
html=html.replace(/<script src="\.\/config\.js[^\"]*"><\/script>/,script(read('preview/transport.js')));
html=html.replace(/<script src="\.\/app\.js[^\"]*"><\/script>/,script(app));
html=html.replace(/<script src="\.\/devices\.js[^\"]*"><\/script>/,script(devices));
html=html.replace(/<script src="\.\/connections\.js[^\"]*"><\/script>/,script(connections));
html=html.replace(/<script src="\.\/cabinet\.js[^\"]*"><\/script>/,script(cabinet));
if(/<script src=|enhcnvzzkyvusthfjnci|sb_secret_|service_role|sb_publishable_/i.test(html)){
  // The original help text contains a production endpoint. It is only text, but must not ship in preview.
  html=html.replace(/https:\/\/enhcnvzzkyvusthfjnci\.supabase\.co[^<\s]*/g,'https://preview.invalid/disabled');
}
if(/<script src=|enhcnvzzkyvusthfjnci|sb_secret_|sb_publishable_/i.test(html))throw Error('PREVIEW_ISOLATION_CHECK_FAILED');
mkdirSync(output,{recursive:true});writeFileSync(resolve(output,'index.html'),html);
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({scope:'synthetic preview only, no deployment',sha256:createHash('sha256').update(html).digest('hex'),sources:['index.html','style.css','app.js','cabinet.js','devices.js','connections.js','preview/transport.js']},null,2)+'\n');
console.log('PASS isolated interactive preview generated; no network, config, credentials or production data');

