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
          <div class="info-item__label">Lote</div>
          <div class="info-item__valor"><span class="badge badge--info">${escapeHtml(fone.lote || '—')}</span></div>
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

const btnImprimir = document.getElementById('btn-imprimir-laudo');
if (btnImprimir) {
  btnImprimir.addEventListener('click', () => {
    if (!historico || !historico.fone) {
      toast('Carregando dados para impressão...', 'info');
      return;
    }
    const fone = historico.fone;
    const printWindow = window.open('', '_blank');
    const inspecoesHtml = (historico.inspecoes || []).map(i => `
      <tr>
        <td>${formatarData(i.data_inspecao)}</td>
        <td><strong>${escapeHtml(i.resultado_final)}</strong></td>
        <td>${escapeHtml(i.inspetor || 'Inspetor')}</td>
        <td>${escapeHtml(i.observacao || '—')}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">Nenhuma inspeção registrada.</td></tr>';

    const testesHtml = (historico.testes || []).map(t => `
      <tr>
        <td><strong>${escapeHtml(t.tipo_teste)}</strong></td>
        <td>${escapeHtml(t.parametro_medido || '—')}</td>
        <td>${escapeHtml(t.resultado)}</td>
        <td>${escapeHtml(t.observacao || '—')}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">Nenhum teste registrado.</td></tr>';

    const manutenHtml = (historico.manutencoes || []).map(m => `
      <tr>
        <td>${formatarData(m.data_entrada)}</td>
        <td>${escapeHtml(m.status)}</td>
        <td>${escapeHtml(m.descricao_defeito)}</td>
        <td>${escapeHtml(m.acao_corretiva || 'Pendente')}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">Nenhuma ordem de manutenção.</td></tr>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laudo de Qualidade — ${escapeHtml(fone.numero_serie)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 32px; color: #290E00; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF9800; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #602100; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; background: #FFF8E8; border: 1px solid #FF9800; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; background: #FFF8E8; padding: 16px; border-radius: 8px; }
          .grid div strong { display: block; font-size: 11px; text-transform: uppercase; color: #888; }
          h2 { font-size: 16px; color: #602100; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #FEEFCE; color: #602100; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">SoundX Quality — Laudo Técnico</div>
            <div>Relatório Oficial de Rastreabilidade e Inspeção</div>
          </div>
          <div class="badge">${escapeHtml(fone.status)}</div>
        </div>

        <div class="grid">
          <div><strong>Nº de Série</strong>${escapeHtml(fone.numero_serie)}</div>
          <div><strong>Modelo</strong>${escapeHtml(fone.modelo)}</div>
          <div><strong>Marca</strong>${escapeHtml(fone.marca || 'SoundX')}</div>
          <div><strong>Lote de Produção</strong>${escapeHtml(fone.lote || '—')}</div>
          <div><strong>Tipo de Conexão</strong>${escapeHtml(fone.tipo_conexao || 'Bluetooth')}</div>
          <div><strong>Data de Fabricação</strong>${formatarDataCurta(fone.data_fabricacao)}</div>
        </div>

        <h2>1. Inspeções de Qualidade</h2>
        <table>
          <thead>
            <tr><th>Data</th><th>Parecer</th><th>Inspetor</th><th>Observação</th></tr>
          </thead>
          <tbody>${inspecoesHtml}</tbody>
        </table>

        <h2>2. Parâmetros e Testes Técnicos</h2>
        <table>
          <thead>
            <tr><th>Teste</th><th>Parâmetro Medido</th><th>Resultado</th><th>Observação</th></tr>
          </thead>
          <tbody>${testesHtml}</tbody>
        </table>

        <h2>3. Histórico de Manutenção</h2>
        <table>
          <thead>
            <tr><th>Entrada</th><th>Status</th><th>Defeito</th><th>Ação Corretiva</th></tr>
          </thead>
          <tbody>${manutenHtml}</tbody>
        </table>

        <div class="footer">
          <div>Documento gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          <div>SoundX Quality Assurance System</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  });
}

carregar();