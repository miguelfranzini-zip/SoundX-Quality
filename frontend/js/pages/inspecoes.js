import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, toast, confirmarAcao } from '../ui.js?v=2';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('inspecoes', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');

// Elementos do Modal de Edição de Inspeção
const modalEditarInspecao = document.getElementById('modal-editar-inspecao');
const formEditarInspecao = document.getElementById('form-editar-inspecao');
const btnFecharModalInspecao = document.getElementById('btn-fechar-modal-inspecao');
const btnCancelarModalInspecao = document.getElementById('btn-cancelar-modal-inspecao');
const alertaModalInspecao = document.getElementById('alerta-modal-inspecao');

let inspecoesCache = [];
let inspecaoEmEdicao = null;

const podeEditar = usuario && (isAdminGerente(usuario.cargo) || String(usuario.cargo).toLowerCase().includes('inspetor'));
const podeExcluir = usuario && isAdminGerente(usuario.cargo);

document.getElementById('btn-nova-inspecao').addEventListener('click', () => {
  window.location.href = 'inspecao-form.html';
});

function renderizar(lista) {
  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <h3>Nenhuma inspeção registrada</h3>
            <p>Crie a primeira inspeção de qualidade para começar a acompanhar os resultados.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = lista
    .map((inspecao) => {
      const linkFone = inspecao.id_fone
        ? `<button class="btn btn--ghost btn--pequeno" data-ver-historico="${inspecao.id_fone}">Histórico</button>`
        : '';
      const linkTestes = `<button class="btn btn--ghost btn--pequeno" data-ver-testes="${inspecao.id_inspecao}">Testes</button>`;

      return `
      <tr>
        <td>${formatarData(inspecao.data_inspecao)}</td>
        <td>
          <strong>${escapeHtml(inspecao.fone_modelo || '—')}</strong>
          <span class="muted"> (${escapeHtml(inspecao.fone_serie || '—')})</span>
        </td>
        <td>${escapeHtml(inspecao.inspetor || '—')}</td>
        <td>${badgeStatus(inspecao.resultado_final)}</td>
        <td>${escapeHtml(inspecao.observacao || '—')}</td>
        <td>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            ${linkFone}
            ${linkTestes}
            ${podeEditar ? `
              <button
                class="btn btn--secundario btn--pequeno"
                data-editar-inspecao="${inspecao.id_inspecao}"
                title="Editar inspeção"
              >Editar</button>
            ` : ''}
            ${podeExcluir ? `
              <button
                class="btn btn--danger btn--pequeno"
                data-excluir-inspecao="${inspecao.id_inspecao}"
                title="Excluir inspeção"
              >Excluir</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

// Modal Helpers
function abrirModalEdicao(inspecao) {
  inspecaoEmEdicao = inspecao;
  if (alertaModalInspecao) {
    alertaModalInspecao.classList.add('hidden');
    alertaModalInspecao.textContent = '';
  }

  document.getElementById('edit-inspecao-fone').value = `${inspecao.fone_modelo || 'Fone'} (${inspecao.fone_serie || '—'})`;
  document.getElementById('edit-inspecao-resultado').value = inspecao.resultado_final || 'Aprovado';
  document.getElementById('edit-inspecao-obs').value = inspecao.observacao || '';

  modalEditarInspecao.classList.add('modal-overlay--aberta');
}

function fecharModalEdicao() {
  modalEditarInspecao.classList.remove('modal-overlay--aberta');
  inspecaoEmEdicao = null;
}

if (btnFecharModalInspecao) btnFecharModalInspecao.addEventListener('click', fecharModalEdicao);
if (btnCancelarModalInspecao) btnCancelarModalInspecao.addEventListener('click', fecharModalEdicao);
if (modalEditarInspecao) {
  modalEditarInspecao.addEventListener('click', (e) => {
    if (e.target === modalEditarInspecao) fecharModalEdicao();
  });
}

if (formEditarInspecao) {
  formEditarInspecao.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertaModalInspecao) alertaModalInspecao.classList.add('hidden');

    if (!inspecaoEmEdicao) return;

    const btnSalvar = document.getElementById('btn-salvar-modal-inspecao');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const dados = {
      resultado_final: document.getElementById('edit-inspecao-resultado').value,
      observacao: document.getElementById('edit-inspecao-obs').value.trim(),
    };

    try {
      await api(`/inspecoes/${inspecaoEmEdicao.id_inspecao}`, {
        method: 'PUT',
        body: dados,
      });

      toast('Inspeção atualizada com sucesso!', 'sucesso');
      fecharModalEdicao();
      await carregar();
    } catch (erro) {
      if (alertaModalInspecao) {
        alertaModalInspecao.textContent = erro.message;
        alertaModalInspecao.classList.remove('hidden');
      } else {
        toast(erro.message, 'erro');
      }
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar alterações';
    }
  });
}

// Ações na tabela
corpoTabela.addEventListener('click', async (e) => {
  const btnHistorico = e.target.closest('[data-ver-historico]');
  if (btnHistorico) {
    window.location.href = `fone-historico.html?id=${btnHistorico.dataset.verHistorico}`;
    return;
  }

  const btnTestes = e.target.closest('[data-ver-testes]');
  if (btnTestes) {
    window.location.href = `testes.html?inspecao=${btnTestes.dataset.verTestes}`;
    return;
  }

  const btnEditar = e.target.closest('[data-editar-inspecao]');
  if (btnEditar) {
    const item = inspecoesCache.find((i) => String(i.id_inspecao) === btnEditar.dataset.editarInspecao);
    if (item) abrirModalEdicao(item);
    return;
  }

  const btnExcluir = e.target.closest('[data-excluir-inspecao]');
  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirInspecao;

    const confirmou = await confirmarAcao({
      titulo: 'Excluir Inspeção',
      mensagem: `Deseja realmente excluir a inspeção #${id}? Todos os testes associados a ela também serão excluídos e as métricas do dashboard serão recalculadas.`,
      textoBotao: 'Excluir definitivamente',
      perigoso: true,
    });

    if (confirmou) {
      try {
        await api(`/inspecoes/${id}`, { method: 'DELETE' });
        toast('Inspeção e seus testes excluídos com sucesso!', 'sucesso');
        await carregar();
      } catch (erro) {
        toast(erro.message, 'erro');
      }
    }
  }
});

async function carregar() {
  corpoTabela.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
      </td>
    </tr>
  `;

  try {
    inspecoesCache = await api('/inspecoes');
    renderizar(inspecoesCache);
  } catch (erro) {
    corpoTabela.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();