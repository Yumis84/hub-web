import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.96.0/+esm';
import { origin, supabaseUrl, publishableKey } from './config.mjs';

export function client() {
  if (location.origin !== origin) throw new Error('Wrong acceptance origin');
  return createClient(supabaseUrl, publishableKey, {
    auth: { storageKey: 'hub-acceptance-oauth-session', detectSessionInUrl: false },
  });
}
