import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import {
  initShell,
  badgeStatus,
  formatarData,
  formatarDataCurta,
  escapeHtml,
  emptyState,
  showSkeleton,
  toast,
} from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('fones', usuario);
}

const tituloEl = document.getElementById('cabeçalho-fone');
const conteudoEl = document.getElementById('conteudo-abas');
const idFone = new URLSearchParams(window.location.search).get('id');

let historico = null;
let abaAtiva = 'inspecoes';

document.getElementById('btn-voltar').addEventListener('click', () => {
  window.location.href = 'fones.html';
});

function renderizarCabecalho(h) {
  const fone = h.fone;
  tituloEl.innerHTML = `
    <div class="card">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-item__label">Nº de série</div>
          <div class="info-item__valor">${escapeHtml(fone.numero_serie || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">Modelo</div>
          <div class="info-item__valor">${escapeHtml(fone.modelo || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">Marca</div>
          <div class="info-item__valor">${escapeHtml(fone.marca || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">Conexão</div>
          <div class="info-item__valor">${escapeHtml(fone.tipo_conexao || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">Fabricação</div>
          <div class="info-item__valor">${formatarDataCurta(fone.data_fabricacao)}</div>
        </div>
        <div class="info-item">
          <div class="info-item__label">Situação atual</div>
          <div class="info-item__valor">${badgeStatus(fone.status)}</div>
        </div>
      </div>
      <p class="muted mt-4">
        Total de inspeções registradas: <strong>${h.total_inspecoes}</strong>
      </p>
    </div>
  `;
}

function renderizarInspecoes(lista) {
  if (!lista.length) {
    emptyState(conteudoEl, 'Nenhuma inspeção', 'Este fone ainda não passou por inspeção de qualidade.');
    return;
  }

  conteudoEl.innerHTML = `
    <div class="timeline">
      ${lista
        .map(
          (inspecao) => `
          <div class="timeline__item ${
            String(inspecao.resultado_final).toLowerCase().includes('aprovado')
              ? 'timeline__item--sucesso'
              : 'timeline__item--erro'
          }">
            <div class="timeline__data">${formatarData(inspecao.data_inspecao)}</div>
            <div class="timeline__titulo">${badgeStatus(inspecao.resultado_final)}</div>
            <div class="timeline__desc">
              Observação: ${escapeHtml(inspecao.observacao || '(sem observação)')}
            </div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
}

function renderizarTestes(lista) {
  if (!lista.length) {
    emptyState(conteudoEl, 'Nenhum teste', 'Nenhum teste técnico foi registrado para este fone.');
    return;
  }

  conteudoEl.innerHTML = `
    <div class="tabela-wrapper">
      <table class="tabela">
        <thead>
          <tr>
            <th>Teste</th>
            <th>Parâmetro</th>
            <th>Resultado</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          ${lista
            .map(
              (teste) => `
              <tr>
                <td><strong>${escapeHtml(teste.tipo_teste || '—')}</strong></td>
                <td>${escapeHtml(teste.parametro_medido || '—')}</td>
                <td>${badgeResultado(teste.resultado)}</td>
                <td>${escapeHtml(teste.observacao || '—')}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderizarManutencoes(lista) {
  if (!lista.length) {
    emptyState(conteudoEl, 'Nenhuma manutenção', 'Este fone não passou por manutenção.');
    return;
  }

  conteudoEl.innerHTML = `
    <div class="timeline">
      ${lista
        .map(
          (manutencao) => `
          <div class="timeline__item ${
            String(manutencao.status).toLowerCase().includes('conclui')
              ? 'timeline__item--sucesso'
              : ''
          }">
            <div class="timeline__data">Entrada: ${formatarData(manutencao.data_entrada)}</div>
            <div class="timeline__titulo">
              ${badgeStatus(manutencao.status)}
              ${manutencao.data_conclusao ? `<span class="muted"> · Concluída em ${formatarData(manutencao.data_conclusao)}</span>` : ''}
            </div>
            <div class="timeline__desc">
              Defeito: ${escapeHtml(manutencao.descricao_defeito || '(não informado)')}
            </div>
            ${
              manutencao.acao_corretiva
                ? `<div class="timeline__desc">Ação corretiva: ${escapeHtml(manutencao.acao_corretiva)}</div>`
                : ''
            }
          </div>
        `
        )
        .join('')}
    </div>
  `;
}

function badgeResultado(resultado) {
  const lower = String(resultado || '').toLowerCase();
  const tipo = lower.includes('pass') || lower.includes('ok') || lower.includes('dentro')
    ? 'sucesso'
    : lower.includes('fail') || lower.includes('não') || lower.includes('fora')
      ? 'erro'
      : 'info';
  return `<span class="badge badge--${tipo}">${escapeHtml(resultado || '—')}</span>`;
}

function renderizarAba() {
  if (!historico) return;

  if (abaAtiva === 'inspecoes') renderizarInspecoes(historico.inspecoes || []);
  if (abaAtiva === 'testes') renderizarTestes(historico.testes || []);
  if (abaAtiva === 'manutencoes') renderizarManutencoes(historico.manutencoes || []);
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-aba]');
  if (!tab) return;
  abaAtiva = tab.dataset.aba;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('tab--ativa', t === tab));
  renderizarAba();
});

async function carregar() {
  if (!idFone) {
    tituloEl.innerHTML = '';
    conteudoEl.innerHTML = '';
    toast('Fone não informado.', 'erro');
    return;
  }

  tituloEl.innerHTML = '<div class="skeleton skeleton--bloco"></div>';
  showSkeleton(conteudoEl, 3);

  try {
    historico = await api(`/fones/${idFone}/historico`);
    renderizarCabecalho(historico);
    renderizarAba();
  } catch (erro) {
    tituloEl.innerHTML = '';
    conteudoEl.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();