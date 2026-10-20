/* =========================================================
   SOUNDX QUALITY — DOCUMENTAÇÃO TÉCNICA
   Navegação por abas, progresso de leitura e cópia de código
   ========================================================= */
(() => {
  'use strict';

  const DEFAULT_TAB = 'visao-geral';
  const tabButtons = Array.from(document.querySelectorAll('[data-doc-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-doc-panel]'));
  const links = Array.from(document.querySelectorAll('[data-doc-link]'));
  const tabsWrap = document.querySelector('.docs-tabs-wrap');
  const tabsList = document.querySelector('.docs-tabs');
  const liveRegion = document.getElementById('docs-live');
  const progressBar = document.getElementById('docs-progress');
  const topButton = document.getElementById('docs-top');
  const sidebar = document.getElementById('docs-sidebar');
  const overlay = document.getElementById('overlay');
  const menuButton = document.getElementById('btn-menu');

  let currentTab = null;

  function exists(id) {
    return tabButtons.some((tab) => tab.dataset.docTab === id);
  }

  function tabLabel(id) {
    const tab = tabButtons.find((item) => item.dataset.docTab === id);
    return tab ? (tab.dataset.docLabel || tab.textContent.trim()) : '';
  }

  function activate(id, options = {}) {
    const targetId = exists(id) ? id : DEFAULT_TAB;
    const { updateHash = true, scroll = false, announce = true } = options;

    currentTab = targetId;

    tabButtons.forEach((tab) => {
      const active = tab.dataset.docTab === targetId;
      tab.classList.toggle('docs-tab--ativo', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        tab.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    });

    panels.forEach((panel) => {
      const active = panel.dataset.docPanel === targetId;
      panel.classList.toggle('docs-panel--ativo', active);
      panel.hidden = !active;
    });

    links.forEach((link) => {
      const active = link.dataset.docLink === targetId;
      link.classList.toggle('sidebar__item--active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (updateHash) {
      const hash = `#${targetId}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash);
      }
    }

    if (announce && liveRegion) {
      liveRegion.textContent = `Capítulo ${tabLabel(targetId)} aberto.`;
    }

    if (scroll && tabsWrap) {
      const topbarOffset = window.innerWidth <= 1023 ? 72 : 84;
      const top = tabsWrap.getBoundingClientRect().top + window.scrollY - topbarOffset;
      if (window.scrollY > top + 8) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('sidebar--aberta');
    if (overlay) overlay.classList.remove('overlay--mostrar');
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.add('sidebar--aberta');
    if (overlay) overlay.classList.add('overlay--mostrar');
  }

  /* Abas */
  tabButtons.forEach((tab) => {
    const label = tab.dataset.docLabel || tab.textContent.trim();
    tab.setAttribute('aria-label', label);
    tab.title = label;

    tab.addEventListener('click', () => {
      activate(tab.dataset.docTab, { scroll: true });
    });

    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      event.preventDefault();
      const index = tabButtons.indexOf(tab);
      let nextIndex = index;

      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabButtons.length - 1;

      const nextTab = tabButtons[nextIndex];
      activate(nextTab.dataset.docTab, { scroll: true, announce: true });
      nextTab.focus();
    });
  });

  /* Navegação lateral */
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      activate(link.dataset.docLink, { scroll: true });
      closeSidebar();
    });
  });

  /* Menu mobile */
  if (menuButton) {
    menuButton.addEventListener('click', openSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSidebar();
  });

  /* Hash da URL */
  function tabFromHash() {
    return window.location.hash.replace(/^#/, '').split('?')[0];
  }

  window.addEventListener('hashchange', () => {
    const id = tabFromHash();
    if (id && exists(id)) activate(id, { updateHash: false });
  });

  /* Cópia de blocos de código */
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;

    const target = document.getElementById(button.dataset.copy);
    if (!target) return;

    const code = target.textContent;
    const original = button.textContent;
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        copied = true;
      }
    } catch (error) {
      copied = false;
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        textarea.remove();
      } catch (error) {
        copied = false;
      }
    }

    if (copied) {
      button.textContent = 'Copiado!';
      button.classList.add('docs-copy--ok');
      if (liveRegion) liveRegion.textContent = 'Código copiado para a área de transferência.';
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('docs-copy--ok');
      }, 1800);
    } else {
      button.textContent = 'Selecione o texto';
      if (liveRegion) liveRegion.textContent = 'Não foi possível copiar automaticamente. Selecione o texto do bloco.';
      window.setTimeout(() => {
        button.textContent = original;
      }, 1800);
    }
  });

  /* Progresso de leitura e botão de topo */
  let ticking = false;

  function updateScrollUi() {
    const root = document.documentElement;
    const max = root.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (topButton) topButton.classList.toggle('docs-top--visible', window.scrollY > 640);
    ticking = false;
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollUi);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);

  if (topButton) {
    topButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Inicialização */
  const initial = tabFromHash();
  activate(exists(initial) ? initial : DEFAULT_TAB, { updateHash: false, announce: false });

  updateScrollUi();
})();
