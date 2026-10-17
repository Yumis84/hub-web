/* Provider connection launcher: no tokens, no implicit authorization. */
(() => {
  const select = document.getElementById("providerSelect");
  const actions = document.getElementById("providerActions");
  const open = document.getElementById("openProvider");
  const copy = document.getElementById("copyMcpUrl");
  const field = document.getElementById("mcpServerUrl");
  const instructions = document.getElementById("providerInstructions");
  const heading = document.getElementById("providerHeading");
  if (!select || !actions || !open || !copy || !field || !instructions) return;
  const MCP = "https://enhcnvzzkyvusthfjnci.supabase.co/functions/v1/mcp-gateway/mcp";
  const providers = {
    claude: {
      label: "Открыть добавление в Claude",
      url: "https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=" + encodeURIComponent("AI Agent Hub") + "&connectorUrl=" + encodeURIComponent(MCP),
      help: "Проверьте имя и MCP URL, подтвердите создание коннектора и авторизуйтесь в Hub. Если окно добавления не открылось автоматически, выберите «Add custom connector»."
    },
    chatgpt: {
      label: "Перейти в ChatGPT",
      url: "https://chatgpt.com/",
      help: "Откройте Settings → Plugins/Apps → создание пользовательского MCP-подключения. Вставьте MCP URL и подтвердите OAuth. Точный deep link формы добавления пока не подтверждён, поэтому открывается ChatGPT без неподдерживаемого URL."
    },
    grok: {
      label: "Открыть коннекторы Grok",
      url: "https://grok.com/connectors",
      help: "В Grok выберите New Connector → Custom, вставьте MCP URL и пройдите авторизацию."
    }
  };
  select.addEventListener("change", () => {
    const provider = providers[select.value];
    actions.hidden = !provider;
    if (!provider) return;
    field.value = MCP;
    open.textContent = provider.label + " ↗";
    if (heading) heading.textContent = "Подключить " + ({chatgpt:"ChatGPT",claude:"Claude",grok:"Grok"}[select.value]);
    instructions.textContent = provider.help;
  });
  copy.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(MCP);
      else { field.focus(); field.select(); if (!document.execCommand("copy")) throw new Error("Copy unavailable"); }
      instructions.textContent = "Адрес MCP скопирован. " + providers[select.value].help;
    } catch {
      field.focus(); field.select();
      instructions.textContent = "Скопируйте выделенный адрес вручную. " + providers[select.value].help;
    }
  });
  open.addEventListener("click", () => {
    const provider = providers[select.value];
    if (provider) { const tab = window.open(provider.url, "_blank", "noopener,noreferrer"); if (!tab) instructions.textContent = "Браузер мог заблокировать новое окно. Откройте адрес вручную: " + provider.url; }
  });
})();
