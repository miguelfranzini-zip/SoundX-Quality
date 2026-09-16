import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, emptyState, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Técnico']);
if (usuario) {
  initShell('manutencao', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');
const modal = document.getElementById('modal-atualizar');
const form = document.getElementById('form-manutencao');
const alerta = document.getElementById('alerta-manutencao');

let manutencaoAtual = null;

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
  const statusAtual = manutencao.status === 'Concluido' ? 'Concluido' : 'Em Manutencao';
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
          <button class="btn btn--secundario btn--pequeno" data-atualizar="${m.id_manutencao}">
            Atualizar
          </button>
        </td>
      </tr>
    `)
    .join('');
}

corpoTabela.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-atualizar]');
  if (!btn) return;
  const manutencao = filaCache.find((m) => String(m.id_manutencao) === btn.dataset.atualizar);
  if (manutencao) abrirModal(manutencao);
});

document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) fecharModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderAlerta();

  if (!manutencaoAtual) return;

  const status = document.getElementById('manutencao-status').value;
  const acao_corretiva = document.getElementById('acao_corretiva').value.trim();

  const btnSalvar = document.getElementById('btn-salvar-manutencao');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    await api(`/manutencao/${manutencaoAtual.id_manutencao}`, {
      method: 'PUT',
      body: { status, acao_corretiva },
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

let filaCache = [];

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