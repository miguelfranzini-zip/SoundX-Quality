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

    if (targetId === 'apresentacao') {
      document.body.classList.add('slides-mode-active');
      if (typeof showSlide === 'function') {
        showSlide(currentSlide);
      }
    } else {
      document.body.classList.remove('slides-mode-active');
    }

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

  /* =========================================================
     SLIDES DE APRESENTAÇÃO EXECUTIVA & BUSCA RÁPIDA DE DÚVIDAS
     ========================================================= */
  const slides = Array.from(document.querySelectorAll('.slide-item'));
  const btnSlidePrev = document.getElementById('btn-slide-prev');
  const btnSlideNext = document.getElementById('btn-slide-next');
  const btnSlideFullscreen = document.getElementById('btn-slide-fullscreen');
  const btnSlideExit = document.getElementById('btn-slide-exit');
  const counterPill = document.getElementById('slides-counter-pill');
  const counterText = document.getElementById('slides-counter-text');
  const slidesDotsContainer = document.getElementById('slides-dots');
  const btnSlidesBusca = document.getElementById('btn-slides-busca');
  const slidesSearchWrap = document.getElementById('slides-search-wrap');
  const slidesSearchInput = document.getElementById('slides-search-input');
  const btnSlidesSearchClose = document.getElementById('btn-slides-search-close');
  const slidesSearchResults = document.getElementById('slides-search-results');

  let currentSlide = 0;

  function renderSlideDots() {
    if (!slidesDotsContainer || !slides.length) return;
    slidesDotsContainer.innerHTML = slides
      .map(
        (_, idx) => `
        <button type="button" class="slide-dot ${idx === currentSlide ? 'slide-dot--active' : ''}" data-slide-goto="${idx}" aria-label="Ir para slide ${idx === 0 ? 'Capa' : idx}"></button>
      `
      )
      .join('');
  }

  function showSlide(index) {
    if (!slides.length) return;
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));

    slides.forEach((slide, idx) => {
      const active = idx === currentSlide;
      if (active) {
        slide.classList.remove('slide-item--active');
        void slide.offsetWidth; // Força reflow para reiniciar animações em cascata
        slide.classList.add('slide-item--active');
        slide.hidden = false;
        slide.scrollTop = 0;
      } else {
        slide.classList.remove('slide-item--active');
        slide.hidden = true;
      }
    });

    // Atualiza barra de progresso do topo
    const progressBarEl = document.getElementById('slides-progress-bar');
    if (progressBarEl) {
      const total = slides.length - 1;
      const pct = total > 0 ? (currentSlide / total) * 100 : 0;
      progressBarEl.style.width = `${pct}%`;
    }

    // Atualiza controles e contadores
    if (counterPill) {
      counterPill.textContent = currentSlide === 0 ? 'Capa' : `Slide ${String(currentSlide).padStart(2, '0')}`;
    }

    if (counterText) {
      const currentEl = slides[currentSlide];
      const title = currentEl?.dataset.slideTopic || (currentSlide === 0 ? 'Visão Executiva' : `Módulo ${currentSlide}`);
      counterText.textContent = `${title} (${currentSlide} de ${slides.length - 1})`;
    }

    if (btnSlidePrev) {
      btnSlidePrev.disabled = currentSlide === 0;
    }

    if (btnSlideNext) {
      btnSlideNext.textContent = currentSlide === slides.length - 1 ? 'Reiniciar ↺' : 'Próximo →';
    }

    renderSlideDots();
  }

  if (btnSlidePrev) {
    btnSlidePrev.addEventListener('click', () => {
      if (currentSlide > 0) showSlide(currentSlide - 1);
    });
  }

  if (btnSlideNext) {
    btnSlideNext.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        showSlide(currentSlide + 1);
      } else {
        showSlide(0); // Volta à capa
      }
    });
  }

  if (slidesDotsContainer) {
    slidesDotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-slide-goto]');
      if (dot) {
        showSlide(Number(dot.dataset.slideGoto));
      }
    });
  }

  // Alternância de Tela Cheia nativa (Fullscreen API)
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  if (btnSlideFullscreen) {
    btnSlideFullscreen.addEventListener('click', toggleFullscreen);
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = Boolean(document.fullscreenElement);
    const expandIcon = btnSlideFullscreen?.querySelector('.icon-expand');
    const compressIcon = btnSlideFullscreen?.querySelector('.icon-compress');
    if (expandIcon) expandIcon.classList.toggle('hidden', isFs);
    if (compressIcon) compressIcon.classList.toggle('hidden', !isFs);
    if (btnSlideFullscreen) {
      const textSpan = btnSlideFullscreen.querySelector('span');
      if (textSpan) textSpan.textContent = isFs ? 'Sair Tela Cheia (F)' : 'Tela Cheia (F)';
    }
  });

  // Botão Sair dos Slides (Voltar ao manual)
  if (btnSlideExit) {
    btnSlideExit.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      activate('visao-geral', { scroll: true });
    });
  }

  // Atalhos de teclado (Setas, Espaço, Home, End, F, Esc quando na aba apresentação)
  document.addEventListener('keydown', (e) => {
    if (currentTab !== 'apresentacao') return;
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        slidesSearchWrap?.classList.add('hidden');
        btnSlidesBusca?.setAttribute('aria-expanded', 'false');
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      if (currentSlide < slides.length - 1) showSlide(currentSlide + 1);
      else showSlide(0);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
      e.preventDefault();
      if (currentSlide > 0) showSlide(currentSlide - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      showSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      showSlide(slides.length - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'Escape') {
      if (slidesSearchWrap && !slidesSearchWrap.classList.contains('hidden')) {
        slidesSearchWrap.classList.add('hidden');
        btnSlidesBusca?.setAttribute('aria-expanded', 'false');
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        activate('visao-geral', { scroll: true });
      }
    }
  });

  // Links diretos dentro de cada slide para o capítulo correspondente
  document.addEventListener('click', (e) => {
    const linkDuvida = e.target.closest('[data-duvida-tab]');
    if (linkDuvida) {
      e.preventDefault();
      const tabId = linkDuvida.dataset.duvidaTab;
      activate(tabId, { scroll: true });
    }
  });

  /* ---------- Base de Conhecimento para Pesquisa Rápida de Dúvidas ---------- */
  const DOC_SEARCH_INDEX = [
    {
      termos: ['transacao', 'transacoes', 'acid', 'atomicidade', 'withtransaction', 'rollback', 'commit'],
      titulo: 'Transações Atômicas & Integridade ACID',
      capitulo: 'banco',
      badge: 'Banco de Dados',
      resumo: 'Como o banco agrupa inserção de laudo, testes, status do fone e abertura de O.S. sem perda de dados.'
    },
    {
      termos: ['jwt', 'token', 'autenticacao', 'segredo', 'jwt_secret', 'bearer', 'login', 'senha'],
      titulo: 'Autenticação JWT & Criptografia Bcrypt',
      capitulo: 'seguranca',
      badge: 'Segurança',
      resumo: 'Assinatura segura de tokens com expiração de 8h e senhas criptografadas (RNF03).'
    },
    {
      termos: ['rbac', 'perfil', 'perfis', 'cargo', 'cargos', 'permissao', 'permissoes', 'inspetor', 'tecnico', 'admin', 'gerente'],
      titulo: 'Matriz de Acessos & RBAC',
      capitulo: 'seguranca',
      badge: 'Segurança',
      resumo: 'Segregação de privilégios para Inspetor, Técnico de Manutenção e exclusividade do Admin em DELETE (RNF08).'
    },
    {
      termos: ['checklist', 'audio', 'microfone', 'bateria', 'conectividade', 'bluetooth', 'teste', 'testes'],
      titulo: 'Checklist de Testes Técnicos (4 Dimensões)',
      capitulo: 'backend',
      badge: 'Backend / API',
      resumo: 'Medições padronizadas de Áudio L/R, captação de Microfone, estabilidade de conexão e consumo de Bateria.'
    },
    {
      termos: ['manutencao', 'ordem de servico', 'os', 'reparo', 'defeito', 'acao corretiva', 'fila'],
      titulo: 'Fila de Manutenção & Prevenção de Duplicatas',
      capitulo: 'backend',
      badge: 'Backend / API',
      resumo: 'Abertura automática na reprovação, garantia de 1 O.S. aberta por fone e encaminhamento para reteste.'
    },
    {
      termos: ['dashboard', 'kpi', 'taxa de aprovacao', 'indicadores', 'metricas', 'grafico'],
      titulo: 'Dashboard de Indicadores & Métricas por Fone',
      capitulo: 'diagnostico',
      badge: 'Diagnóstico',
      resumo: 'Cálculo real de conformidade baseado na última inspeção de cada fone único em vez de contagem de linhas.'
    },
    {
      termos: ['banco', 'banco de dados', 'postgresql', 'supabase', 'fallback', 'local_data.json', 'tabelas', 'ddl'],
      titulo: 'Arquitetura de Dados & 5 Tabelas Relacionais',
      capitulo: 'banco',
      badge: 'Banco de Dados',
      resumo: 'DDL do PostgreSQL/Supabase, constraints de integridade referencial e fallback local JSON.'
    },
    {
      termos: ['csv', 'exportacao', 'rfc 4180', 'excel', 'relatorio'],
      titulo: 'Exportação CSV Conforme RFC 4180',
      capitulo: 'frontend',
      badge: 'Frontend',
      resumo: 'Geração de relatórios com escape de aspas duplas, codificação UTF-8 com BOM e nomenclatura por data local.'
    },
    {
      termos: ['laudo', 'impressao', 'popup', 'rastreabilidade', 'historico', 'pdf'],
      titulo: 'Laudo Técnico de Inspeção & Impressão',
      capitulo: 'frontend',
      badge: 'Frontend',
      resumo: 'Geração de laudo auditável para impressão física ou PDF com histórico de testes e manutenções.'
    },
    {
      termos: ['foto', 'fotos', 'evidencia', 'foto_url', 'upload', 'imagem'],
      titulo: 'Evidências Fotográficas de Não Conformidade',
      capitulo: 'backend',
      badge: 'Backend / API',
      resumo: 'Validação de URLs seguras e anexação de fotos no laudo para comprovação visual de defeitos.'
    },
    {
      termos: ['data', 'datas', 'fuso horario', 'utc', 'brt', 'fabricacao'],
      titulo: 'Tratamento de Datas & Fuso Horário',
      capitulo: 'diagnostico',
      badge: 'Diagnóstico',
      resumo: 'Prevenção do bug de recuo de dia em datas de fabricação utilizando parsing local sem conversão UTC.'
    },
    {
      termos: ['design system', 'garet', 'muli', 'cores', 'laranja', 'dourado', 'marrom'],
      titulo: 'Design System SoundX & Tipografia',
      capitulo: 'design',
      badge: 'Design System',
      resumo: 'Direção estética minimalista e tecnológica: Garet nos títulos, Muli nos textos e paleta cromática oficial.'
    }
  ];

  function normalizarTexto(txt) {
    return String(txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function executarBuscaDuvidas(termo) {
    if (!slidesSearchResults) return;
    const q = normalizarTexto(termo);

    if (!q || q.length < 2) {
      slidesSearchResults.innerHTML = '';
      slidesSearchResults.classList.add('hidden');
      return;
    }

    const resultados = DOC_SEARCH_INDEX.filter((item) => {
      const matchTitulo = normalizarTexto(item.titulo).includes(q);
      const matchResumo = normalizarTexto(item.resumo).includes(q);
      const matchBadge = normalizarTexto(item.badge).includes(q);
      const matchTermos = item.termos.some((t) => normalizarTexto(t).includes(q));
      return matchTitulo || matchResumo || matchBadge || matchTermos;
    });

    if (!resultados.length) {
      slidesSearchResults.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-secundario); font-size: 0.88rem;">
          Nenhum tópico encontrado para "<strong>${termo}</strong>". Tente termos como <em>transação, jwt, rbac, checklist, banco, manutenção</em>.
        </div>
      `;
      slidesSearchResults.classList.remove('hidden');
      return;
    }

    slidesSearchResults.innerHTML = resultados
      .map(
        (item) => `
        <div class="slides-search-item" data-search-tab="${item.capitulo}" role="button" tabindex="0">
          <div class="slides-search-item__header">
            <span class="slides-search-item__title">${item.titulo}</span>
            <span class="slides-search-item__badge">${item.badge}</span>
          </div>
          <p class="slides-search-item__desc">${item.resumo}</p>
        </div>
      `
      )
      .join('');

    slidesSearchResults.classList.remove('hidden');
  }

  if (btnSlidesBusca) {
    btnSlidesBusca.addEventListener('click', () => {
      const estaAberto = !slidesSearchWrap.classList.contains('hidden');
      if (estaAberto) {
        slidesSearchWrap.classList.add('hidden');
        btnSlidesBusca.setAttribute('aria-expanded', 'false');
      } else {
        slidesSearchWrap.classList.remove('hidden');
        btnSlidesBusca.setAttribute('aria-expanded', 'true');
        setTimeout(() => slidesSearchInput?.focus(), 50);
      }
    });
  }

  if (btnSlidesSearchClose) {
    btnSlidesSearchClose.addEventListener('click', () => {
      slidesSearchWrap?.classList.add('hidden');
      btnSlidesBusca?.setAttribute('aria-expanded', 'false');
      if (slidesSearchResults) slidesSearchResults.classList.add('hidden');
    });
  }

  if (slidesSearchInput) {
    slidesSearchInput.addEventListener('input', (e) => {
      executarBuscaDuvidas(e.target.value);
    });

    slidesSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        slidesSearchWrap?.classList.add('hidden');
        btnSlidesBusca?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (slidesSearchResults) {
    slidesSearchResults.addEventListener('click', (e) => {
      const itemEl = e.target.closest('[data-search-tab]');
      if (itemEl) {
        const tabId = itemEl.dataset.searchTab;
        slidesSearchWrap?.classList.add('hidden');
        btnSlidesBusca?.setAttribute('aria-expanded', 'false');
        activate(tabId, { scroll: true });
      }
    });
  }

  // Inicializa slides
  showSlide(0);

  /* Inicialização */
  const initial = tabFromHash();
  activate(exists(initial) ? initial : DEFAULT_TAB, { updateHash: false, announce: false });

  updateScrollUi();
})();
