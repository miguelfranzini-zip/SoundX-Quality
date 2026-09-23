import { getUsuario, logoutRedireciona, cargoLabel, isAdminGerente, normalizarCargo } from './auth.js';

// Previne flash/animação indevida ao alternar entre abas
if (typeof localStorage !== 'undefined' && localStorage.getItem('sxq_sidebar_collapsed') === 'true') {
  document.documentElement.classList.add('sxq-collapsed');
}

const ICONES = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>',
  fones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>',
  inspecoes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  testes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"></path><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"></path></svg>',
  manutencao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
  sair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
  'user-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>',
  userPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>',
  toggleSidebar: '<svg class="icone-toggle-sidebar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="m14 9-3 3 3 3"></path></svg>',
};

const MENU = [
  { id: 'dashboard',   rotulo: 'Dashboard',   icone: 'dashboard',   href: 'dashboard.html',  cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'fones',       rotulo: 'Fones',       icone: 'fones',       href: 'fones.html',      cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'inspecoes',   rotulo: 'Inspeções',   icone: 'inspecoes',   href: 'inspecoes.html',  cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'testes',      rotulo: 'Testes',      icone: 'testes',      href: 'testes.html',     cargos: ['Admin', 'Gerente', 'Inspetor'] },
  { id: 'manutencao',  rotulo: 'Manutenção',  icone: 'manutencao',  href: 'manutencao.html', cargos: ['Admin', 'Gerente', 'Técnico'] },
  { id: 'cadastrar-usuario', rotulo: 'Cadastrar Usuário', icone: 'user-plus', href: 'user-cadastro.html', cargos: ['Admin'] },
];

