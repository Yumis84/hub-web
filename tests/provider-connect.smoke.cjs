// Run: node tests/provider-connect.smoke.cjs
// No credentials, network or browser automation required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../provider-connect.js"), "utf8");
const MCP = "https://enhcnvzzkyvusthfjnci.supabase.co/functions/v1/mcp-gateway/mcp";
const ids = ["providerSelect","providerActions","openProvider","copyMcpUrl","mcpServerUrl","providerInstructions","providerHeading"];
function node() {
  const listeners = {};
  return {
    hidden: true, value: "", textContent: "", selected: false,
    addEventListener(name, cb) { listeners[name] = cb; },
    async fire(name) { assert.equal(typeof listeners[name], "function", name + " listener"); await listeners[name](); },
    focus() { this.focused = true; }, select() { this.selected = true; }
  };
}
async function run() {
  const els = Object.fromEntries(ids.map(id => [id, node()]));
  const copied = [], visited = [];
  const sandbox = {
    document: { getElementById: id => els[id] || null, execCommand: () => true },
    navigator: { clipboard: { writeText: async text => copied.push(text) } },
    window: { isSecureContext: true, location: { assign: url => visited.push(url) } }
  };
  vm.runInNewContext(source, sandbox, {filename:"provider-connect.js"});
  for (const provider of ["chatgpt","claude","grok"]) {
    els.providerSelect.value = provider;
    await els.providerSelect.fire("change");
    assert.equal(els.providerActions.hidden, false);
    assert.equal(els.mcpServerUrl.value, MCP);
    assert.ok(els.providerHeading.textContent.includes(provider === "chatgpt" ? "ChatGPT" : provider === "claude" ? "Claude" : "Grok"));
    await els.copyMcpUrl.fire("click");
    assert.equal(copied.at(-1), MCP);
    await els.openProvider.fire("click");
    assert.match(visited.at(-1), /^https:\/\//);
  }
  els.providerSelect.value = "";
  await els.providerSelect.fire("change");
  assert.equal(els.providerActions.hidden, true);
  console.log("PASS: 3 providers, selection, MCP URL, copy, navigation, reset");
}
run().catch(e => { console.error(e); process.exitCode = 1; });
