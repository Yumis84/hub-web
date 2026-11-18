export const origin = 'https://hub-acceptance-ai-agent-hub.pages.dev';
export const supabaseUrl = 'https://trrhyahuzqbozxanaczw.supabase.co';
export const publishableKey = 'sb_publishable_gJ2s1m3TcfLlVymFoOHfkQ_iMxO7rB5';
export const resource = supabaseUrl + '/functions/v1/mcp-project-acceptance/mcp';

// Populate only with the exact URI verified in ChatGPT B configuration.
export const chatgptCallback = '';

export function consentReturn(base, authorizationId) {
  if (base !== origin || !authorizationId) throw new Error('Invalid acceptance context');
  const url = new URL('/consent/', origin);
  url.searchParams.set('authorization_id', authorizationId);
  return url.href;
}

export function registeredCallback(expected = chatgptCallback) {
  if (!expected) throw new Error('Callback is not configured');
  const registered = new URL(expected);
  if (registered.origin !== 'https://chatgpt.com' || registered.href !== expected ||
      registered.username || registered.password || registered.search || registered.hash ||
      !/^(?:\/connector\/oauth\/[A-Za-z0-9_-]+|\/connector_platform_oauth_redirect)$/.test(registered.pathname)) {
    throw new Error('Unexpected registered callback');
  }
  return registered;
}

export function allowedCallback(candidate, expected = chatgptCallback) {
  const registered = registeredCallback(expected);
  if (typeof candidate !== 'string') throw new Error('Missing OAuth callback');
  const actual = new URL(candidate);
  if (actual.origin !== registered.origin || actual.pathname !== registered.pathname ||
      actual.username || actual.password || actual.hash ||
      (!actual.searchParams.get('code') && !actual.searchParams.get('error'))) {
    throw new Error('Unexpected OAuth callback');
  }
  return candidate;
}
