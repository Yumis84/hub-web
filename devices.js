/* IoT Hub view inside the existing cabinet. Broker owns credentials and authorization. */
(() => {
 'use strict';
 const providers=[
  {id:'REMOTE_COMPUTERS',name:'Удалённые компьютеры',category:'computers',method:'Desktop Commander / локальный агент',note:'Подключение в ChatGPT не означает регистрацию ПК в Hub.'},
  {id:'SYNOLOGY',name:'Synology NAS',category:'network',method:'Адаптер Synology',note:'Пароли DSM и SSH хранятся вне браузера.'},
  {id:'KEENETIC',name:'Keenetic Giga',category:'network',method:'Локальный HTTPS-адаптер',note:'Нужен серверный адаптер с проверкой сертификата. Настройки роутера не меняются.'},
  {id:'HOME_ASSISTANT',name:'Home Assistant',category:'home',method:'Существующий MCP / API-адаптер',note:'Используется подтверждённая сервером привязка владельца.'},
  {id:'TUYA',name:'Smart Life / Tuya',category:'home',method:'Connection Broker Tuya',note:'Доступность зависит от официальной авторизации и разрешений Tuya.'}
 ];
 const labels={online:'Доступна',offline:'Недоступна',authorized:'Подтверждена',unauthorized:'Нет авторизации',ready:'Готово к чтению',unavailable:'Адаптер недоступен',unknown:'Не проверено',revoked:'Доступ отозван'};
 const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
 const button=(text,fn,cls='iot-button')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
 const safeText=(v,fallback='—')=>typeof v==='string'&&v.length? v.slice(0,160):fallback;
 const date=v=>{const d=typeof v==='string'?new Date(v):null;return d&&!isNaN(d)?d.toLocaleString('ru-RU'):'Не было успешной проверки';};
 const message=e=>[401,403].includes(Number(e?.status))?'Нет доступа. Проверьте сессию и разрешения.':'Брокер устройств недоступен или ещё не настроен. Устройства не считаются подключёнными.';
 function mount({container,request,isCurrent}){
  let generation=0,rows=[],filter='all',busy=false,focusReturn=null;
  const box=el('section','iot-hub');box.id='iotHub';
  const heading=el('div','iot-heading'),copy=el('div');copy.append(el('p','cabinet-eyebrow','IOT HUB'),el('h2','','Мои устройства'),el('p','cabinet-muted','Статусы из вашего Connection Broker. На этом этапе — только чтение и диагностика.'));
  const add=button('Добавить устройство',wizard,'primary iot-add');heading.append(copy,add);
  const status=el('p','iot-message','Загружаю устройства…');status.setAttribute('role','status');
  const toolbar=el('div','iot-toolbar'),category=el('select');category.setAttribute('aria-label','Категория устройств');
  for(const [value,label]of [['all','Все категории'],['computers','Компьютеры'],['network','Сеть и NAS'],['home','Умный дом']]){const op=el('option','',label);op.value=value;category.append(op);}
  category.onchange=()=>{filter=category.value;paint();};toolbar.append(category,button('Обновить',load));
  const list=el('div','iot-grid');list.id='iotDeviceList';const detail=el('section','iot-detail');detail.id='iotDeviceDetail';detail.hidden=true;
  box.append(heading,toolbar,status,list,detail);container.append(box);
  const alive=()=>box.isConnected&&isCurrent();
  async function rpc(name,params={}){const data=await request('rpc/'+name,{method:'POST',body:JSON.stringify(params)});if(!alive())throw Error('VIEW_CLOSED');return data;}
  function badges(item){const dl=el('dl','iot-statuses');for(const [key,title]of [['network','Сеть'],['authorization','Авторизация'],['readiness','Готовность']]){dl.append(el('dt','',title),el('dd','iot-state '+(Object.hasOwn(labels,item[key])?item[key]:'unknown'),labels[item[key]]||labels.unknown));}return dl;}
  function paint(){list.replaceChildren();const items=rows.filter(x=>filter==='all'||x.category===filter);
   if(!items.length){list.append(el('div','iot-empty',rows.length?'В этой категории устройств нет.':'Устройства ещё не зарегистрированы в Hub. Добавьте существующее подключение через брокер.'));return;}
   for(const item of items){const card=el('article','iot-device'),provider=providers.find(p=>p.id===item.provider);
    card.append(el('span','iot-provider',provider?.name||'Источник не проверен'),el('h3','',safeText(item.name,'Устройство')),el('p','cabinet-muted',safeText(item.type,'Тип не указан')),badges(item),el('p','iot-last-check','Последняя успешная проверка: '+date(item.last_success_at)),button('Подробнее',()=>open(item)));
    list.append(card);
   }
  }
  async function load(){const g=++generation;status.textContent='Загружаю устройства…';
   try{const data=await rpc('device_inventory_v1');if(g!==generation)return;if(!data||!Array.isArray(data.items)||data.items.length>100)throw Error('INVALID_INVENTORY');
    rows=data.items.filter(x=>x&&typeof x.id==='string'&&providers.some(p=>p.id===x.provider));paint();status.textContent=rows.length?'Показаны устройства, разрешённые текущему пользователю.':'Подключений в Hub пока нет.';
    if(data.has_more===true)status.textContent+=' Показаны первые 100; полная пагинация требует поддержки брокера.';
   }catch(e){if(!alive()||g!==generation)return;rows=[];list.replaceChildren(el('div','iot-empty','Список устройств недоступен. Наличие подключений не проверено.'));status.textContent=message(e);}
  }
  async function open(item){detail.hidden=false;detail.replaceChildren();const g=++generation;
   const title=el('h3','',safeText(item.name,'Устройство'));title.tabIndex=-1;
   detail.append(button('К списку',()=>{detail.hidden=true;list.hidden=false;toolbar.hidden=false;add.focus();}),title,el('p','cabinet-muted','Загружаю карточку…'));list.hidden=true;toolbar.hidden=true;title.focus();
   try{const d=await rpc('device_detail_v1',{p_device_id:item.id});if(g!==generation)return;if(!d||d.id!==item.id)throw Error('DEVICE_MISMATCH');
    detail.replaceChildren(button('К списку',()=>{detail.hidden=true;list.hidden=false;toolbar.hidden=false;add.focus();}),title,el('p','cabinet-muted','Источник: '+(providers.find(p=>p.id===d.provider)?.name||'Не проверен')),badges(d),el('p','','Последняя успешная проверка: '+date(d.last_success_at)));
    const perms=el('section','iot-permissions');perms.append(el('h4','','Разрешения'),el('p','','READ: '+(d.read_allowed===true?'разрешено':'запрещено')),el('p','','CONTROL: выключено — требуется отдельное разрешение владельца.'));detail.append(perms);
    const caps=el('ul','iot-capabilities');for(const value of Array.isArray(d.capabilities)?d.capabilities:[])if(['status','diagnostics','history','inventory'].includes(value))caps.append(el('li','',({status:'Чтение статуса',diagnostics:'Безопасная диагностика',history:'История проверок',inventory:'Список устройств'})[value]));detail.append(el('h4','','Возможности'),caps);
    const diag=el('p','iot-message',''),check=button('Проверить подключение',async()=>{check.disabled=true;diag.textContent='Проверяю…';try{const result=await rpc('device_diagnose_v1',{p_device_id:item.id});if(g!==generation)return;diag.replaceChildren(badges(result),el('p','','Последняя успешная проверка: '+date(result.last_success_at)));}catch(e){if(alive())diag.textContent=message(e);}finally{check.disabled=false;}});check.disabled=d.read_allowed!==true;detail.append(check,diag);
    const history=el('ul','iot-history');history.setAttribute('aria-label','История устройства');for(const entry of Array.isArray(d.history)?d.history.slice(0,20):[])history.append(el('li','',date(entry.at)+' · '+safeText(entry.action)+' · '+safeText(entry.result)));if(!history.childNodes.length)history.append(el('li','','История ещё не получена.'));detail.append(el('h4','','История проверок и действий'),history);
    const revoke=button('Отозвать доступ в Hub',async()=>{if(!confirm('Отозвать доступ к этому подключению в Hub? Учётная запись провайдера и устройство не изменятся.'))return;revoke.disabled=true;try{const result=await rpc('device_revoke_v1',{p_device_id:item.id});if(result!==true)throw Error('REVOKE_NOT_CONFIRMED');detail.hidden=true;list.hidden=false;toolbar.hidden=false;await load();}catch(e){if(alive()){diag.textContent=e?.message==='REVOKE_NOT_CONFIRMED'?'Отзыв доступа не подтверждён. Подключение не помечено отключённым.':message(e);revoke.disabled=false;}}},'iot-button iot-danger');detail.append(revoke);
   }catch(e){if(alive()&&g===generation)detail.append(el('p','iot-message',message(e)));}
  }
  function wizard(){if(busy)return;busy=true;focusReturn=document.activeElement;
   const dialog=el('dialog','iot-wizard');dialog.setAttribute('aria-labelledby','iotWizardTitle');
   const title=el('h3','','Добавить устройство');title.id='iotWizardTitle';const body=el('div'),step=el('p','iot-step'),feedback=el('p','iot-message');feedback.setAttribute('role','status');
   const close=button('Закрыть',()=>dialog.close());dialog.append(title,step,body,feedback,close);document.body.append(dialog);
   let selected=providers[0],connection=null,proof=null,currentStep=0,pending=false,choices=[],requestKey=crypto.randomUUID();
   const synologyGuide=()=>{const guide=el('section','iot-synology-guide');guide.hidden=selected.id!=='SYNOLOGY';guide.append(el('h4','','Synology ↔ ваш ChatGPT'));const steps=el('ol');for(const t of ['В ChatGPT подключите существующий AI Agent Hub и войдите через OAuth Hub. Доступность custom MCP зависит от аккаунта и политик workspace.','Выберите свой NAS из подключений Connection Broker. Каждый NAS имеет отдельную привязку. Доступ в ChatGPT сам по себе не подтверждает владение NAS.','Владелец должен подтвердить привязку на NAS через поддерживаемый адаптер. Если такого подтверждения нет, сохранение недоступно.','Разрешите только READ. Доступ своему агенту ChatGPT выдаётся отдельно; CONTROL здесь выключено.','Отзыв в Hub закрывает доступ к NAS через Hub. Отключение приложения ChatGPT выполняется отдельно.'])steps.append(el('li','',t));guide.append(steps,el('p','cabinet-muted','Пароль ChatGPT, пароль DSM и токены сюда вводить не нужно. Текущий MCP без подтверждения владельца не подходит для первичной регистрации.'));return guide;};
   const choose=()=>{step.textContent='Шаг 1 из 4 · Тип и способ подключения';body.replaceChildren();const select=el('select');select.setAttribute('aria-label','Тип устройства');for(const p of providers){const o=el('option','',p.name);o.value=p.id;select.append(o);}select.value=selected.id;
    const note=el('p','cabinet-muted',selected.note),guide=synologyGuide();select.onchange=()=>{selected=providers.find(p=>p.id===select.value);note.textContent=selected.note;guide.hidden=selected.id!=='SYNOLOGY';};
    body.append(select,note,guide,el('p','','Пароли, ключи и токены в этом мастере не запрашиваются.'),button('Продолжить',discover));};
   async function discover(){if(pending)return;pending=true;feedback.textContent='Проверяю доступные подключения…';
    try{const response=await rpc('device_connection_options_v1',{p_provider:selected.id});if(!dialog.open)return;choices=Array.isArray(response?.items)?response.items:[];
     currentStep=1;step.textContent='Шаг 2 из 4 · Существующее подключение';body.replaceChildren();
     if(!choices.length){body.append(el('p','','Требуется подключение серверного адаптера: '+selected.method),el('p','cabinet-muted','Подключение в ChatGPT автоматически не переносится в Hub. Сначала владелец должен разрешить привязку в Connection Broker.'),button('Назад',choose));feedback.textContent='Ничего не сохранено.';return;}
     const select=el('select');select.setAttribute('aria-label','Существующее подключение');for(const c of choices){const o=el('option','',safeText(c.name,'Подключение'));o.value=c.id;select.append(o);}body.append(select,el('p','cabinet-muted',selected.method),button('Проверить соединение',()=>verify(select.value)),button('Назад',choose));feedback.textContent='';
    }catch(e){feedback.textContent=message(e);}finally{pending=false;}
   }
   async function verify(id){if(pending)return;pending=true;feedback.textContent='Проверяю сеть и авторизацию…';
    try{const result=await rpc('device_connection_verify_v1',{p_connection_id:id,p_provider:selected.id});if(!dialog.open)return;
     if(result?.network!=='online'||result.authorization!=='authorized'||typeof result.proof_id!=='string'||(selected.id==='SYNOLOGY'&&result.owner_confirmed!==true))throw Error('VERIFICATION_REQUIRED');
     connection=id;proof=result.proof_id;requestKey=crypto.randomUUID();currentStep=2;step.textContent='Шаг 3 из 4 · Разрешения';body.replaceChildren(badges(result));if(selected.id==='SYNOLOGY')body.append(el('p','iot-owner-confirmed','Владение этим NAS подтверждено сервером. Привязка проверяется при каждом обращении.'));
     const read=el('label','iot-check'),checkbox=el('input');checkbox.type='checkbox';checkbox.checked=false;read.append(checkbox,document.createTextNode(' Разрешить READ — диагностику и чтение статуса'));
     const control=el('label','iot-check'),disabled=el('input');disabled.type='checkbox';disabled.disabled=true;control.append(disabled,document.createTextNode(' CONTROL недоступно на этом этапе'));
     const save=button('Сохранить подключение',()=>saveLink(checkbox.checked));save.disabled=true;checkbox.onchange=()=>{save.disabled=!checkbox.checked;};body.append(read,control,save,button('Назад',discover));feedback.textContent='Привязка не выдаёт доступ агентам автоматически.';
    }catch(e){feedback.textContent='Соединение или авторизация не подтверждены. Подключение не сохранено.';}finally{pending=false;}
   }
   async function saveLink(read){if(pending||!read||currentStep!==2)return;pending=true;feedback.textContent='Сохраняю…';
    try{const result=await rpc('device_register_existing_v1',{p_provider:selected.id,p_connection_id:connection,p_proof_id:proof,p_request_key:requestKey,p_read:true});if(!dialog.open)return;
     if(!result||typeof result.id!=='string')throw Error('REGISTRATION_NOT_CONFIRMED');currentStep=3;step.textContent='Шаг 4 из 4 · Подключение сохранено';body.replaceChildren(el('p','','Существующее подключение добавлено в ваш Hub. CONTROL выключено.'),button('Показать в списке',()=>{dialog.close();detail.hidden=true;list.hidden=false;toolbar.hidden=false;load();}));feedback.textContent='';
    }catch(e){feedback.textContent=message(e);}finally{pending=false;}
   }
   dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const all=[...dialog.querySelectorAll('button,select,input')].filter(x=>!x.disabled);if(!all.length)return;const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
   const dismiss=()=>{if(dialog.open)dialog.close();};addEventListener('hub:authchange',dismiss);addEventListener('hashchange',dismiss);
   dialog.addEventListener('close',()=>{removeEventListener('hub:authchange',dismiss);removeEventListener('hashchange',dismiss);busy=false;dialog.remove();if(focusReturn?.isConnected)focusReturn.focus();});
   dialog.showModal();choose();dialog.querySelector('select').focus();
  }
  load();return {refresh:load};
 }
 window.HubDevices=Object.freeze({mount});
})();
