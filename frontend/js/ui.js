import { getUsuario, logoutRedireciona, cargoLabel, isAdminGerente, normalizarCargo } from './auth.js';

const ICONES = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>',
  fones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>',
  inspecoes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  testes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"></path><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"></path></svg>',
  manutencao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
  sair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
};

const MENU = [
  { id: 'dashboard',   rotulo: 'Dashboard',   icone: 'dashboard',   href: 'dashboard.html',  cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'fones',       rotulo: 'Fones',       icone: 'fones',       href: 'fones.html',      cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'inspecoes',   rotulo: 'Inspeções',   icone: 'inspecoes',   href: 'inspecoes.html',  cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'testes',      rotulo: 'Testes',      icone: 'testes',      href: 'testes.html',     cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'manutencao',  rotulo: 'Manutenção',  icone: 'manutencao',  href: 'manutencao.html', cargos: ['Admin', 'Gerente', 'Técnico'] },
];

export function initShell(tituloAtivo, usuario) {
  const sidebarEl = document.getElementById('sidebar');
  const topbarEl = document.getElementById('topbar');

  if (!sidebarEl || !topbarEl) return;

  const itensVisiveis = MENU.filter((item) => {
    if (isAdminGerente(usuario.cargo)) return true;
    const cUser = normalizarCargo(usuario.cargo);
    return item.cargos.map(normalizarCargo).some((c) => cUser === c || cUser.includes(c));
  });

  const navHtml = itensVisiveis
    .map((item) => `
      <a class="sidebar__item ${item.id === tituloAtivo ? 'sidebar__item--active' : ''}" href="${item.href}">
        ${ICONES[item.icone]}
        <span>${item.rotulo}</span>
      </a>`)
    .join('');

  sidebarEl.innerHTML = `
    <div class="sidebar__brand">
      <img src="assets/logo/4.png" alt="Logo SoundX Quality">
      <span>SoundX Quality</span>
    </div>
    <nav class="sidebar__nav" aria-label="Menu principal">
      ${navHtml}
    </nav>
    <div class="sidebar__footer">
      <div>
        <div class="sidebar__footer-user">${escapeHtml(usuario.nome || 'Usuário')}</div>
        <div class="sidebar__footer-role">${escapeHtml(cargoLabel(usuario.cargo))}</div>
      </div>
      <button class="btn btn--ghost btn--pequeno" id="btn-sair">
        ${ICONES.sair}
        <span>Sair</span>
      </button>
    </div>
  `;

  const iniciais = (usuario.nome || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase();

  topbarEl.innerHTML = `
    <button class="icone-menu" id="btn-menu" aria-label="Abrir menu">${ICONES.menu}</button>
    <span class="topbar__title">${escapeHtml(tituloAtivoHumanizado(tituloAtivo))}</span>
    <div class="topbar__actions">
      <div class="topbar__avatar" title="${escapeHtml(cargoLabel(usuario.cargo))}">${iniciais}</div>
    </div>
  `;

  const btnSair = document.getElementById('btn-sair');
  if (btnSair) {
    btnSair.addEventListener('click', () => {
      logoutRedireciona();
    });
  }

  const btnMenu = document.getElementById('btn-menu');
  const overlay = document.getElementById('overlay');
  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      sidebarEl.classList.add('sidebar--aberta');
      if (overlay) overlay.classList.add('overlay--mostrar');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebarEl.classList.remove('sidebar--aberta');
      overlay.classList.remove('overlay--mostrar');
    });
  }
}

function tituloAtivoHumanizado(id) {
  const item = MENU.find((m) => m.id === id);
  if (id === 'dashboard') return 'Dashboard';
  return item ? item.rotulo : 'SoundX Quality';
}

/* ---------- Toasts ---------- */

export function toast(mensagem, tipo = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.textContent = mensagem;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast--saindo');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ---------- Formatadores ---------- */

export function formatarData(valor) {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarDataCurta(valor) {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString('pt-BR');
}

/* ---------- Badges de status ---------- */

export function badgeStatus(status) {
  const tipo = statusParaClasse(status);
  return `<span class="badge badge--${tipo.classe}"><span class="badge__dot"></span><span>${escapeHtml(status || '—')}</span></span>`;
}

function statusParaClasse(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('aprovado')) return { classe: 'sucesso' };
  if (s.includes('reprovado')) return { classe: 'erro' };
  if (s.includes('conclui')) return { classe: 'sucesso' };
  if (s.includes('aguardando') || s.includes('análise')) return { classe: 'atencao' };
  if (s.includes('manuten')) return { classe: 'atencao' };
  return { classe: 'info' };
}

/* ---------- Utilitários ---------- */

export function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

export function obterQueryParam(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

export function showSkeleton(container, blocos = 4) {
  let html = '';
  for (let i = 0; i < blocos; i += 1) {
    html += '<div class="skeleton skeleton--bloco"></div>';
  }
  container.innerHTML = html;
}

export function emptyState(container, titulo, descricao) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3>${escapeHtml(titulo)}</h3>
      <p>${escapeHtml(descricao)}</p>
    </div>
  `;
}