export function initShell(tituloAtivo, usuario) {
  const sidebarEl = document.getElementById('sidebar');
  const topbarEl = document.getElementById('topbar');
  const appShell = document.querySelector('.app-shell');

  if (!sidebarEl || !topbarEl || !usuario) return;

  // Estado persistente da barra lateral (expandida ou recolhida)
  const estaRecolhidaInicial = localStorage.getItem('sxq_sidebar_collapsed') === 'true';
  if (estaRecolhidaInicial) {
    document.documentElement.classList.add('sxq-collapsed');
    if (appShell) appShell.classList.add('app-shell--recolhida');
    sidebarEl.classList.add('sidebar--recolhida');
  } else {
    document.documentElement.classList.remove('sxq-collapsed');
    if (appShell) appShell.classList.remove('app-shell--recolhida');
    sidebarEl.classList.remove('sidebar--recolhida');
  }

  const itensVisiveis = MENU.filter((item) => {
    if (!item.cargos || item.cargos.length === 0) return true;
    if (isAdminGerente(usuario.cargo)) return true;
    const cUser = normalizarCargo(usuario.cargo);
    return item.cargos.map(normalizarCargo).some((c) => cUser === c || cUser.includes(c));
  });

  const navHtml = itensVisiveis
    .map((item) => {
      const iconeSvg = ICONES[item.icone] || ICONES[item.icone?.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] || '';
      return `
      <a class="sidebar__item ${item.id === tituloAtivo ? 'sidebar__item--active' : ''}" href="${item.href}" title="${item.rotulo}">
        ${iconeSvg}
        <span>${item.rotulo}</span>
      </a>`;
    })
    .join('');

  sidebarEl.innerHTML = `
    <div class="sidebar__brand">
      <div class="sidebar__brand-content" title="SoundX Quality">
        <img src="assets/logo/5.png" alt="Logo SoundX Quality">
        <span>SoundX Quality</span>
      </div>
      <button class="sidebar__toggle" id="btn-toggle-sidebar" title="${estaRecolhidaInicial ? 'Expandir menu' : 'Minimizar menu'}" aria-label="Alternar barra lateral">
        ${ICONES.toggleSidebar}
      </button>
    </div>
    <nav class="sidebar__nav" aria-label="Menu principal">
      ${navHtml}
    </nav>
    <div class="sidebar__footer">
      <div class="sidebar__footer-info">
        <div class="sidebar__footer-user" title="${escapeHtml(usuario.nome || 'Usuário')}">${escapeHtml(usuario.nome || 'Usuário')}</div>
        <div class="sidebar__footer-role">${escapeHtml(cargoLabel(usuario.cargo))}</div>
      </div>
      <button class="btn btn--sair" id="btn-sair" title="Encerrar sessão (${escapeHtml(usuario.nome || 'Usuário')})">
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
      <div class="topbar__user-menu">
        <button class="topbar__user-btn" id="btn-user-menu" aria-label="Menu do usuário" aria-expanded="false" aria-haspopup="true">
          <span class="topbar__avatar">${iniciais}</span>
          <svg class="topbar__avatar-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="topbar__dropdown hidden" id="user-dropdown" role="menu">
          <div class="topbar__dropdown-header">
            <strong>${escapeHtml(usuario.nome || 'Usuário')}</strong>
            <span>${escapeHtml(cargoLabel(usuario.cargo))}</span>
          </div>
          <a href="alterar-senha.html" class="topbar__dropdown-item" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Alterar senha
          </a>
          <button class="topbar__dropdown-item topbar__dropdown-item--danger" id="btn-sair-topbar" role="menuitem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair
          </button>
        </div>
      </div>
    </div>
  `;

  // User menu dropdown
  const btnUserMenu = document.getElementById('btn-user-menu');
  const userDropdown = document.getElementById('user-dropdown');
  const btnSairTopbar = document.getElementById('btn-sair-topbar');
  const btnSairSidebar = document.getElementById('btn-sair');

  function toggleUserMenu() {
    if (userDropdown) {
      userDropdown.classList.toggle('hidden');
      btnUserMenu.setAttribute('aria-expanded', !userDropdown.classList.contains('hidden'));
    }
  }

  if (btnUserMenu) {
    btnUserMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleUserMenu();
    });
  }

  if (btnSairTopbar) {
    btnSairTopbar.addEventListener('click', () => {
      logoutRedireciona();
    });
  }

  if (btnSairSidebar) {
    btnSairSidebar.addEventListener('click', () => {
      logoutRedireciona();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.classList.contains('hidden') && !btnUserMenu.contains(e.target)) {
      userDropdown.classList.add('hidden');
      btnUserMenu.setAttribute('aria-expanded', 'false');
    }
  });

  const btnToggle = document.getElementById('btn-toggle-sidebar');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      // Habilita transição apenas na interação explícita do usuário
      sidebarEl.classList.add('sidebar--transicao');
      if (appShell) appShell.classList.add('app-shell--transicao');

      const estaRecolhida = sidebarEl.classList.toggle('sidebar--recolhida');
      if (appShell) {
        appShell.classList.toggle('app-shell--recolhida', estaRecolhida);
      }
      document.documentElement.classList.toggle('sxq-collapsed', estaRecolhida);
      localStorage.setItem('sxq_sidebar_collapsed', estaRecolhida ? 'true' : 'false');
      btnToggle.setAttribute('title', estaRecolhida ? 'Expandir barra lateral' : 'Recolher barra lateral');
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

/* ---------- Diálogo de Confirmação ---------- */

export function confirmarAcao({
  titulo = 'Confirmar exclusão',
  mensagem = 'Tem certeza que deseja excluir este registro?',
  textoBotao = 'Excluir',
  perigoso = true
} = {}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('modal-confirmacao-global');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-confirmacao-global';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>${escapeHtml(titulo)}</h3>
          <button class="modal__fechar" id="btn-fechar-confirmacao" aria-label="Fechar">×</button>
        </div>
        <p style="margin-bottom: var(--space-5); color: var(--text-secundario); font-size: 0.95rem; line-height: 1.5;">
          ${escapeHtml(mensagem)}
        </p>
        <div style="display: flex; justify-content: flex-end; gap: var(--space-3);">
          <button type="button" class="btn btn--secundario" id="btn-cancelar-confirmacao">Cancelar</button>
          <button type="button" class="btn ${perigoso ? 'btn--danger' : 'btn--primario'}" id="btn-executar-confirmacao">${escapeHtml(textoBotao)}</button>
        </div>
      </div>
    `;

    overlay.classList.add('modal-overlay--aberta');

    const fechar = (resultado) => {
      overlay.classList.remove('modal-overlay--aberta');
      resolve(resultado);
    };

    overlay.querySelector('#btn-fechar-confirmacao').onclick = () => fechar(false);
    overlay.querySelector('#btn-cancelar-confirmacao').onclick = () => fechar(false);
    overlay.querySelector('#btn-executar-confirmacao').onclick = () => fechar(true);
  });
}