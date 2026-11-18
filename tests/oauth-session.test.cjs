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

async function runConsent({ setSession, details, stored = true, bindError = null }) {
  const $ = elements();
  const store = storage(stored ? { hub_access_token: 'a', hub_refresh_token: 'r' } : {});
  const target = 'https://ai-agent-hub.fun/oauth/consent/?authorization_id=auth-123';
  const calls = [];
  const location = {
    href: target, search: '?authorization_id=auth-123',
    assign: url => calls.push(['assign', url]),
    replace: url => calls.push(['replace', url]),
  };
  let detailsCalls = 0;
  const sb = { auth: {
    setSession: async () => setSession,
    oauth: {
      getAuthorizationDetails: async () => { detailsCalls++; return details; },
      approveAuthorization: async id => {
        calls.push(['approve', id]);
        return { data: { redirect_url: callback } };
      },
    },
  }, schema: schema => ({
    rpc: async (name, args) => {
      calls.push([schema, name, args.p_authorization_id]);
      return { error: bindError };
    },
  }) };
  const code = consent.replace(/^import\{createClient\}from[^;]+;/, '');
  await vm.runInNewContext('(async()=>{' + code + '})()', {
    window: { HUB_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public' } },
    document: { querySelector: $ }, location, localStorage: store,
    createClient: () => sb, URLSearchParams, URL, encodeURIComponent,
  });
  return { $, store, detailsCalls, target, calls };
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
    { stored: true, setSession: { data: null, error: { status: 400, code: 'refresh_token_not_found', message: 'refresh rejected' } } },
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
  assert.equal(r.store.getItem('hub_refresh_token'), 'valid-r');
  assert.deepEqual(r.calls, []);
});

test('transient Hub Auth error preserves existing browser credentials', async () => {
  const r = await runConsent({
    setSession: { data: null, error: { status: 503, message: 'Auth temporarily unavailable' } },
  });
  assert.equal(r.store.getItem('hub_access_token'), 'a');
  assert.equal(r.store.getItem('hub_refresh_token'), 'r');
  assert.equal(r.$('#needLogin').hidden, true);
  assert.match(r.$('#error').textContent, /temporarily unavailable/);
});


const callback = 'https://client.example.test/callback?code=fixture-code&state=original%2Bstate';
const validSession = {
  data: { session: { access_token: 'a', refresh_token: 'r', user: { email: 'hub@example.test' } } },
};

test('approval binds the original authorization before forwarding the unchanged callback', async () => {
  const r = await runConsent({ setSession: validSession, details: { data: { authorization_id: 'auth-123' } } });
  await r.$('#approve').onclick();
  assert.deepEqual(r.calls, [
    ['app', 'bind_oauth_authorization', 'auth-123'],
    ['approve', 'auth-123'],
    ['replace', callback],
  ]);
});

test('binding failure stops approval and preserves the web session', async () => {
  const r = await runConsent({
    setSession: validSession,
    details: { data: { authorization_id: 'auth-123' } },
    bindError: { message: 'Connection binding failed' },
  });
  await r.$('#approve').onclick();
  assert.deepEqual(r.calls, [['app', 'bind_oauth_authorization', 'auth-123']]);
  assert.equal(r.$('#error').textContent, 'Connection binding failed');
  assert.equal(r.store.getItem('hub_refresh_token'), 'r');
});

test('prior consent forwards the callback without a second explicit binding', async () => {
  const r = await runConsent({ setSession: validSession, details: { data: { redirect_url: callback } } });
  assert.deepEqual(r.calls, [['assign', callback]]);
  assert.equal(r.$('#consent').hidden, true);
});

test('password re-login persists the web session and returns to the original consent URL', async () => {
  const $ = elements();
  const store = storage();
  const origin = 'https://ai-agent-hub.fun';
  const target = origin + '/oauth/consent/?authorization_id=opaque%2Brequest';
  const search = '?oauth_return=' + encodeURIComponent(target);
  const redirects = [];
  const location = { origin, href: origin + '/' + search, pathname: '/', search, assign: u => redirects.push(u) };
  vm.runInNewContext(app, {
    window: { HUB_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public', mode: 'production' } },
    document: { querySelector: $ }, location, localStorage: store,
    history: { replaceState() { location.search = ''; } },
    fetch: async url => {
      assert.equal(url, 'https://example.supabase.co/auth/v1/token?grant_type=password');
      return { ok: true, json: async () => ({ ...validSession.data.session }) };
    },
    URL, URLSearchParams, JSON, Date, atob, setTimeout,
  });
  await flush();
  assert.deepEqual(redirects, []);
  $('#email').value = 'hub@example.test';
  $('#password').value = 'fixture-password';
  await $('#form').onsubmit({ preventDefault() {} });
  assert.deepEqual(redirects, [target]);
  assert.equal(store.getItem('hub_access_token'), 'a');
  assert.equal(store.getItem('hub_refresh_token'), 'r');
});
