import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { allowedCallback, registeredCallback, consentReturn, origin, resource, supabaseUrl } from '../acceptance-site/config.mjs';

const production = [
  'ai-agent-hub.fun', 'enhcnvzzkyvusthfjnci.supabase.co',
  'yumis84.github.io', '/functions/v1/mcp-gateway',
];
const callback = 'https://chatgpt.com/connector/oauth/fixture_B';

test('all deployable files exclude production routes and use only approved network destinations', async () => {
  const root = new URL('../acceptance-site/', import.meta.url);
  const files = await readdir(root, { recursive: true, withFileTypes: true });
  for (const file of files.filter(item => item.isFile())) {
    const body = await readFile(file.parentPath + '/' + file.name, 'utf8');
    for (const marker of production) assert.ok(!body.includes(marker), file.name + ': ' + marker);
    for (const match of body.matchAll(/https:\/\/[^\s'"<>;]+/g)) {
      assert.ok([origin, supabaseUrl, 'https://chatgpt.com', 'https://cdn.jsdelivr.net'].includes(new URL(match[0]).origin));
    }
  }
  assert.equal(new URL(resource).origin, supabaseUrl);
  assert.match(await readFile(new URL('_headers', root), 'utf8'), /connect-src https:\/\/trrhyahuzqbozxanaczw\.supabase\.co;/);
});

test('login returns unchanged opaque authorization ID on the acceptance origin', () => {
  const id = 'opaque+/=&?';
  const target = new URL(consentReturn(origin, id));
  assert.equal(target.origin, origin);
  assert.equal(target.pathname, '/consent/');
  assert.equal(target.searchParams.get('authorization_id'), id);
  for (const host of production.slice(0, 3)) assert.throws(() => consentReturn('https://' + host, id));
  assert.throws(() => consentReturn(origin, ''));
});

test('OAuth response navigates only to the exact verified ChatGPT path', () => {
  const success = callback + '?code=fixture&state=original%2Bstate';
  assert.equal(allowedCallback(success, callback), success);
  assert.equal(allowedCallback(callback + '?error=access_denied', callback), callback + '?error=access_denied');
  const stable = 'https://chatgpt.com/connector_platform_oauth_redirect';
  assert.equal(allowedCallback(stable + '?code=fixture', stable), stable + '?code=fixture');
  for (const bad of [
    'https://ai-agent-hub.fun/oauth/callback/?code=fixture',
    'https://enhcnvzzkyvusthfjnci.supabase.co/?code=fixture',
    'https://chatgpt.com.evil.test/connector/oauth/fixture_B?code=fixture',
    'https://chatgpt.com/connector/oauth/other?code=fixture',
    'https://chatgpt.com/connector/oauth/fixture_B?code=fixture#fragment',
    callback, '/connector/oauth/fixture_B?code=fixture',
  ]) assert.throws(() => allowedCallback(bad, callback));
  assert.throws(() => allowedCallback(success));
  assert.throws(() => registeredCallback('https://ai-agent-hub.fun/oauth/callback/'));
});
