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
  const safeMessage = error => {
    const status = Number(error?.status || 0);
    if (status === 401 || status === 403) return "Доступ запрещён. Обновите сессию Hub и проверьте разрешения.";
    return "Сервис временно недоступен. Токены и технические ответы скрыты.";
  };
  async function tuyaRequest(path, options={}) {
    const token = await accessToken();
    const response = await fetch(cfg.supabaseUrl+"/rest/v1/"+path,{
      ...options,
      headers:{
        "Authorization":"Bearer "+token,
        "apikey":cfg.supabasePublishableKey,
        "Accept-Profile":"app",
        ...(options.body?{"Content-Type":"application/json","Content-Profile":"app"}:{}),
        ...(options.headers||{})
      }
    });
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
        await tuyaRequest("rpc/tuya_connection_revoke_v1",{method:"POST",body:JSON.stringify({p_connection_id:connection.id})});
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
        connect.hidden=true;
        disconnect.hidden=false;
        message.textContent="Доступ ограничен текущим пользователем, проектом и разрешениями агентов.";
        const rowsDevices=await tuyaRequest("tuya_devices?select=device_id,display_name,category,online&connection_id=eq."+encodeURIComponent(connection.id)+"&order=display_name.asc");
        const title=node("h3","","Доступные устройства");
        devices.append(title);
        if (!Array.isArray(rowsDevices)||!rowsDevices.length) devices.append(node("p","cabinet-muted","Устройства ещё не синхронизированы."));
        else for(const item of rowsDevices){
          const row=node("div","service-device");
          row.append(node("strong","",item.display_name||"Устройство"),node("span","",(item.category||"Без категории")+" · "+(item.online?"онлайн":"офлайн")));
          devices.append(row);
        }
      } catch(error) {
        badge.textContent="Недоступен";
        message.textContent=safeMessage(error);
      }
    })();
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
    if(event.detail?.authenticated)render();
    else {page.replaceChildren();legacy.hidden=true;byId("cabinetAccountLabel").textContent="";}
  });
  addEventListener("hashchange",render);
  render();
  const email=byId("userEmail");
  if(email) new MutationObserver(()=>{byId("cabinetAccountLabel").textContent=email.textContent;}).observe(email,{childList:true,subtree:true});
})();
