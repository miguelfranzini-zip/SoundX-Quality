import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('inspecoes', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');

document.getElementById('btn-nova-inspecao').addEventListener('click', () => {
  window.location.href = 'inspecao-form.html';
});

corpoTabela.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ver-historico]');
  if (!btn) return;
  window.location.href = `fone-historico.html?id=${btn.dataset.verHistorico}`;
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
        : '<span class="muted">—</span>';
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
        <td>${linkFone}</td>
      </tr>
    `;
    })
    .join('');
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
    const lista = await api('/inspecoes');
    renderizar(lista);
  } catch (erro) {
    corpoTabela.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();