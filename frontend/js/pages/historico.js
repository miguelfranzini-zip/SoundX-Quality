import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, toast } from '../ui.js?v=3';
import { createChart, barra, PALETTE } from '../charts.js';

const usuario = guardPagina(['Admin', 'Gerente']);
if (usuario) {
  initShell('historico', usuario);
}

const tabs = document.querySelectorAll('.tab');
const painelFiltroInsp = document.getElementById('painel-filtro-inspecoes');
const painelFiltroMan = document.getElementById('painel-filtro-manutencoes');
const cabecalhoTabela = document.getElementById('cabecalho-tabela');
const corpoTabela = document.getElementById('corpo-tabela');
const containerTabela = document.getElementById('container-tabela');
const containerLotes = document.getElementById('container-lotes');
const gradeCardsLote = document.getElementById('grade-cards-lote');
const barraPaginacao = document.getElementById('barra-paginacao');
const infoPaginacao = document.getElementById('info-paginacao');
const lblPaginaAtual = document.getElementById('lbl-pagina-atual');
const btnPagAnterior = document.getElementById('btn-pag-anterior');
const btnPagProxima = document.getElementById('btn-pag-proxima');
const btnExportarCsv = document.getElementById('btn-exportar-csv');

let abaAtiva = 'inspecoes';
let paginaAtual = 1;
const limitePorPagina = 15;
let totalRegistros = 0;
let dadosCache = [];

function badgePrioridade(p) {
  const norm = String(p || 'Media').toLowerCase();
  if (norm.includes('crit')) return '<span class="badge badge--perigo" style="font-size:0.75rem;">🔴 Crítica</span>';
  if (norm.includes('alt')) return '<span class="badge badge--alerta" style="font-size:0.75rem;">🟠 Alta</span>';
  if (norm.includes('baix')) return '<span class="badge badge--sucesso" style="font-size:0.75rem;">🟢 Baixa</span>';
  return '<span class="badge badge--neutro" style="font-size:0.75rem;">🟡 Média</span>';
}

function linkFotoSeguro(url) {
  if (!url) return '';
  const u = String(url).trim();
  if (u.startsWith('http://') || u.startsWith('https://')) {
    return `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" class="btn btn--pequeno btn--ghost" style="padding: 2px 6px; font-size: 0.75rem; margin-top: 3px;" title="Ver evidência fotográfica">📷 Foto</a>`;
  }
  return '';
}

async function carregarInspecoes() {
  const de = document.getElementById('insp-filtro-de')?.value;
  const ate = document.getElementById('insp-filtro-ate')?.value;
  const resultado = document.getElementById('insp-filtro-resultado')?.value;
  const texto = (document.getElementById('insp-filtro-texto')?.value || '').trim();

  const params = new URLSearchParams({
    pagina: String(paginaAtual),
    limite: String(limitePorPagina)
  });
  if (de) params.append('de', de);
  if (ate) params.append('ate', ate);
  if (resultado) params.append('resultado', resultado);
  if (texto) params.append('q', texto);

  try {
    const res = await api(`/inspecoes?${params.toString()}`);
    let lista = Array.isArray(res) ? res : (res.dados || []);
    totalRegistros = Array.isArray(res) ? res.length : (res.total ?? lista.length);

    dadosCache = lista;
    renderizarInspecoes(lista);
  } catch (err) {
    toast(err.message || 'Erro ao carregar histórico de inspeções.', 'erro');
  }
}

