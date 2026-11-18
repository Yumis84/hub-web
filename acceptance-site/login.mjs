import { client } from './session.mjs';
import { chatgptCallback, consentReturn, registeredCallback } from './config.mjs';

const form = document.querySelector('form');
const button = form.querySelector('button');
const status = document.querySelector('[role=status]');

try {
  if (!chatgptCallback) throw new Error('Callback ChatGPT B ещё не согласован.');
  registeredCallback();
  const id = new URLSearchParams(location.search).get('authorization_id');
  const destination = consentReturn(location.origin, id);
  const sb = client();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true;
    try {
      const fields = new FormData(form);
      const { error } = await sb.auth.signInWithPassword({
        email: fields.get('email'), password: fields.get('password'),
      });
      if (error) throw error;
      location.replace(destination);
    } catch {
      status.textContent = 'Вход не выполнен. Проверьте тестовую учётную запись.';
      button.disabled = false;
    }
  });
  button.disabled = false;
} catch (error) {
  status.textContent = error.message;
}
