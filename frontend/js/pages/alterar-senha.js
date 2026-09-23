import { API_URL, SESSION_KEY } from '../config.js';
import { toast, initShell } from '../ui.js?v=2';
import { guardPagina } from '../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = guardPagina();
  if (!usuario) return;

  initShell('alterar-senha', usuario);

  const form = document.getElementById('form-alterar-senha');
  const alertaForm = document.getElementById('alerta-form');
  const alertaSucesso = document.getElementById('alerta-sucesso');
  const btnVoltar = document.getElementById('btn-voltar');

  btnVoltar.addEventListener('click', () => {
    window.history.back();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertaForm.classList.add('hidden');
    alertaSucesso.classList.add('hidden');

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      alertaForm.textContent = 'As novas senhas não conferem.';
      alertaForm.classList.remove('hidden');
      return;
    }

    if (newPassword.length < 6) {
      alertaForm.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
      alertaForm.classList.remove('hidden');
      return;
    }

    const btnSalvar = document.getElementById('btn-salvar');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      const response = await fetch(`${API_URL}/user-auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        alertaSucesso.textContent = data.message || 'Senha alterada com sucesso!';
        alertaSucesso.classList.remove('hidden');
        form.reset();
        toast('Senha alterada com sucesso!', 'sucesso');
      } else {
        alertaForm.textContent = data.message || 'Erro ao alterar senha.';
        alertaForm.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Erro:', error);
      alertaForm.textContent = 'Erro de conexão. Tente novamente.';
      alertaForm.classList.remove('hidden');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar nova senha';
    }
  });
});