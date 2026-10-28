import { api } from '../api.js';
import { toast, initShell, emptyState, escapeHtml, confirmarAcao } from '../ui.js?v=3';
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
  const tabsContainer = document.getElementById('tabs-usuarios');

  let abaAtiva = 'ativos';

  btnVoltar.addEventListener('click', () => {
    window.history.back();
  });

  function dataBR(valor) {
    if (!valor) return '—';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor);
    return d.toLocaleDateString('pt-BR');
  }

  // Carrega lista de usuários conforme a aba (ativos ou excluídos)
  async function carregarUsuarios() {
    try {
      const query = abaAtiva === 'excluidos' ? '/users?excluidos=1' : '/users';
      const usuarios = await api(query);

      if (usuarios.length === 0) {
        emptyState(
          tabelaWrapper,
          abaAtiva === 'excluidos' ? 'Nenhum usuário excluído' : 'Nenhum usuário',
          abaAtiva === 'excluidos'
            ? 'Nenhum usuário foi excluído ainda. Excluídos aparecem aqui com o histórico preservado.'
            : 'Nenhum usuário foi cadastrado ainda.'
        );
        return;
      }

      let tbodyHtml = '';
      usuarios.forEach((u) => {
        const isSelf = Number(u.id_funcionario) === Number(usuario.id);
        const excluido = abaAtiva === 'excluidos';

        const colunaAcoes = excluido
          ? `<button
                type="button"
                class="btn btn--pequeno btn--secundario btn-restaurar-user"
                data-id="${u.id_funcionario}"
                data-nome="${escapeHtml(u.nome)}"
                title="Restaurar este usuário (reativar acesso)"
             >Restaurar</button>`
          : `<button
                type="button"
                class="btn btn--pequeno btn--ghost btn-deletar-user"
                data-id="${u.id_funcionario}"
                data-nome="${escapeHtml(u.nome)}"
                ${isSelf ? 'disabled title="Você não pode excluir a sua própria conta."' : 'style="color:var(--erro);font-weight:700;" title="Excluir este usuário (acesso revogado, histórico preservado)"'}
             >Excluir</button>`;

        tbodyHtml += `
          <tr>
            <td>
              <strong>${escapeHtml(u.nome)}</strong>
              ${isSelf ? '<span class="badge" style="font-size:0.7rem;margin-left:6px;background:rgba(255,152,0,0.15);color:var(--laranja-escuro);">Você</span>' : ''}
            </td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.cargo)}</td>
            <td style="color:var(--text-secundario)">${escapeHtml(u.cpf || '—')}</td>
            <td>${excluido ? dataBR(u.excluido_em) : '—'}</td>
            <td style="text-align: right;">${colunaAcoes}</td>
          </tr>
        `;
      });

      tabelaWrapper.innerHTML = `
        <div class="tabela-wrapper">
          <table class="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo / Perfil</th>
                <th>CPF</th>
                <th>Excluído em</th>
                <th style="text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody>${tbodyHtml}</tbody>
          </table>
        </div>
      `;

      // Ações de exclusão (soft delete)
      tabelaWrapper.querySelectorAll('.btn-deletar-user').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (btn.disabled) return;
          const id = btn.getAttribute('data-id');
          const nome = btn.getAttribute('data-nome');

          const confirmou = await confirmarAcao({
            titulo: 'Excluir Usuário',
            mensagem: `Tem certeza de que deseja excluir o usuário "${nome}"? O acesso desta pessoa ao sistema será revogado imediatamente, mas o histórico de ações (inspeções e manutenções) será preservado.`,
            textoBotao: 'Excluir Usuário',
            perigoso: true
          });

          if (confirmou) {
            try {
              const res = await api(`/users/${id}`, { method: 'DELETE' });
              toast(res.mensagem || 'Usuário excluído com sucesso! Histórico preservado.', 'sucesso');
              await carregarUsuarios();
            } catch (err) {
              toast(err.message || 'Erro ao excluir usuário.', 'erro');
            }
          }
        });
      });

      // Ações de restauração (reativação)
      tabelaWrapper.querySelectorAll('.btn-restaurar-user').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const nome = btn.getAttribute('data-nome');

          const confirmou = await confirmarAcao({
            titulo: 'Restaurar Usuário',
            mensagem: `Deseja restaurar o usuário "${nome}"? O acesso ao sistema será reativado.`,
            textoBotao: 'Restaurar',
            perigoso: false
          });

          if (confirmou) {
            try {
              const res = await api(`/users/${id}/restaurar`, { method: 'POST' });
              toast(res.mensagem || 'Usuário restaurado com sucesso!', 'sucesso');
              await carregarUsuarios();
            } catch (err) {
              toast(err.message || 'Erro ao restaurar usuário.', 'erro');
            }
          }
        });
      });
    } catch (error) {
      tabelaWrapper.innerHTML = `<p class="muted" style="color:var(--erro)">Erro ao carregar usuários: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Troca de abas (ativos / excluídos)
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const aba = e.target.closest('[data-aba]');
      if (!aba) return;
      abaAtiva = aba.dataset.aba;
      tabsContainer.querySelectorAll('.tab').forEach((t) => t.classList.toggle('tab--ativa', t === aba));
      carregarUsuarios();
    });
  }

  // Submissão do formulário de cadastro
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
