import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, emptyState, toast, confirmarAcao } from '../ui.js?v=2';

const usuario = guardPagina(['Admin', 'Gerente', 'Técnico']);
if (usuario) {
  initShell('manutencao', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');
const modal = document.getElementById('modal-atualizar');
const form = document.getElementById('form-manutencao');
const alerta = document.getElementById('alerta-manutencao');

let manutencaoAtual = null;
let filaCache = [];

const podeExcluir = usuario && isAdminGerente(usuario.cargo);

function exibirAlerta(mensagem) {
  alerta.textContent = mensagem;
  alerta.classList.remove('hidden');
}

function esconderAlerta() {
  alerta.classList.add('hidden');
  alerta.textContent = '';
}

function abrirModal(manutencao) {
  manutencaoAtual = manutencao;
  const statusAtual = manutencao.status || 'Em Manutencao';
  document.getElementById('manutencao-defeito').value = manutencao.descricao_defeito || '';
  document.getElementById('manutencao-status').value = statusAtual;
  document.getElementById('acao_corretiva').value = manutencao.acao_corretiva || '';
  esconderAlerta();
  modal.classList.add('modal-overlay--aberta');
}

function fecharModal() {
  modal.classList.remove('modal-overlay--aberta');
  manutencaoAtual = null;
}

function renderizar(lista) {
  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <h3>Fila vazia</h3>
            <p>Nenhum fone aguardando manutenção no momento.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = lista
    .map((m) => `
      <tr>
        <td><strong>${escapeHtml(m.numero_serie || '—')}</strong></td>
        <td>${escapeHtml(m.modelo || '—')}</td>
        <td>${escapeHtml(m.descricao_defeito || '—')}</td>
        <td>${formatarData(m.data_entrada)}</td>
        <td>${badgeStatus(m.status)}</td>
        <td>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button class="btn btn--secundario btn--pequeno" data-atualizar="${m.id_manutencao}">
              Atualizar
            </button>
            ${podeExcluir ? `
              <button class="btn btn--danger btn--pequeno" data-excluir-manutencao="${m.id_manutencao}">
                Excluir
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `)
    .join('');
}

corpoTabela.addEventListener('click', async (e) => {
  const btnAtualizar = e.target.closest('[data-atualizar]');
  if (btnAtualizar) {
    const manutencao = filaCache.find((m) => String(m.id_manutencao) === btnAtualizar.dataset.atualizar);
    if (manutencao) abrirModal(manutencao);
    return;
  }

  const btnExcluir = e.target.closest('[data-excluir-manutencao]');
  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirManutencao;

    const confirmou = await confirmarAcao({
      titulo: 'Excluir Ordem de Manutenção',
      mensagem: `Deseja realmente excluir a ordem de manutenção #${id}?`,
      textoBotao: 'Excluir definitivamente',
      perigoso: true,
    });

    if (confirmou) {
      try {
        await api(`/manutencao/${id}`, { method: 'DELETE' });
        toast('Ordem de manutenção excluída com sucesso!', 'sucesso');
        await carregar();
      } catch (erro) {
        toast(erro.message, 'erro');
      }
    }
  }
});

document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) fecharModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderAlerta();

  if (!manutencaoAtual) return;

  const descricao_defeito = document.getElementById('manutencao-defeito').value.trim();
  const status = document.getElementById('manutencao-status').value;
  const acao_corretiva = document.getElementById('acao_corretiva').value.trim();

  if (!descricao_defeito) {
    exibirAlerta('A descrição do defeito é obrigatória.');
    return;
  }

  const btnSalvar = document.getElementById('btn-salvar-manutencao');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    await api(`/manutencao/${manutencaoAtual.id_manutencao}`, {
      method: 'PUT',
      body: { status, acao_corretiva, descricao_defeito },
    });

    toast('Manutenção atualizada com sucesso!', 'sucesso');
    fecharModal();
    await carregar();
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
});

// Elementos do Modal Nova Manutenção
const modalNova = document.getElementById('modal-nova-manutencao');
const formNova = document.getElementById('form-nova-manutencao');
const btnNovaManutencao = document.getElementById('btn-nova-manutencao');
const btnFecharModalNova = document.getElementById('btn-fechar-modal-nova');
const btnCancelarModalNova = document.getElementById('btn-cancelar-modal-nova');
const alertaNova = document.getElementById('alerta-nova-manutencao');
const selectNovoFone = document.getElementById('novo-id_fone');

async function abrirModalNova() {
  if (alertaNova) {
    alertaNova.classList.add('hidden');
    alertaNova.textContent = '';
  }
  if (formNova) formNova.reset();

  if (selectNovoFone) {
    selectNovoFone.innerHTML = '<option value="">Carregando fones...</option>';
    try {
      const fones = await api('/fones');
      selectNovoFone.innerHTML = `
        <option value="">Selecione um fone...</option>
        ${fones.map(f => `<option value="${f.id_fone}">${escapeHtml(f.modelo)} (${escapeHtml(f.numero_serie)}) — ${escapeHtml(f.status)}</option>`).join('')}
      `;
    } catch (e) {
      selectNovoFone.innerHTML = '<option value="">Erro ao carregar fones</option>';
    }
  }

  if (modalNova) modalNova.classList.add('modal-overlay--aberta');
}

function fecharModalNova() {
  if (modalNova) modalNova.classList.remove('modal-overlay--aberta');
}

if (btnNovaManutencao) btnNovaManutencao.addEventListener('click', abrirModalNova);
if (btnFecharModalNova) btnFecharModalNova.addEventListener('click', fecharModalNova);
if (btnCancelarModalNova) btnCancelarModalNova.addEventListener('click', fecharModalNova);
if (modalNova) {
  modalNova.addEventListener('click', (e) => {
    if (e.target === modalNova) fecharModalNova();
  });
}

if (formNova) {
  formNova.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertaNova) alertaNova.classList.add('hidden');

    const id_fone = selectNovoFone.value;
    const descricao_defeito = document.getElementById('novo-descricao_defeito').value.trim();

    if (!id_fone || !descricao_defeito) {
      if (alertaNova) {
        alertaNova.textContent = 'Selecione o fone e descreva o defeito.';
        alertaNova.classList.remove('hidden');
      }
      return;
    }

    const btnSalvar = document.getElementById('btn-salvar-nova-manutencao');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Abrindo...';

    try {
      await api('/manutencao', {
        method: 'POST',
        body: { id_fone, descricao_defeito }
      });

      toast('Ordem de manutenção aberta com sucesso!', 'sucesso');
      fecharModalNova();
      await carregar();
    } catch (erro) {
      if (alertaNova) {
        alertaNova.textContent = erro.message;
        alertaNova.classList.remove('hidden');
      } else {
        toast(erro.message, 'erro');
      }
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Abrir Ordem';
    }
  });
}

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
    filaCache = await api('/manutencao/fila');
    renderizar(filaCache);
  } catch (erro) {
    corpoTabela.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

if (usuario) {
  carregar();
}