import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, showSkeleton, toast, formatarData, escapeHtml } from '../ui.js?v=3';
import { createChart, linha, barra, rosca, PALETTE } from '../charts.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor', 'Técnico']);
if (usuario) {
  initShell('dashboard', usuario);
}

const kpisEl = document.getElementById('kpis');
const listaFazerEl = document.getElementById('lista-manutencoes-fazer');
const listaConcluidasEl = document.getElementById('lista-manutencoes-concluidas');

let dadosGerais = null;
let dadosEstatisticas = null;
let manutencoesFila = [];
let periodoSelecionado = 30;

function badgePrioridade(p) {
  const norm = String(p || 'Media').toLowerCase();
  if (norm.includes('crit')) return '<span class="badge badge--perigo" style="font-size:0.75rem;">🔴 Crítica</span>';
  if (norm.includes('alt')) return '<span class="badge badge--alerta" style="font-size:0.75rem;">🟠 Alta</span>';
  if (norm.includes('baix')) return '<span class="badge badge--sucesso" style="font-size:0.75rem;">🟢 Baixa</span>';
  return '<span class="badge badge--neutro" style="font-size:0.75rem;">🟡 Média</span>';
}

function diasEmEspera(dataEntrada) {
  if (!dataEntrada) return '—';
  const entrada = new Date(dataEntrada);
  const diffMs = Date.now() - entrada.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}

function desenharContextoPerfil() {
  const msgSaudacao = document.getElementById('msg-saudacao');
  const msgSubtitulo = document.getElementById('msg-cargo-subtitulo');
  const atalhosGrid = document.getElementById('atalhos-rapidos-contexto');

  if (!msgSaudacao || !usuario) return;

  const cargo = String(usuario.cargo || '').toLowerCase();
  const nomePrimeiro = (usuario.nome || 'Usuário').split(' ')[0];

  msgSaudacao.textContent = `Olá, ${nomePrimeiro}!`;

  let subtitulo = 'Painel executivo com visão holística do controle de qualidade e fábrica.';
  let botoes = '';

  if (cargo.includes('tecnico')) {
    subtitulo = 'Você está no modo Técnico. Acompanhe a bancada de manutenção e suas O.S. assumidas.';
    botoes = `
      <a href="manutencao.html" class="btn btn--pequeno btn--primario">Fila de Reparos</a>
    `;
  } else if (cargo.includes('inspetor')) {
    subtitulo = 'Você está no modo Inspetor. Registre testes técnicos e abra solicitações de reparo.';
    botoes = `
      <a href="inspecao-form.html" class="btn btn--pequeno btn--primario">Nova Inspeção</a>
      <a href="manutencao-solicitar.html" class="btn btn--pequeno btn--secundario">Solicitar Reparo</a>
    `;
  } else {
    subtitulo = 'Visão administrativa completa da conformidade e produtividade fabril.';
    botoes = `
      <a href="inspecoes.html" class="btn btn--pequeno btn--secundario">Inspeções</a>
      <a href="manutencao.html" class="btn btn--pequeno btn--secundario">Manutenções</a>
      <a href="fones.html" class="btn btn--pequeno btn--ghost">Catálogo Fones</a>
    `;
  }

  if (msgSubtitulo) msgSubtitulo.textContent = subtitulo;
  if (atalhosGrid) atalhosGrid.innerHTML = botoes;
}

