/* Cabinet UI shell. All displayed Hub-derived values use textContent. */
(() => {
  "use strict";
  const sections = [
    {id:"today",label:"Сегодня",icon:"⌂"},
    {id:"projects",label:"Проекты",icon:"▤"},
    {id:"agents",label:"Агенты",icon:"◇"},
    {id:"services",label:"Сервисы",icon:"⚙"}
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
    } else if (id==="projects") {
      page.append(notice("Мои проекты","Список проектов будет доступен после проверки прав пользовательского JWT. Чужие проекты не отображаются."));
    } else if (id==="agents") {
      page.append(notice("Подключение AI-агентов","Существующий мастер подключения сохранён ниже. Статус связи нужно проверять реальным запросом."));
    } else if (id==="services") {
      page.append(notice("Подключённые сервисы","Каталог и управление доступом появятся после реализации серверной проверки разрешений. Composio пока не подключён через этот интерфейс."));
    }
  }
  addEventListener("hashchange",render);
  render();
  const email=byId("userEmail");
  if(email) new MutationObserver(()=>{byId("cabinetAccountLabel").textContent=email.textContent;}).observe(email,{childList:true,subtree:true});
})();
