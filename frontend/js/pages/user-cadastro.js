import { api } from '../api.js';
import { toast, initShell, emptyState, escapeHtml } from '../ui.js';
import { guardPagina } from '../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Apenas Administradores podem acessar
  const usuario = guardPagina(['Admin']);
  if (!usuario) return;

  initShell('cadastrar-usuario', usuario);

  const formUser = document.getElementById('form-user');
  const btnSalvar = document.getElementById('btn-salvar');
  const alertaForm = document.getElementById('alerta-form');
  const btnVoltar = document.getElementById('btn-voltar');
  const tabelaWrapper = document.getElementById('tabela-usuarios-wrapper');

  btnVoltar.addEventListener('click', () => {
    window.history.back();
  });

  // Carrega lista de usuários
  async function carregarUsuarios() {
    try {
      const usuarios = await api('/users');
      
      if (usuarios.length === 0) {
        emptyState(tabelaWrapper, 'Nenhum usuário', 'Nenhum usuário foi cadastrado ainda.');
        return;
      }

      let tbodyHtml = '';
      usuarios.forEach(u => {
        tbodyHtml += `
          <tr>
            <td><strong>${escapeHtml(u.nome)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.cargo)}</td>
            <td style="color:var(--text-secundario)">${escapeHtml(u.cpf || '—')}</td>
          </tr>
        `;
      });

      tabelaWrapper.innerHTML = `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo / Perfil</th>
                <th>CPF</th>
              </tr>
            </thead>
            <tbody>
              ${tbodyHtml}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      tabelaWrapper.innerHTML = `<p class="muted" style="color:var(--erro)">Erro ao carregar usuários: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Submissão do formulário
  formUser.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertaForm.classList.add('hidden');

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const cargo = document.getElementById('cargo').value;
    const cpf = document.getElementById('cpf').value.trim();

    if (senha.length < 6) {
      alertaForm.textContent = 'A senha deve ter no mínimo 6 caracteres.';
      alertaForm.classList.remove('hidden');
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Cadastrando...';

    try {
      const payload = { nome, email, senha, cargo };
      if (cpf) payload.cpf = cpf;

      const resposta = await api('/users', {
        method: 'POST',
        body: payload
      });

      toast(resposta.mensagem || 'Usuário cadastrado com sucesso!', 'sucesso');
      formUser.reset();
      await carregarUsuarios(); // Atualiza a tabela
    } catch (error) {
      alertaForm.textContent = error.message || 'Erro ao cadastrar usuário.';
      alertaForm.classList.remove('hidden');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Cadastrar Usuário';
    }
  });

  // Inicializa a tela
  carregarUsuarios();
});