function desenharKpis(gerais, stats) {
  const itens = [
    { classe: 'kpi--fones', valor: String(gerais.total_fones_cadastrados ?? 0), rotulo: 'Fones Cadastrados' },
    { classe: 'kpi--inspecoes', valor: String(gerais.total_inspecoes_realizadas ?? 0), rotulo: 'Inspeções Realizadas' },
    { classe: 'kpi--aprovados', valor: String(gerais.fones_aprovados ?? 0), rotulo: 'Fones Aprovados' },
    { classe: 'kpi--reprovados', valor: String(gerais.fones_reprovados ?? 0), rotulo: 'Fones Reprovados' },
    { classe: 'kpi--taxa', valor: String(gerais.fpy || gerais.taxa_aprovacao || '0%'), rotulo: 'Taxa de Aprovação (FPY)' },
    { classe: 'kpi--reprovados', valor: String(stats?.manutencoes_pendentes ?? 0), rotulo: 'Manutenções na Fila' },
    { classe: 'kpi--taxa', valor: `${stats?.mttr_medio_dias ?? 0} d`, rotulo: 'MTTR Médio (Reparo)' },
    { classe: 'kpi--inspecoes', valor: String(stats?.taxa_retrabalho ?? '0%'), rotulo: 'Taxa de Retrabalho' }
  ];

  kpisEl.innerHTML = itens
    .map((item, idx) => `
      <div class="kpi ${item.classe}" style="animation-delay: ${idx * 0.05}s">
        <div class="kpi__valor">${item.valor}</div>
        <div class="kpi__label">${item.rotulo}</div>
      </div>
    `)
    .join('');

  // Atualiza barra de First Pass Yield
  const taxaTexto = document.getElementById('taxa-texto');
  const barraProgresso = document.getElementById('barra-progresso');
  const barraAprovados = document.getElementById('barra-aprovados');
  const barraReprovados = document.getElementById('barra-reprovados');
  const lblAprovados = document.getElementById('lbl-aprovados');
  const lblReprovados = document.getElementById('lbl-reprovados');

  const taxaStr = gerais.taxa_aprovacao || '0%';
  const taxaNum = parseFloat(taxaStr.replace('%', '')) || 0;
  const aprovados = Number(gerais.fones_aprovados) || 0;
  const reprovados = Number(gerais.fones_reprovados) || 0;
  const soma = aprovados + reprovados;

  if (taxaTexto) taxaTexto.textContent = taxaStr;
  if (barraProgresso) {
    setTimeout(() => {
      barraProgresso.style.width = `${Math.min(100, Math.max(0, taxaNum))}%`;
    }, 100);
  }

  if (lblAprovados) lblAprovados.textContent = String(aprovados);
  if (lblReprovados) lblReprovados.textContent = String(reprovados);

  if (barraAprovados && barraReprovados) {
    const pctAprov = soma > 0 ? (aprovados / soma) * 100 : 50;
    const pctReprov = soma > 0 ? (reprovados / soma) * 100 : 50;
    setTimeout(() => {
      barraAprovados.style.width = `${pctAprov}%`;
      barraReprovados.style.width = `${pctReprov}%`;
    }, 150);
  }
}

