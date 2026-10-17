/* Provider connection launcher: no tokens, no implicit authorization. */
(() => {
  const select = document.getElementById("providerSelect");
  const actions = document.getElementById("providerActions");
  const open = document.getElementById("openProvider");
  const copy = document.getElementById("copyMcpUrl");
  const field = document.getElementById("mcpServerUrl");
  const instructions = document.getElementById("providerInstructions");
  if (!select || !actions || !open || !copy || !field || !instructions) return;
  const MCP = "https://enhcnvzzkyvusthfjnci.supabase.co/functions/v1/mcp-gateway/mcp";
  const providers = {
    claude: {
      label: "Открыть добавление в Claude",
      url: "https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=" + encodeURIComponent("AI Agent Hub") + "&connectorUrl=" + encodeURIComponent(MCP),
      help: "Проверьте имя и MCP URL, подтвердите создание коннектора и авторизуйтесь в Hub. Если окно добавления не открылось автоматически, выберите «Add custom connector»."
    },
    chatgpt: {
      label: "Открыть ChatGPT",
      url: "https://chatgpt.com/",
      help: "В ChatGPT откройте Plugins → «+» → Add custom MCP server. Вставьте скопированный MCP URL, подтвердите добавление и OAuth. Прямое автозаполнение URL не подтверждено."
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
    open.textContent = provider.label;
    instructions.textContent = provider.help;
  });
  copy.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(MCP);
      else { field.focus(); field.select(); document.execCommand("copy"); }
      instructions.textContent = "Адрес MCP скопирован. " + providers[select.value].help;
    } catch {
      field.focus(); field.select();
      instructions.textContent = "Скопируйте выделенный адрес вручную. " + providers[select.value].help;
    }
  });
  open.addEventListener("click", () => {
    const provider = providers[select.value];
    if (provider) window.open(provider.url, "_blank", "noopener,noreferrer");
  });
})();