function renderizarInspecoes(lista) {
  cabecalhoTabela.innerHTML = `
    <tr>
      <th>Data da Inspeção</th>
      <th>Nº Série</th>
      <th>Modelo</th>
      <th>Inspetor Responsável</th>
      <th>Resultado</th>
      <th>Observações & Evidências</th>
      <th>Ações</th>
    </tr>
  `;

  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <h3>Nenhum registro encontrado</h3>
            <p>Nenhuma inspeção atende aos filtros selecionados.</p>
          </div>
        </td>
      </tr>
    `;
    atualizarPaginacao(0);
    return;
  }

  corpoTabela.innerHTML = lista.map((i) => `
    <tr>
      <td style="font-size: 0.85rem;">${formatarData(i.data_inspecao)}</td>
      <td><strong>${escapeHtml(i.fone_serie || '—')}</strong></td>
      <td>${escapeHtml(i.fone_modelo || '—')}</td>
      <td>${escapeHtml(i.inspetor || '—')}</td>
      <td>${badgeStatus(i.resultado_final)}</td>
      <td>
        <div style="max-width: 280px; line-height: 1.35; font-size: 0.85rem;">
          ${escapeHtml(i.observacao || '—')}
        </div>
        ${linkFotoSeguro(i.foto_url)}
      </td>
      <td>
        <a href="fone-historico.html?id=${i.id_fone}" class="btn btn--pequeno btn--ghost" title="Ver laudo completo do fone">
          Laudo do Fone
        </a>
      </td>
    </tr>
  `).join('');

  atualizarPaginacao(totalRegistros);
}

async function carregarManutencoes() {
  const de = document.getElementById('man-filtro-de')?.value;
  const ate = document.getElementById('man-filtro-ate')?.value;
  const status = document.getElementById('man-filtro-status')?.value;
  const prioridade = document.getElementById('man-filtro-prioridade')?.value;
  const texto = (document.getElementById('man-filtro-texto')?.value || '').trim();

  const params = new URLSearchParams({
    pagina: String(paginaAtual),
    limite: String(limitePorPagina)
  });
  if (de) params.append('de', de);
  if (ate) params.append('ate', ate);
  if (status) params.append('status', status);
  if (prioridade) params.append('prioridade', prioridade);

  try {
    const res = await api(`/manutencao?${params.toString()}`);
    let lista = Array.isArray(res) ? res : (res.dados || []);
    totalRegistros = Array.isArray(res) ? res.length : (res.total || lista.length);

    if (texto) {
      const t = texto.toLowerCase();
      lista = lista.filter((m) =>
        String(m.numero_serie || '').toLowerCase().includes(t) ||
        String(m.modelo || '').toLowerCase().includes(t) ||
        String(m.descricao_defeito || '').toLowerCase().includes(t) ||
        String(m.acao_corretiva || '').toLowerCase().includes(t)
      );
    }

    dadosCache = lista;
    renderizarManutencoes(lista);
  } catch (err) {
    toast(err.message || 'Erro ao carregar histórico de manutenções.', 'erro');
  }
}

function renderizarManutencoes(lista) {
  cabecalhoTabela.innerHTML = `
    <tr>
      <th>Entrada</th>
      <th>Nº Série / Fone</th>
      <th>Modelo</th>
      <th>Defeito Diagnosticado</th>
      <th>Ação Corretiva</th>
      <th>Prioridade</th>
      <th>Responsáveis</th>
      <th>Status</th>
      <th>Ações</th>
    </tr>
  `;

  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <h3>Nenhuma ordem encontrada</h3>
            <p>Nenhuma manutenção corresponde aos critérios informados.</p>
          </div>
        </td>
      </tr>
    `;
    atualizarPaginacao(0);
    return;
  }

  corpoTabela.innerHTML = lista.map((m) => {
    const sol = m.solicitado_por_nome && m.solicitado_por_nome !== '—' ? `Sol: ${escapeHtml(m.solicitado_por_nome)}` : '';
    const tec = m.concluido_por_nome && m.concluido_por_nome !== '—' ? `Téc: ${escapeHtml(m.concluido_por_nome)}` : '';
    const resp = [sol, tec].filter(Boolean).join('<br>') || '—';

    return `
      <tr>
        <td style="font-size: 0.85rem;">
          ${formatarData(m.data_entrada)}
          ${m.data_conclusao ? `<div style="font-size:0.74rem; color:var(--sucesso);">Fim: ${formatarData(m.data_conclusao)}</div>` : ''}
        </td>
        <td>
          <strong>${escapeHtml(m.numero_serie || '—')}</strong>
          <div style="font-size: 0.74rem; color: var(--text-suave);">#${m.id_manutencao}</div>
        </td>
        <td>${escapeHtml(m.modelo || '—')}</td>
        <td>
          <div style="max-width: 220px; font-size: 0.85rem; line-height: 1.35;">
            ${escapeHtml(m.descricao_defeito || '—')}
          </div>
        </td>
        <td>
          <div style="max-width: 220px; font-size: 0.85rem; color: var(--sucesso); line-height: 1.35;">
            ${escapeHtml(m.acao_corretiva || 'Pendente de reparo')}
          </div>
        </td>
        <td>${badgePrioridade(m.prioridade)}</td>
        <td style="font-size: 0.80rem;">${resp}</td>
        <td>${badgeStatus(m.status)}</td>
        <td>
          <a href="fone-historico.html?id=${m.id_fone}" class="btn btn--pequeno btn--ghost" title="Ver histórico completo do fone">
            Histórico
          </a>
        </td>
      </tr>
    `;
  }).join('');

  atualizarPaginacao(totalRegistros);
}