function desenharGraficos(stats) {
  if (!stats) return;

  // 1. Linha: Inspeções ao longo do tempo (diário)
  const serie = stats.serie_inspecoes || [];
  const rotulosTempo = serie.map((s) => {
    const partes = String(s.data).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}` : s.data;
  });
  const valoresTempo = serie.map((s) => s.total);

  createChart('chart-inspecoes-tempo', 'line', {
    labels: rotulosTempo,
    datasets: [linha('Inspeções', valoresTempo, { cor: PALETTE.laranja, borda: true })]
  }, {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  });

  // 2. Rosca: Distribuição de status dos fones no estoque
  const dist = stats.distribuicao_status || {};
  const rotulosDist = Object.keys(dist);
  const valoresDist = Object.values(dist);
  const coresDist = rotulosDist.map((r) => {
    const l = r.toLowerCase();
    if (l.includes('aprovado')) return PALETTE.sucesso;
    if (l.includes('reprovado') || l.includes('manuten')) return PALETTE.erro;
    if (l.includes('análise') || l.includes('analise')) return PALETTE.laranja;
    return PALETTE.dourado;
  });

  createChart('chart-distribuicao-status', 'doughnut', rosca('Status', rotulosDist, valoresDist, { cores: coresDist }), {
    cutout: '62%'
  });

  // 3. Barra: Modelos mais reprovados
  const reprovModelos = stats.reprovacoes_por_modelo || [];
  const rotulosModelos = reprovModelos.map((m) => m.modelo || '—');
  const valoresModelos = reprovModelos.map((m) => m.total);

  createChart('chart-reprovacoes-modelo', 'bar', {
    labels: rotulosModelos.length ? rotulosModelos : ['Nenhum modelo reprovado'],
    datasets: [barra('Reprovações', valoresModelos.length ? valoresModelos : [0], { cor: PALETTE.erro })]
  }, {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  });

  // 4. Rosca: Tipos de teste que mais falham
  const falhas = stats.tipos_teste_falhos || [];
  const rotulosFalhas = falhas.map((f) => f.tipo);
  const valoresFalhas = falhas.map((f) => f.total);

  createChart('chart-testes-falhos', 'doughnut', rosca('Falhas no checklist', rotulosFalhas.length ? rotulosFalhas : ['Sem falhas'], valoresFalhas.length ? valoresFalhas : [1], {
    cores: [PALETTE.laranja, PALETTE.terracota, PALETTE.dourado, PALETTE.marrom2, PALETTE.erro]
  }), {
    cutout: '58%'
  });

  // 5. Barra/Rosca: Eficiência de Manutenção (Pendentes vs Concluídas)
  const pendentes = stats.manutencoes_pendentes || 0;
  const concluidas = stats.manutencoes_concluidas || 0;

  createChart('chart-manutencao-status', 'doughnut', rosca('Manutenções', ['Pendentes / Em Reparo', 'Concluídas'], [pendentes, concluidas], {
    cores: [PALETTE.laranja, PALETTE.sucesso]
  }), {
    cutout: '62%'
  });

  // 6. Barra: Concluídas por técnico
  const tecnicos = stats.concluidas_por_tecnico || [];
  const rotulosTecnicos = tecnicos.map((t) => t.nome);
  const valoresTecnicos = tecnicos.map((t) => t.total);

  createChart('chart-concluidas-tecnico', 'bar', {
    labels: rotulosTecnicos.length ? rotulosTecnicos : ['Sem registros'],
    datasets: [barra('O.S. Concluídas', valoresTecnicos.length ? valoresTecnicos : [0], { cor: PALETTE.dourado })]
  }, {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  });
}

function desenharListasAnaliticas(manutencoes) {
  // Lista 1: Fila em Aberto (status != Concluido), ordenadas por prioridade/data
  const abertas = (manutencoes || []).filter((m) => String(m.status || '').toLowerCase() !== 'concluido');
  
  if (!abertas.length) {
    listaFazerEl.innerHTML = '<li class="mini-lista-item" style="color: var(--sucesso); font-weight: 600;">✨ Nenhuma ordem de manutenção pendente! Fila zerada.</li>';
  } else {
    listaFazerEl.innerHTML = abertas.slice(0, 5).map((m) => `
      <li class="mini-lista-item">
        <div>
          <strong>${escapeHtml(m.numero_serie || '—')}</strong>
          <span class="muted" style="margin-left: 4px;">(${escapeHtml(m.modelo || '—')})</span>
          <div style="font-size: 0.78rem; color: var(--text-suave); margin-top: 2px;">
            Defeito: ${escapeHtml((m.descricao_defeito || '—').slice(0, 45))}${m.descricao_defeito?.length > 45 ? '...' : ''}
          </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
          ${badgePrioridade(m.prioridade)}
          <span style="font-size: 0.74rem; color: var(--text-suave);">Espera: ${diasEmEspera(m.data_entrada)}</span>
        </div>
      </li>
    `).join('');
  }

  // Lista 2: Concluídas Recentemente
  const concluidas = (manutencoes || [])
    .filter((m) => String(m.status || '').toLowerCase() === 'concluido')
    .sort((a, b) => new Date(b.data_conclusao || b.data_entrada || 0) - new Date(a.data_conclusao || a.data_entrada || 0));

  if (!concluidas.length) {
    listaConcluidasEl.innerHTML = '<li class="mini-lista-item" style="color: var(--text-suave);">Nenhum reparo concluído recentemente.</li>';
  } else {
    listaConcluidasEl.innerHTML = concluidas.slice(0, 5).map((m) => `
      <li class="mini-lista-item">
        <div>
          <strong>${escapeHtml(m.numero_serie || '—')}</strong>
          <span class="muted" style="margin-left: 4px;">(${escapeHtml(m.modelo || '—')})</span>
          ${m.acao_corretiva ? `
            <div style="font-size: 0.78rem; color: var(--sucesso); margin-top: 2px;">
              ✓ ${escapeHtml(m.acao_corretiva.slice(0, 45))}
            </div>
          ` : ''}
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
          <span class="badge badge--sucesso" style="font-size: 0.72rem;">Concluído</span>
          <span style="font-size: 0.74rem; color: var(--text-suave);">${formatarData(m.data_conclusao || m.data_entrada)}</span>
        </div>
      </li>
    `).join('');
  }
}

async function carregarDashboard() {
  showSkeleton(kpisEl, 8);

  try {
    const [gerais, stats, manutencoes] = await Promise.all([
      api('/inspecoes/dashboard'),
      api(`/inspecoes/dashboard/estatisticas?dias=${periodoSelecionado}`),
      api('/manutencao')
    ]);

    dadosGerais = gerais;
    dadosEstatisticas = stats;
    manutencoesFila = Array.isArray(manutencoes) ? manutencoes : (manutencoes.dados || []);

    desenharContextoPerfil();
    desenharKpis(dadosGerais, dadosEstatisticas);
    desenharGraficos(dadosEstatisticas);
    desenharListasAnaliticas(manutencoesFila);
  } catch (err) {
    kpisEl.innerHTML = '';
    toast(err.message || 'Erro ao carregar métricas analíticas.', 'erro');
  }
}

// Botões de filtro de período
const btnP30 = document.getElementById('btn-periodo-30');
const btnP7 = document.getElementById('btn-periodo-7');
const btnP90 = document.getElementById('btn-periodo-90');

async function setPeriodo(dias, btnAtivo) {
  periodoSelecionado = dias;
  [btnP30, btnP7, btnP90].forEach((b) => {
    if (b) {
      b.classList.remove('btn--primario');
      b.classList.add('btn--ghost');
    }
  });
  if (btnAtivo) {
    btnAtivo.classList.remove('btn--ghost');
    btnAtivo.classList.add('btn--primario');
  }
  try {
    const stats = await api(`/inspecoes/dashboard/estatisticas?dias=${periodoSelecionado}`);
    dadosEstatisticas = stats;
    desenharGraficos(dadosEstatisticas);
  } catch (err) {
    if (dadosEstatisticas) {
      desenharGraficos(dadosEstatisticas);
    }
  }
}

btnP30?.addEventListener('click', () => setPeriodo(30, btnP30));
btnP7?.addEventListener('click', () => setPeriodo(7, btnP7));
btnP90?.addEventListener('click', () => setPeriodo(90, btnP90));

// Exportação CSV ampla
const btnExportarRelatorio = document.getElementById('btn-exportar-relatorio');
if (btnExportarRelatorio) {
  btnExportarRelatorio.addEventListener('click', () => {
    if (!dadosGerais) {
      toast('Carregando métricas para exportação...', 'info');
      return;
    }

    const d = dadosGerais;
    const s = dadosEstatisticas || {};

    const relatorioCsv = [
      'Relatório Analítico de Controle de Qualidade — SoundX Quality',
      `Data de Emissão;${new Date().toLocaleString('pt-BR')}`,
      `Emitido por;${usuario?.nome || 'Operador'} (${usuario?.cargo || 'Geral'})`,
      '',
      '--- INDICADORES GERAIS (KPIS) ---',
      'Indicador;Valor',
      `Total de Fones Cadastrados;${d.total_fones_cadastrados ?? 0}`,
      `Total de Inspeções Realizadas;${d.total_inspecoes_realizadas ?? 0}`,
      `Fones Aprovados;${d.fones_aprovados ?? 0}`,
      `Fones Reprovados;${d.fones_reprovados ?? 0}`,
      `Taxa Geral de Aprovação (FPY);${d.taxa_aprovacao ?? '0%'}`,
      `Manutenções Pendentes na Fila;${s.manutencoes_pendentes ?? 0}`,
      `Manutenções Concluídas;${s.manutencoes_concluidas ?? 0}`,
      `MTTR Médio (Dias para Reparo);${s.mttr_medio_dias ?? 0}`,
      `Taxa de Retrabalho;${s.taxa_retrabalho ?? '0%'}`,
      '',
      '--- MODELOS MAIS REPROVADOS ---',
      'Modelo;Total de Reprovações',
      ...(s.reprovacoes_por_modelo || []).map((m) => `${m.modelo};${m.total}`),
      '',
      '--- FALHAS POR TIPO DE TESTE ---',
      'Tipo de Teste;Total de Falhas',
      ...(s.tipos_teste_falhos || []).map((t) => `${t.tipo};${t.total}`),
      '',
      '--- PRODUTIVIDADE POR TÉCNICO ---',
      'Técnico;Manutenções Concluídas',
      ...(s.concluidas_por_tecnico || []).map((tec) => `${tec.nome};${tec.total}`)
    ].join('\n');

    const blob = new Blob(['\uFEFF' + relatorioCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const agora = new Date();
    const dataLocalNome = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `soundx_relatorio_analitico_completo_${dataLocalNome}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Relatório executivo analítico exportado com sucesso!', 'sucesso');
  });
}

carregarDashboard();
