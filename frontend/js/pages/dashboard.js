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
    { classe: 'kpi--claro',   valor: String(dados.total_fones_cadastrados ?? 0), rotulo: 'Fones cadastrados' },
    { classe: 'kpi--energia', valor: String(dados.total_inspecoes_realizadas ?? 0), rotulo: 'Inspeções realizadas' },
    { classe: 'kpi--claro',   valor: String(dados.fones_aprovados ?? 0), rotulo: 'Fones aprovados' },
    { classe: 'kpi--dark',    valor: String(dados.fones_reprovados ?? 0), rotulo: 'Fones reprovados' },
    { classe: 'kpi--forte',   valor: String(dados.taxa_aprovacao ?? '0%'), rotulo: 'Taxa de aprovação' },
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

async function carregar() {
  showSkeleton(kpisEl, 5);

  try {
    const dados = await api('/inspecoes/dashboard');
    desenharKpis(dados);
  } catch (erro) {
    kpisEl.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();