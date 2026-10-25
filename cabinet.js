/* Cabinet UI shell. All displayed Hub-derived values use textContent. */
(() => {
  "use strict";
  const sections = [
    {id:"today",label:"Сегодня",icon:"⌂"},
    {id:"inbox",label:"Входящие",icon:"▣"},
    {id:"community",label:"Сообщество",icon:"◉"},
    {id:"projects",label:"Проекты",icon:"▤"},
    {id:"agents",label:"Агенты",icon:"◇"},
    {id:"services",label:"Сервисы",icon:"⚙"},
    {id:"settings",label:"Настройки",icon:"☰"}
  ];
  const byId = id => document.getElementById(id);
  const page = byId("cabinetPage");
  const legacy = byId("cabinetLegacy");
  const nav = byId("cabinetNav");
  const bottom = byId("cabinetBottom");
  if (!page || !legacy || !nav || !bottom) return;
  const node = (tag, cls, label) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (label !== undefined) el.textContent = label;
    return el;
  };
  const notice = (title, body) => {
    const card = node("section","cabinet-panel");
    card.append(node("h2","",title),node("p","cabinet-muted",body));
    return card;
  };
  let sessionGeneration=0;
  const safeMessage = error => {
    const status = Number(error?.status || 0);
    if (status === 401 || status === 403) return "Доступ запрещён. Обновите сессию Hub и проверьте разрешения.";
    return "Сервис временно недоступен. Токены и технические ответы скрыты.";
  };
  async function tuyaRequest(path, options={}) {
    const generation=sessionGeneration;
    const token = await accessToken();
    if(byId("account")?.hidden)throw new Error("SESSION_CLOSED");
    const response = await fetch(cfg.supabaseUrl+"/rest/v1/"+path,{
      ...options,
      signal:AbortSignal.timeout(10_000),
      headers:{
        "Authorization":"Bearer "+token,
        "apikey":cfg.supabasePublishableKey,
        "Accept-Profile":"app",
        ...(options.body?{"Content-Type":"application/json","Content-Profile":"app"}:{}),
        ...(options.headers||{})
      }
    });
    if(generation!==sessionGeneration||byId("account")?.hidden)throw new Error("SESSION_CHANGED");
    if (!response.ok) {
      const error = new Error("TUYA_REQUEST_FAILED");
      error.status = response.status;
      throw error;
    }
    return response.status===204?null:response.json();
  }
  function renderTuyaServices() {
    const card=node("section","cabinet-panel service-card");
    const heading=node("div","service-heading");
    const copy=node("div","");
    copy.append(node("h2","","Tuya / Smart Life"),node("p","cabinet-muted","Устройства и права агентов управляются внутри Hub. Отдельная учётная запись Hub не создаётся."));
    const badge=node("span","service-badge","Проверяю…");
    heading.append(copy,badge);
    const message=node("p","service-message","");
    const actions=node("div","service-actions");
    const connect=node("button","primary service-button","Подключить Tuya / Smart Life");
    connect.type="button";
    const disconnect=node("button","service-danger","Отключить сервис");
    disconnect.type="button";
    disconnect.hidden=true;
    actions.append(connect,disconnect);
    const devices=node("div","service-devices");
    card.append(heading,message,actions,devices);
    page.append(card);

    let connection=null;
    const connectUrl=cfg.tuyaConnectUrl;
    connect.addEventListener("click",()=>{
      if (!connectUrl) {
        message.textContent="Подключение станет доступно после настройки server-side OAuth в sandbox.";
        return;
      }
      let target;
      try { target=new URL(connectUrl,location.origin); } catch { message.textContent="Настройка подключения недействительна."; return; }
      if (target.protocol!=="https:" || target.origin!==location.origin) { message.textContent="Подключение заблокировано: требуется HTTPS-адрес этого Hub."; return; }
      location.assign(target.href);
    });
    disconnect.addEventListener("click",async()=>{
      if (!connection || !confirm("Отключить Tuya / Smart Life и немедленно отозвать разрешения агентов?")) return;
      disconnect.disabled=true;
      message.textContent="Отзываю доступ…";
      try {
        const revoked=await tuyaRequest("rpc/tuya_connection_revoke_v1",{method:"POST",body:JSON.stringify({p_connection_id:connection.id})});
        if(revoked!==true)throw new Error("TUYA_REVOKE_NOT_CONFIRMED");
        connection=null;
        badge.textContent="Не подключён";
        disconnect.hidden=true;
        connect.hidden=false;
        devices.replaceChildren();
        message.textContent="Сервис отключён. Новые операции агентов заблокированы.";
      } catch (error) { message.textContent=safeMessage(error); }
      finally { disconnect.disabled=false; }
    });
    (async()=>{
      try {
        const rows=await tuyaRequest("service_connections?select=id,region,status,created_at&provider=eq.TUYA&status=eq.ACTIVE&order=created_at.desc&limit=1");
        connection=Array.isArray(rows)?rows[0]:null;
        if (!connection) {
          badge.textContent="Не подключён";
          message.textContent="Подключение отсутствует. Для sandbox используются только тестовые ключи и виртуальные устройства.";
          return;
        }
        badge.textContent="Подключён · "+connection.region;
        connect.hidden=false;
        connect.textContent="Переподключить";
        disconnect.hidden=false;
        message.textContent="Доступ ограничен текущим пользователем, проектом и разрешениями агентов.";
        const rowsDevices=await tuyaRequest("tuya_devices?select=device_id,display_name,category,online,last_seen_at&connection_id=eq."+encodeURIComponent(connection.id)+"&order=display_name.asc");
        const title=node("h3","","Доступные устройства");
        devices.append(title);
        if (!Array.isArray(rowsDevices)||!rowsDevices.length) devices.append(node("p","cabinet-muted","Устройства ещё не синхронизированы."));
        else for(const item of rowsDevices){
          const row=node("div","service-device");
          row.append(node("strong","",item.display_name||"Устройство"),node("span","",(item.category||"Без категории")+" · "+(item.online===true?"онлайн":item.online===false?"офлайн":"состояние неизвестно")));
          devices.append(row);
        }
        await renderTuyaPermissions(connection,devices);
      } catch(error) {
        badge.textContent="Недоступен";
        message.textContent=safeMessage(error);
      }
    })();
  }
  async function renderTuyaPermissions(connection,container) {
    const panel=node("section","service-permissions");
    panel.append(node("h3","","Доступ агентов"));
    const status=node("p","cabinet-muted","Загружаю разрешения…");panel.append(status);container.append(panel);
    try {
      const [agents,projects,permissions,inventory]=await Promise.all([
        tuyaRequest("agents?select=id,name&order=name.asc"),
        tuyaRequest("project_spaces?select=id,name&status=eq.ACTIVE&order=name.asc"),
        tuyaRequest("tuya_agent_device_permissions?select=project_space_id,device_id,agent_id,permission&connection_id=eq."+encodeURIComponent(connection.id)+"&revoked_at=is.null"),
        tuyaRequest("tuya_devices?select=device_id,display_name&connection_id=eq."+encodeURIComponent(connection.id))
      ]);
      if(![agents,projects,permissions,inventory].every(Array.isArray))throw new Error("INVALID_RESPONSE");
      const select=(label,items)=>{
        const field=node("label","",label),input=node("select","");
        for(const [value,title]of items){const option=node("option","",title);option.value=value;input.append(option);}
        field.append(input);return {field,input};
      };
      const agent=select("Агент",agents.map(x=>[x.id,x.name||"Агент"]));
      const project=select("Проект",projects.map(x=>[x.id,x.name||"Проект"]));
      const device=select("Устройство",inventory.map(x=>[x.device_id,x.display_name||"Устройство"]));
      const permission=select("Права",[["READ","Только чтение"],["CONTROL","Управление"]]);
      const form=node("form","service-permission-form"),grant=node("button","service-button","Разрешить");grant.type="submit";
      grant.disabled=!agents.length||!projects.length||!inventory.length;
      form.append(agent.field,project.field,device.field,permission.field,grant);panel.append(form);
      status.textContent="Права выдаются отдельно для каждого проекта, агента и устройства. Команды дополнительно требуют подтверждения владельца.";
      form.addEventListener("submit",async event=>{
        event.preventDefault();
        if(permission.input.value==="CONTROL"&&!confirm("Разрешить этому агенту управление выбранным устройством? Каждая команда по-прежнему требует отдельного подтверждения."))return;
        grant.disabled=true;
        try{
          const changed=await tuyaRequest("rpc/tuya_permission_set_v1",{method:"POST",body:JSON.stringify({p_connection_id:connection.id,p_project_space_id:project.input.value,p_device_id:device.input.value,p_agent_id:agent.input.value,p_permission:permission.input.value,p_revoke:false})});
          if(changed!==true)throw new Error("TUYA_PERMISSION_NOT_CONFIRMED");
          panel.remove();await renderTuyaPermissions(connection,container);
        }catch(error){status.textContent=safeMessage(error);}
        finally{grant.disabled=false;}
      });
      if(!permissions.length)panel.append(node("p","cabinet-muted","Агентам пока не выдан доступ."));
      for(const entry of permissions){
        const row=node("div","service-device");
        const name=agents.find(x=>x.id===entry.agent_id)?.name||"Агент";
        const deviceName=inventory.find(x=>x.device_id===entry.device_id)?.display_name||"Устройство";
        row.append(node("span","",name+" · "+deviceName+" · "+entry.permission));
        const revoke=node("button","service-danger","Отозвать");revoke.type="button";row.append(revoke);panel.append(row);
        revoke.addEventListener("click",async()=>{
          revoke.disabled=true;
          try{
            const changed=await tuyaRequest("rpc/tuya_permission_set_v1",{method:"POST",body:JSON.stringify({p_connection_id:connection.id,p_project_space_id:entry.project_space_id,p_device_id:entry.device_id,p_agent_id:entry.agent_id,p_permission:entry.permission,p_revoke:true})});
            if(changed!==true)throw new Error("TUYA_PERMISSION_NOT_CONFIRMED");
            row.remove();status.textContent="Разрешение отозвано. Следующая команда будет проверена сервером заново.";
          }catch(error){status.textContent=safeMessage(error);revoke.disabled=false;}
        });
      }
    }catch(error){status.textContent="Управление разрешениями недоступно. "+safeMessage(error);}
  }
  function active() {
    const id = location.hash.replace(/^#\/?/,"").split("/")[0];
    return sections.some(x=>x.id===id)?id:"today";
  }
  function link(item) {
    const a = node("a","cabinet-link",item.icon+"  "+item.label);
    a.href = "#/"+item.id;
    a.dataset.section = item.id;
    return a;
  }
  for (const item of sections) {
    nav.append(link(item));
    bottom.append(link(item));
  }
  const more = node("button","cabinet-more","Ещё · 7 разделов");
  more.type="button";
  more.setAttribute("aria-expanded","false");
  more.setAttribute("aria-controls","cabinetBottom");
  more.addEventListener("click",()=>{
    const expanded=bottom.classList.toggle("expanded");
    more.setAttribute("aria-expanded",String(expanded));
    more.textContent=expanded?"Свернуть":"Ещё · 7 разделов";
  });
  bottom.append(more);
  const header=byId("cabinetHeading")?.parentElement;
  const logoutButton=byId("logout");
  if(header && logoutButton){
    const exit=node("button","cabinet-global-logout","Выйти");
    exit.type="button";
    exit.addEventListener("click",()=>logoutButton.click());
    header.append(exit);
  }
  function render() {
    const id = active();
    const item = sections.find(x=>x.id===id);
    byId("cabinetHeading").textContent = item.label;
    for (const a of document.querySelectorAll("[data-section]")) {
      const selected = a.dataset.section === id;
      a.classList.toggle("selected",selected);
      if(selected)a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    }
    page.replaceChildren();
    if(sections.findIndex(x=>x.id===id)>2){bottom.classList.add("expanded");more.setAttribute("aria-expanded","true");more.textContent="Свернуть";}
    legacy.hidden = id!=="agents";
    if (id==="today") {
      const tabs = node("div","cabinet-tabs");
      for (const label of ["Мне","Агентам","Журнал"]) {
        const b = node("button","cabinet-tab",label);
        b.type="button";
        b.addEventListener("click",()=>{
          tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===b));
          const msg=byId("cabinetInboxMessage");
          msg.textContent="Данные этой вкладки появятся после проверки пользовательского доступа к глобальному Inbox.";
        });
        tabs.append(b);
      }
      tabs.firstChild.classList.add("selected");
      const intro=node("div","cabinet-intro");
      intro.append(node("p","cabinet-eyebrow","РАБОЧЕЕ ПРОСТРАНСТВО"),node("h2","","Всё важное в одном месте"),node("p","cabinet-muted","Входящие, поручения агентам и события проектов. Данные появятся только после безопасного подключения к вашему аккаунту."));
      page.append(intro,tabs);
      const panel=notice("Глобальный Inbox","Ожидается подключение пользовательского API. Счётчики и уведомления не отображаются, пока не подтверждены права доступа.");
      panel.querySelector("p").id="cabinetInboxMessage";
      panel.setAttribute("aria-label","Состояние глобального Inbox");
      page.append(panel);
      const actions=node("div","cabinet-action-grid");
      for (const [title,description,href] of [
        ["Мои проекты","Продолжить работу в доступных пространствах","#/projects"],
        ["Мои агенты","Подключить или проверить AI-агента","#/agents"],
        ["Сервисы","Управлять будущими интеграциями","#/services"]
      ]) {
        const a=node("a","cabinet-action");
        a.href=href;
        a.append(node("strong","",title),node("span","",description));
        actions.append(a);
      }
      page.append(node("h2","cabinet-section-title","Быстрый переход"),actions);
    } else if (id==="inbox") {
      page.append(notice("Входящие","Единый Inbox использует существующие права Hub. Неподтверждённые и чужие элементы не отображаются."));
    } else if (id==="community") {
      page.append(notice("Сообщество","Общие пространства будут показаны только после проверки membership и действующего доступа."));
    } else if (id==="projects") {
      page.append(notice("Мои проекты","Список проектов будет доступен после проверки прав пользовательского JWT. Чужие проекты не отображаются."));
    } else if (id==="agents") {
      page.append(notice("Подключение AI-агентов","Существующий мастер подключения сохранён ниже. Статус связи нужно проверять реальным запросом."));
    } else if (id==="services") {
      page.append(notice("Подключённые сервисы","Интеграции используют текущую сессию Hub, RLS и права проектов. Секреты и ответы провайдеров в браузере не отображаются."));
      if(!byId("account")?.hidden)renderTuyaServices();
    } else if (id==="settings") {
      page.append(notice("Настройки","Настройки аккаунта используют существующую идентификацию Hub. Управление отдельной учётной записью для сервисов не требуется."));
    }
  }
  addEventListener("hub:authchange",event=>{
    sessionGeneration++;
    if(event.detail?.authenticated)render();
    else {page.replaceChildren();legacy.hidden=true;byId("cabinetAccountLabel").textContent="";}
  });
  addEventListener("hashchange",render);
  render();
  const email=byId("userEmail");
  if(email) new MutationObserver(()=>{byId("cabinetAccountLabel").textContent=email.textContent;}).observe(email,{childList:true,subtree:true});
})();

