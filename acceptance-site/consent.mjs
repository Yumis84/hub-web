import { client } from './session.mjs';
import { allowedCallback, chatgptCallback, consentReturn, registeredCallback } from './config.mjs';

const status = document.querySelector('[role=status]');
const panel = document.querySelector('section');

try {
  if (!chatgptCallback) throw new Error('Callback ChatGPT B ещё не согласован.');
  registeredCallback();
  const id = new URLSearchParams(location.search).get('authorization_id');
  consentReturn(location.origin, id);
  const sb = client();
  const redirect = result => location.replace(allowedCallback(result?.redirect_url));
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) {
    const login = document.querySelector('#login');
    const url = new URL('/login/', location.origin);
    url.searchParams.set('authorization_id', id);
    login.href = url.href;
    login.hidden = false;
    status.textContent = 'Войдите под тестовой учётной записью.';
  } else {
    const { data, error } = await sb.auth.oauth.getAuthorizationDetails(id);
    if (error) throw error;
    if (data?.redirect_url) {
      redirect(data);
    } else {
      if (data?.authorization_id !== id || data?.redirect_uri !== chatgptCallback) {
        throw new Error('Получены неожиданные параметры OAuth.');
      }
      document.querySelector('#client').textContent = data.client?.name ?? 'ChatGPT';
      panel.hidden = false;
      status.textContent = 'Подтвердите доступ тестового клиента.';
      for (const [button, action] of [
        ['#approve', () => sb.auth.oauth.approveAuthorization(id)],
        ['#deny', () => sb.auth.oauth.denyAuthorization(id)],
      ]) {
        document.querySelector(button).onclick = async () => {
          panel.hidden = true;
          try {
            const { data: result, error: actionError } = await action();
            if (actionError) throw actionError;
            redirect(result);
          } catch {
            status.textContent = 'Ответ OAuth не принят. Запишите код ошибки из Network.';
          }
        };
      }
    }
  }
} catch (error) {
  panel.hidden = true;
  status.textContent = !chatgptCallback
    ? 'Callback ChatGPT B ещё не согласован.'
    : 'Запрос остановлен. Для диагностики используйте статус ответа в Network.';
}
