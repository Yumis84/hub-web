// Run: node --test tests/oauth-session.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const consent = fs.readFileSync(path.join(__dirname, '../oauth/consent/consent.js'), 'utf8');

function elements() {
  const map = new Map();
  return (selector) => {
    if (!map.has(selector)) map.set(selector, {
      hidden: selector === '#needLogin' || selector === '#consent' || selector === '#account', disabled: false, textContent: '', value: '',
      classList: { toggle() {} }, onclick: null,
    });
    return map.get(selector);
  };
}
function storage(values = {}) {
  const data = new Map(Object.entries(values));
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    get hub_access_token() { return data.get('hub_access_token'); },
    set hub_access_token(v) { data.set('hub_access_token', v); },
    get hub_refresh_token() { return data.get('hub_refresh_token'); },
    set hub_refresh_token(v) { data.set('hub_refresh_token', v); },
  };
}
async function flush() { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); }

test('cached Hub user cannot consume OAuth return before token validation', async () => {
  const $ = elements();
  const store = storage({ hub_user: JSON.stringify({ email: 'cached@example.test' }), hub_refresh_token: 'refresh' });
  let resolveAuth;
  const auth = new Promise(resolve => { resolveAuth = resolve; });
  const redirects = [];
  const location = {
    href: 'https://ai-agent-hub.fun/?oauth_return=' + encodeURIComponent('https://ai-agent-hub.fun/oauth/consent/?authorization_id=abc'),
    origin: 'https://ai-agent-hub.fun', pathname: '/', search: '?oauth_return=' + encodeURIComponent('https://ai-agent-hub.fun/oauth/consent/?authorization_id=abc'),
    assign: u => redirects.push(u),
  };
  const context = {
    window: { HUB_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public', mode: 'production' } },
    document: { querySelector: $ }, location,
    localStorage: store, history: { replaceState() {} },
    fetch: async (url) => {
      if (url.includes('grant_type=refresh_token')) return auth;
      throw Error('Unexpected fetch ' + url);
    },
    URL, URLSearchParams, JSON, Date, atob, setTimeout,
  };
  vm.runInNewContext(app, context);
  await flush();
  assert.deepEqual(redirects, []);
  assert.equal($('#account').hidden, true);
  resolveAuth({ ok: false, status: 401, json: async () => ({ message: 'invalid refresh token' }) });
  await flush();
  assert.deepEqual(redirects, []);
  assert.equal($('#auth').hidden, false);
  assert.match($('#message').textContent, /Войдите в Hub снова/);
});

test('valid refreshed Hub session returns to exact same-origin consent URL', async () => {
  const $ = elements();
  const store = storage({ hub_user: JSON.stringify({ email: 'cached@example.test' }), hub_refresh_token: 'refresh' });
  const redirects = [];
  const target = 'https://ai-agent-hub.fun/oauth/consent/?authorization_id=abc123';
  const location = { href: 'https://ai-agent-hub.fun/?oauth_return=' + encodeURIComponent(target), origin: 'https://ai-agent-hub.fun', pathname: '/', search: '?oauth_return=' + encodeURIComponent(target), assign: u => redirects.push(u) };
  const context = {
    window: { HUB_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public', mode: 'production' } },
    document: { querySelector: $ }, location, localStorage: store,
    history: { replaceState() {} },
    fetch: async url => url.includes('grant_type=refresh_token')
      ? { ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) }
      : url.endsWith('/user')
        ? { ok: true, json: async () => ({ email: 'validated@example.test' }) }
        : (() => { throw Error('Unexpected fetch ' + url); })(),
    URL, URLSearchParams, JSON, Date, atob, setTimeout,
  };
  vm.runInNewContext(app, context);
  await flush();
  assert.deepEqual(redirects, [target]);
  assert.equal(store.getItem('hub_refresh_token'), 'new-refresh');
});

async function runConsent({ setSession, details, stored = true }) {
  const $ = elements();
  const store = storage(stored ? { hub_access_token: 'a', hub_refresh_token: 'r' } : {});
  const target = 'https://ai-agent-hub.fun/oauth/consent/?authorization_id=auth-123';
  const location = { href: target, search: '?authorization_id=auth-123', assign() {}, replace() {} };
  let detailsCalls = 0;
  const sb = { auth: {
    setSession: async () => setSession,
    oauth: { getAuthorizationDetails: async () => { detailsCalls++; return details; } },
  } };
  const code = consent.replace(/^import\{createClient\}from[^;]+;/, '');
  await vm.runInNewContext('(async()=>{' + code + '})()', {
    window: { HUB_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public' } },
    document: { querySelector: $ }, location, localStorage: store,
    createClient: () => sb, URLSearchParams, URL, encodeURIComponent,
  });
  return { $, store, detailsCalls, target };
}

test('consent restores an existing Hub session and requests authorization details', async () => {
  const r = await runConsent({
    setSession: { data: { session: { access_token: 'new-a', refresh_token: 'new-r', user: { email: 'hub@example.test' } } }, error: null },
    details: { data: { authorization_id: 'auth-123', client: { name: 'ChatGPT 2' }, scope: 'email' }, error: null },
  });
  assert.equal(r.detailsCalls, 1);
  assert.equal(r.$('#consent').hidden, false);
  assert.equal(r.$('#currentUser').textContent, 'hub@example.test');
  assert.equal(r.store.getItem('hub_access_token'), 'new-a');
});

test('consent missing/invalid session offers login while preserving authorization_id', async () => {
  for (const input of [
    { stored: false },
    { stored: true, setSession: { data: null, error: { message: 'refresh rejected' } } },
  ]) {
    const r = await runConsent(input);
    assert.equal(r.$('#needLogin').hidden, false);
    assert.equal(r.detailsCalls, 0);
    assert.equal(new URL(r.$('#loginLink').href, 'https://ai-agent-hub.fun').searchParams.get('oauth_return'), r.target);
  }
});

test('OAuth authorization errors are not misclassified as a missing Hub session', async () => {
  const r = await runConsent({
    setSession: { data: { session: { access_token: 'valid-a', refresh_token: 'valid-r', user: { email: 'hub@example.test' } } }, error: null },
    details: { data: null, error: { message: 'authorization_id expired or invalid' } },
  });
  assert.equal(r.$('#needLogin').hidden, true);
  assert.equal(r.$('#error').textContent, 'authorization_id expired or invalid');
  assert.equal(r.store.getItem('hub_access_token'), 'valid-a');
});
