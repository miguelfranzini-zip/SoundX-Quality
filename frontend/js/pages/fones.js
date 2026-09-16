import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, badgeStatus, formatarDataCurta, escapeHtml, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('fones', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');
const buscaInput = document.getElementById('busca-fones');
const btnNovoFone = document.getElementById('btn-novo-fone');

let fones = [];

function renderizar(lista) {
  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <h3>Nenhum fone encontrado</h3>
            <p>Nenhum fone cadastrado no sistema ou ajuste o termo de busca.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = lista
    .map(
      (fone, i) => `
      <tr style="animation: fadeIn 0.35s ease ${i * 0.04}s both;">
        <td><strong>${escapeHtml(fone.numero_serie || '—')}</strong></td>
        <td>${escapeHtml(fone.modelo || '—')}</td>
        <td>${escapeHtml(fone.marca || '—')}</td>
        <td>${escapeHtml(fone.tipo_conexao || '—')}</td>
        <td>${badgeStatus(fone.status)}</td>
        <td>${formatarDataCurta(fone.data_fabricacao)}</td>
        <td>
          <button
            class="btn btn--ghost btn--pequeno"
            data-ver-historico="${fone.id_fone}"
            title="Ver histórico do fone"
          >Ver histórico</button>
        </td>
      </tr>
    `
    )
    .join('');
}

function filtrar(termo) {
  const t = termo.toLowerCase();
  const resultado = fones.filter((fone) =>
    String(fone.numero_serie || '').toLowerCase().includes(t) ||
    String(fone.modelo || '').toLowerCase().includes(t) ||
    String(fone.marca || '').toLowerCase().includes(t) ||
    String(fone.tipo_conexao || '').toLowerCase().includes(t)
  );
  renderizar(resultado);
}

corpoTabela.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ver-historico]');
  if (!btn) return;
  window.location.href = `fone-historico.html?id=${btn.dataset.verHistorico}`;
});

buscaInput.addEventListener('input', () => filtrar(buscaInput.value));

btnNovoFone.addEventListener('click', () => {
  window.location.href = 'fone-cadastro.html';
});

async function carregar() {
  corpoTabela.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
      </td>
    </tr>
  `;

  try {
    fones = await api('/fones');
    renderizar(fones);
  } catch (erro) {
    corpoTabela.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();