async function carregarLotes() {
  try {
    const [fones, inspecoes] = await Promise.all([
      api('/fones'),
      api('/inspecoes')
    ]);

    const listaFones = fones || [];
    const listaInspecoes = Array.isArray(inspecoes) ? inspecoes : (inspecoes.dados || []);

    // Agrupa por lote
    const mapaLotes = {};
    listaFones.forEach((f) => {
      const lote = f.lote || 'Sem Lote';
      if (!mapaLotes[lote]) {
        mapaLotes[lote] = { lote, fones: [], total: 0, aprovados: 0, reprovados: 0, aguardando: 0 };
      }
      mapaLotes[lote].fones.push(f);
      mapaLotes[lote].total++;
      const s = String(f.status || '').toLowerCase();
      if (s.includes('aprovado')) mapaLotes[lote].aprovados++;
      else if (s.includes('reprovado') || s.includes('manuten')) mapaLotes[lote].reprovados++;
      else mapaLotes[lote].aguardando++;
    });

    const lotes = Object.values(mapaLotes);

    // Cards por lote
    gradeCardsLote.innerHTML = lotes.map((l) => {
      const taxa = l.total > 0 ? ((l.aprovados / l.total) * 100).toFixed(1) : 0;
      return `
        <div class="lote-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <strong style="font-size: 1.1rem; color: var(--marrom);">${escapeHtml(l.lote)}</strong>
            <span class="badge badge--info">${l.total} unidades</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-suave); margin-bottom: var(--space-3);">
            Taxa de Conformidade: <strong style="color: var(--marrom);">${taxa}%</strong>
          </div>
          <div class="distribuicao-barra" style="margin-bottom: var(--space-3);">
            <div class="distribuicao-barra__aprovados" style="width: ${taxa}%;"></div>
            <div class="distribuicao-barra__reprovados" style="width: ${100 - taxa}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
            <span>🟢 Aprovados: <strong>${l.aprovados}</strong></span>
            <span>🔴 Falhas: <strong>${l.reprovados}</strong></span>
            <span>🟡 Fila: <strong>${l.aguardando}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    // Gráfico de barras comparativo de lotes
    const rotulos = lotes.map((l) => l.lote);
    const taxas = lotes.map((l) => l.total > 0 ? Number(((l.aprovados / l.total) * 100).toFixed(1)) : 0);

    createChart('chart-lotes-comparativo', 'bar', {
      labels: rotulos,
      datasets: [barra('Taxa de Aprovação (%)', taxas, { cor: PALETTE.laranja })]
    }, {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } },
        x: { grid: { display: false } }
      }
    });

    if (infoPaginacao) {
      infoPaginacao.textContent = `Total de ${lotes.length} lotes fabris monitorados.`;
    }
  } catch (err) {
    toast(err.message || 'Erro ao carregar análise de lotes.', 'erro');
  }
}

function atualizarPaginacao(total) {
  const totalPags = Math.ceil(total / limitePorPagina) || 1;
  if (infoPaginacao) {
    infoPaginacao.textContent = `Página ${paginaAtual} de ${totalPags} (${total} registros)`;
  }
  if (lblPaginaAtual) lblPaginaAtual.textContent = String(paginaAtual);
  if (btnPagAnterior) btnPagAnterior.disabled = paginaAtual <= 1;
  if (btnPagProxima) btnPagProxima.disabled = paginaAtual >= totalPags;
}

function mudarAba(novaAba) {
  abaAtiva = novaAba;
  paginaAtual = 1;

  tabs.forEach((t) => {
    const ativa = t.dataset.aba === novaAba;
    t.classList.toggle('tab--ativa', ativa);
    t.setAttribute('aria-selected', String(ativa));
  });

  if (novaAba === 'inspecoes') {
    painelFiltroInsp.classList.remove('hidden');
    painelFiltroMan.classList.add('hidden');
    containerTabela.classList.remove('hidden');
    containerLotes.classList.add('hidden');
    barraPaginacao.classList.remove('hidden');
    carregarInspecoes();
  } else if (novaAba === 'manutencoes') {
    painelFiltroInsp.classList.add('hidden');
    painelFiltroMan.classList.remove('hidden');
    containerTabela.classList.remove('hidden');
    containerLotes.classList.add('hidden');
    barraPaginacao.classList.remove('hidden');
    carregarManutencoes();
  } else if (novaAba === 'lotes') {
    painelFiltroInsp.classList.add('hidden');
    painelFiltroMan.classList.add('hidden');
    containerTabela.classList.add('hidden');
    containerLotes.classList.remove('hidden');
    barraPaginacao.classList.add('hidden');
    carregarLotes();
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => mudarAba(tab.dataset.aba));
});

document.getElementById('btn-aplicar-filtro-insp')?.addEventListener('click', () => {
  paginaAtual = 1;
  carregarInspecoes();
});
document.getElementById('btn-limpar-filtro-insp')?.addEventListener('click', () => {
  document.getElementById('insp-filtro-de').value = '';
  document.getElementById('insp-filtro-ate').value = '';
  document.getElementById('insp-filtro-resultado').value = '';
  document.getElementById('insp-filtro-texto').value = '';
  paginaAtual = 1;
  carregarInspecoes();
});

document.getElementById('btn-aplicar-filtro-man')?.addEventListener('click', () => {
  paginaAtual = 1;
  carregarManutencoes();
});
document.getElementById('btn-limpar-filtro-man')?.addEventListener('click', () => {
  document.getElementById('man-filtro-de').value = '';
  document.getElementById('man-filtro-ate').value = '';
  document.getElementById('man-filtro-status').value = '';
  document.getElementById('man-filtro-prioridade').value = '';
  document.getElementById('man-filtro-texto').value = '';
  paginaAtual = 1;
  carregarManutencoes();
});

btnPagAnterior?.addEventListener('click', () => {
  if (paginaAtual > 1) {
    paginaAtual--;
    if (abaAtiva === 'inspecoes') carregarInspecoes();
    else if (abaAtiva === 'manutencoes') carregarManutencoes();
  }
});

btnPagProxima?.addEventListener('click', () => {
  const totalPags = Math.ceil(totalRegistros / limitePorPagina);
  if (paginaAtual < totalPags) {
    paginaAtual++;
    if (abaAtiva === 'inspecoes') carregarInspecoes();
    else if (abaAtiva === 'manutencoes') carregarManutencoes();
  }
});

btnExportarCsv?.addEventListener('click', () => {
  if (!dadosCache.length) {
    toast('Nenhum registro para exportar com os filtros atuais.', 'aviso');
    return;
  }

  let csvLinhas = [];
  if (abaAtiva === 'inspecoes') {
    csvLinhas.push('ID;Data;Modelo;Nº Série;Inspetor;Resultado;Observação;Foto URL');
    dadosCache.forEach((i) => {
      csvLinhas.push([
        i.id_inspecao,
        i.data_inspecao || '',
        `"${(i.fone_modelo || '').replace(/"/g, '""')}"`,
        `"${(i.fone_serie || '').replace(/"/g, '""')}"`,
        `"${(i.inspetor || '').replace(/"/g, '""')}"`,
        `"${(i.resultado_final || '').replace(/"/g, '""')}"`,
        `"${(i.observacao || '').replace(/"/g, '""')}"`,
        `"${(i.foto_url || '').replace(/"/g, '""')}"`
      ].join(';'));
    });
  } else if (abaAtiva === 'manutencoes') {
    csvLinhas.push('ID;Entrada;Conclusão;Modelo;Nº Série;Defeito;Ação Corretiva;Prioridade;Status');
    dadosCache.forEach((m) => {
      csvLinhas.push([
        m.id_manutencao,
        m.data_entrada || '',
        m.data_conclusao || '',
        `"${(m.modelo || '').replace(/"/g, '""')}"`,
        `"${(m.numero_serie || '').replace(/"/g, '""')}"`,
        `"${(m.descricao_defeito || '').replace(/"/g, '""')}"`,
        `"${(m.acao_corretiva || '').replace(/"/g, '""')}"`,
        `"${(m.prioridade || '').replace(/"/g, '""')}"`,
        `"${(m.status || '').replace(/"/g, '""')}"`
      ].join(';'));
    });
  }

  const blob = new Blob(['\uFEFF' + csvLinhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const dataFormatada = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `soundx_historico_${abaAtiva}_${dataFormatada}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Histórico exportado com sucesso!', 'sucesso');
});

// Inicialização
mudarAba('inspecoes');
