import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, showSkeleton, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('dashboard', usuario);
}

const kpisEl = document.getElementById('kpis');

function desenharKpis(dados) {
  const itens = [
    { classe: 'kpi--fones',     valor: String(dados.total_fones_cadastrados ?? 0), rotulo: 'Fones cadastrados' },
    { classe: 'kpi--inspecoes', valor: String(dados.total_inspecoes_realizadas ?? 0), rotulo: 'Inspeções realizadas' },
    { classe: 'kpi--aprovados', valor: String(dados.fones_aprovados ?? 0), rotulo: 'Fones aprovados' },
    { classe: 'kpi--reprovados', valor: String(dados.fones_reprovados ?? 0), rotulo: 'Fones reprovados' },
    { classe: 'kpi--taxa',      valor: String(dados.taxa_aprovacao ?? '0%'), rotulo: 'Taxa de aprovação' },
  ];

  kpisEl.innerHTML = itens
    .map((item, idx) => `
      <div class="kpi ${item.classe}" style="animation-delay: ${idx * 0.08}s">
        <div class="kpi__valor">${item.valor}</div>
        <div class="kpi__label">${item.rotulo}</div>
      </div>
    `)
    .join('');

  // Atualiza widgets gráficos de progresso e distribuição
  const taxaTexto = document.getElementById('taxa-texto');
  const barraProgresso = document.getElementById('barra-progresso');
  const barraAprovados = document.getElementById('barra-aprovados');
  const barraReprovados = document.getElementById('barra-reprovados');
  const lblAprovados = document.getElementById('lbl-aprovados');
  const lblReprovados = document.getElementById('lbl-reprovados');

  const taxaStr = dados.taxa_aprovacao || '0%';
  const taxaNum = parseFloat(taxaStr.replace('%', '')) || 0;
  const total = Number(dados.total_inspecoes_realizadas) || 0;
  const aprovados = Number(dados.fones_aprovados) || 0;
  const reprovados = Number(dados.fones_reprovados) || 0;

  if (taxaTexto) taxaTexto.textContent = taxaStr;
  if (barraProgresso) {
    setTimeout(() => {
      barraProgresso.style.width = `${Math.min(100, Math.max(0, taxaNum))}%`;
    }, 100);
  }

  if (lblAprovados) lblAprovados.textContent = String(aprovados);
  if (lblReprovados) lblReprovados.textContent = String(reprovados);

  if (barraAprovados && barraReprovados) {
    const pctAprov = total > 0 ? (aprovados / total) * 100 : 50;
    const pctReprov = total > 0 ? (reprovados / total) * 100 : 50;
    setTimeout(() => {
      barraAprovados.style.width = `${pctAprov}%`;
      barraReprovados.style.width = `${pctReprov}%`;
    }, 150);
  }
}

function desenharAcoesRapidas() {
  const grid = document.getElementById('grid-acoes-rapidas');
  if (!grid || !usuario) return;

  const cargo = String(usuario.cargo || '').toLowerCase();
  const isAdminOuGerente = cargo === 'admin' || cargo.includes('gerente');

  const acoes = [
    {
      href: 'inspecao-form.html',
      rotulo: 'Nova Inspeção',
      visivel: isAdminOuGerente || cargo.includes('inspetor'),
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>'
    },
    {
      href: 'fones.html',
      rotulo: 'Catálogo de Fones',
      visivel: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>'
    },
    {
      href: 'fone-cadastro.html',
      rotulo: 'Cadastrar Fone',
      visivel: isAdminOuGerente || cargo.includes('inspetor'),
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
    },
    {
      href: 'testes.html',
      rotulo: 'Testes Técnicos',
      visivel: isAdminOuGerente || cargo.includes('inspetor'),
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"></path><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"></path></svg>'
    },
    {
      href: 'manutencao.html',
      rotulo: 'Manutenção',
      visivel: isAdminOuGerente || cargo.includes('tecnico'),
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>'
    }
  ];

  grid.innerHTML = acoes
    .filter(a => a.visivel)
    .map(a => `
      <a href="${a.href}" class="acao-card">
        ${a.svg}
        <span>${a.rotulo}</span>
      </a>
    `)
    .join('');
}

async function carregar() {
  showSkeleton(kpisEl, 5);

  try {
    const dados = await api('/inspecoes/dashboard');
    desenharKpis(dados);
    desenharAcoesRapidas();
  } catch (erro) {
    kpisEl.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();