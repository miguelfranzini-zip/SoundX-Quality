/**
 * SOUNDX QUALITY — SISTEMA DE ACESSIBILIDADE E SUPORTE
 * Conformidade com WCAG 2.1 AA, FAB interativo, Alto Contraste,
 * Escala de Fonte, Atalhos de Teclado, FAQ e Tour Guiado.
 */

// Ícones SVG reutilizáveis
const ICONS = {
  a11y: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"></circle><path d="M4 8h16"></path><path d="M12 8v8"></path><path d="M8 20l4-4 4 4"></path></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  contrast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20a10 10 0 0 0 0-20z" fill="currentColor"></path></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  tour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>',
};

// Dicionário de Perguntas Frequentes (FAQ)
const FAQ_DATA = [
  {
    q: 'Como cadastrar um novo fone de ouvido?',
    a: 'Acesse o menu lateral "Fones" e clique no botão "+ Novo Fone". Preencha o modelo, lote, número de série e linha de montagem antes de salvar.'
  },
  {
    q: 'Como realizar uma inspeção de qualidade?',
    a: 'No menu "Inspeções", clique em "+ Nova Inspeção". Selecione o fone pelo número de série, escolha o tipo de inspeção (Visual, Acústica ou Funcional) e marque o status correspondente.'
  },
  {
    q: 'Como abrir uma ordem de manutenção para um fone reprovado?',
    a: 'Acesse "Manutenção" e selecione "+ Solicitar Reparo", ou use o atalho de chave inglesa direto na linha do fone na tabela de Fones ou Inspeções.'
  },
  {
    q: 'Como navegar pelo sistema usando apenas o teclado?',
    a: 'Você pode usar Alt + 1 (Dashboard), Alt + 2 (Fones), Alt + 3 (Inspeções), Alt + 4 (Testes), Alt + 5 (Manutenção). Use Alt + A para o menu de acessibilidade e Alt + S para suporte.'
  },
  {
    q: 'Como ativar o modo de Alto Contraste?',
    a: 'Clique no botão flutuante com o ícone de acessibilidade (♿) ou pressione Alt + A, em seguida selecione "Alto Contraste". Suas preferências ficam salvas automaticamente.'
  },
  {
    q: 'Onde encontro a documentação técnica e o manual completo?',
    a: 'No menu superior do usuário (canto superior direito), clique no seu avatar e selecione "Manual do Usuário", ou acesse a documentação técnica geral do sistema.'
  }
];

// Passos de Tour Guiado por página
const TOUR_STEPS = {
  dashboard: [
    { target: '.topbar', title: 'Barra Superior', desc: 'Aqui você visualiza o título da página e acessa o menu do usuário com perfil, manual e logout.' },
    { target: '.sidebar', title: 'Menu Lateral', desc: 'Navegue rapidamente entre os módulos do sistema de acordo com as permissões do seu cargo.' },
    { target: '.kpi-grid', title: 'Indicadores em Tempo Real', desc: 'Resumo dos números de produção, aprovações, pendências e fones em manutenção.' },
    { target: '.graficos-grid', title: 'Gráficos Analíticos', desc: 'Visualize tendências de aprovação, distribuição de defeitos e produtividade.' }
  ],
  fones: [
    { target: '#btn-novo-fone, .topbar__actions, .filtros-bar', title: 'Gerenciamento de Fones', desc: 'Cadastre novos modelos e lotes de fones de ouvido para rastreabilidade.' },
    { target: '.filtros-bar, #busca', title: 'Busca e Filtros', desc: 'Filtre por número de série, lote, modelo ou status de inspeção.' },
    { target: '.tabela-container, table', title: 'Listagem de Fones', desc: 'Veja o histórico completo, status de inspeção e ações rápidas de cada produto.' }
  ],
  inspecoes: [
    { target: '.filtros-bar, .topbar__actions', title: 'Inspeções de Qualidade', desc: 'Controle de qualidade lote a lote com apontamento de defeitos visuais e funcionais.' },
    { target: '.tabela-container, table', title: 'Tabela de Inspeções', desc: 'Acompanhe quem inspecionou, data/hora e resultado das avaliações de conformidade.' }
  ],
  testes: [
    { target: '.topbar__actions, form, .filtros-bar', title: 'Bancada de Testes', desc: 'Registro de testes acústicos, resposta de frequência e isolamento de ruído.' },
    { target: '.tabela-container, table, .testes-grid', title: 'Resultados e Amostragem', desc: 'Veja as medições em dB e validação de conformidade técnica.' }
  ],
  manutencao: [
    { target: '.filtros-bar, .topbar__actions', title: 'Ordens de Manutenção', desc: 'Gerencie fones com falhas e acompanhe o fluxo de diagnóstico e conserto.' },
    { target: '.tabela-container, table, .manutencao-grid', title: 'Fila de Reparos', desc: 'Priorize e atualize o status de ordens em andamento e peças trocadas.' }
  ]
};

// Objeto singleton de acessibilidade
class SoundXAccessibility {
  constructor() {
    this.usuario = null;
    this.paginaAtual = 'dashboard';
    this.painelAtivo = null; // 'a11y' | 'support' | null
    this.tourPassoAtual = 0;
    this.tourPassos = [];
    this.ultimoElementoFocado = null;

    // Carrega preferências
    this.prefs = {
      contrast: localStorage.getItem('sxq_a11y_contrast') || 'padrao',
      fontSize: localStorage.getItem('sxq_a11y_font_size') || '100%',
      reducedMotion: localStorage.getItem('sxq_a11y_reduced_motion') === 'true',
      focusVisible: localStorage.getItem('sxq_a11y_focus_visible') === 'true'
    };

    this.aplicarPreferencias();
  }

  aplicarPreferencias() {
    const root = document.documentElement;

    // Contraste
    if (this.prefs.contrast === 'alto') {
      root.classList.add('sxq-hc');
    } else {
      root.classList.remove('sxq-hc');
    }

    // Tamanho da fonte
    root.style.setProperty('--sxq-font-size', this.prefs.fontSize);

    // Movimento reduzido
    if (this.prefs.reducedMotion) {
      root.classList.add('sxq-no-motion');
    } else {
      root.classList.remove('sxq-no-motion');
    }

    // Foco visível
    if (this.prefs.focusVisible) {
      root.classList.add('sxq-focus-visible');
    } else {
      root.classList.remove('sxq-focus-visible');
    }
  }

  salvarPreferencia(chave, valor) {
    this.prefs[chave] = valor;
    if (chave === 'contrast') localStorage.setItem('sxq_a11y_contrast', valor);
    if (chave === 'fontSize') localStorage.setItem('sxq_a11y_font_size', valor);
    if (chave === 'reducedMotion') localStorage.setItem('sxq_a11y_reduced_motion', valor ? 'true' : 'false');
    if (chave === 'focusVisible') localStorage.setItem('sxq_a11y_focus_visible', valor ? 'true' : 'false');
    this.aplicarPreferencias();
  }

  restaurarPadroes() {
    this.prefs = {
      contrast: 'padrao',
      fontSize: '100%',
      reducedMotion: false,
      focusVisible: false
    };
    localStorage.removeItem('sxq_a11y_contrast');
    localStorage.removeItem('sxq_a11y_font_size');
    localStorage.removeItem('sxq_a11y_reduced_motion');
    localStorage.removeItem('sxq_a11y_focus_visible');
    this.aplicarPreferencias();
    this.atualizarUIControles();
  }

  init(usuario = null, pagina = null) {
    this.usuario = usuario || this.obterUsuarioSessao();
    this.paginaAtual = pagina || this.identificarPaginaAtual();

    if (document.getElementById('sxq-fab-container')) return; // Já montado

    this.renderizarComponentes();
    this.vincularEventos();
  }

  obterUsuarioSessao() {
    try {
      const u = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  identificarPaginaAtual() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('fones') || path.includes('fone-')) return 'fones';
    if (path.includes('inspeco') || path.includes('inspecao')) return 'inspecoes';
    if (path.includes('teste')) return 'testes';
    if (path.includes('manutenc')) return 'manutencao';
    if (path.includes('historico')) return 'dashboard';
    return 'dashboard';
  }

  renderizarComponentes() {
    // 1. Overlay
    const overlay = document.createElement('div');
    overlay.id = 'sxq-a11y-overlay';
    overlay.className = 'sxq-a11y-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    // 2. FAB Group
    const fabGroup = document.createElement('aside');
    fabGroup.id = 'sxq-fab-container';
    fabGroup.className = 'sxq-fab-group';
    fabGroup.setAttribute('aria-label', 'Atalhos de acessibilidade e suporte');

    fabGroup.innerHTML = `
      <button type="button" class="sxq-fab-btn sxq-fab-btn--acessibilidade" id="sxq-btn-fab-a11y" aria-label="Abrir opções de acessibilidade (Alt + A)" aria-haspopup="dialog" aria-expanded="false">
        ${ICONS.a11y}
        <span class="sxq-fab-tooltip">Acessibilidade (Alt + A)</span>
      </button>
      <button type="button" class="sxq-fab-btn sxq-fab-btn--suporte" id="sxq-btn-fab-support" aria-label="Abrir centro de suporte e ajuda (Alt + S)" aria-haspopup="dialog" aria-expanded="false">
        ${ICONS.help}
        <span class="sxq-fab-tooltip">Suporte & Ajuda (Alt + S)</span>
      </button>
    `;
    document.body.appendChild(fabGroup);

    // 3. Painel de Acessibilidade
    const a11yPanel = document.createElement('div');
    a11yPanel.id = 'sxq-panel-a11y';
    a11yPanel.className = 'sxq-panel';
    a11yPanel.setAttribute('role', 'dialog');
    a11yPanel.setAttribute('aria-modal', 'true');
    a11yPanel.setAttribute('aria-labelledby', 'sxq-a11y-title');

    a11yPanel.innerHTML = `
      <header class="sxq-panel__header">
        <div class="sxq-panel__title-box">
          <span class="sxq-panel__icon">${ICONS.a11y}</span>
          <h3 class="sxq-panel__title" id="sxq-a11y-title">Acessibilidade <span class="sxq-panel__badge">WCAG 2.1</span></h3>
        </div>
        <button type="button" class="sxq-panel__btn-close" id="sxq-close-a11y" aria-label="Fechar painel de acessibilidade">
          ${ICONS.close}
        </button>
      </header>
      <div class="sxq-panel__body">
        <!-- Contraste -->
        <div>
          <div class="sxq-section-title">${ICONS.contrast} Modo de Exibição</div>
          <div class="sxq-options-grid">
            <button type="button" class="sxq-opt-btn ${this.prefs.contrast === 'padrao' ? 'sxq-active' : ''}" id="sxq-opt-contrast-padrao">
              ${ICONS.sun}
              <span>Padrão</span>
            </button>
            <button type="button" class="sxq-opt-btn ${this.prefs.contrast === 'alto' ? 'sxq-active' : ''}" id="sxq-opt-contrast-alto">
              ${ICONS.contrast}
              <span>Alto Contraste</span>
            </button>
          </div>
        </div>

        <!-- Escala de Fonte -->
        <div>
          <div class="sxq-section-title">Tamanho da Fonte</div>
          <div class="sxq-font-sizes" role="group" aria-label="Tamanho do texto">
            <button type="button" class="sxq-font-btn ${this.prefs.fontSize === '90%' ? 'sxq-active' : ''}" data-size="90%" aria-label="Texto pequeno (90%)">
              A-
              <span class="label">90%</span>
            </button>
            <button type="button" class="sxq-font-btn ${this.prefs.fontSize === '100%' ? 'sxq-active' : ''}" data-size="100%" aria-label="Texto padrão (100%)">
              Normal
              <span class="label">100%</span>
            </button>
            <button type="button" class="sxq-font-btn ${this.prefs.fontSize === '115%' ? 'sxq-active' : ''}" data-size="115%" aria-label="Texto grande (115%)">
              A+
              <span class="label">115%</span>
            </button>
            <button type="button" class="sxq-font-btn ${this.prefs.fontSize === '130%' ? 'sxq-active' : ''}" data-size="130%" aria-label="Texto extra grande (130%)">
              A++
              <span class="label">130%</span>
            </button>
          </div>
        </div>

        <!-- Opções Extras (Foco e Movimento) -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="sxq-section-title">Preferências Visuais</div>
          <label class="sxq-switch-item" for="sxq-check-focus">
            <div class="sxq-switch-info">
              <span class="sxq-switch-label">Foco Visível Reforçado</span>
              <span class="sxq-switch-desc">Destaca o cursor de navegação por teclado em toda a tela</span>
            </div>
            <div class="sxq-toggle">
              <input type="checkbox" id="sxq-check-focus" ${this.prefs.focusVisible ? 'checked' : ''}>
              <span class="sxq-toggle-slider"></span>
            </div>
          </label>

          <label class="sxq-switch-item" for="sxq-check-motion">
            <div class="sxq-switch-info">
              <span class="sxq-switch-label">Reduzir Animações</span>
              <span class="sxq-switch-desc">Desativa transições dinâmicas para evitar desconforto visual</span>
            </div>
            <div class="sxq-toggle">
              <input type="checkbox" id="sxq-check-motion" ${this.prefs.reducedMotion ? 'checked' : ''}>
              <span class="sxq-toggle-slider"></span>
            </div>
          </label>
        </div>

        <!-- Atalhos de Teclado -->
        <div>
          <div class="sxq-section-title">Atalhos de Teclado</div>
          <div class="sxq-shortcuts-list">
            <div class="sxq-shortcut-item"><span>Dashboard</span><kbd>Alt + 1</kbd></div>
            <div class="sxq-shortcut-item"><span>Fones de Ouvido</span><kbd>Alt + 2</kbd></div>
            <div class="sxq-shortcut-item"><span>Inspeções</span><kbd>Alt + 3</kbd></div>
            <div class="sxq-shortcut-item"><span>Testes Técnicos</span><kbd>Alt + 4</kbd></div>
            <div class="sxq-shortcut-item"><span>Manutenção</span><kbd>Alt + 5</kbd></div>
            <div class="sxq-shortcut-item"><span>Painel de Acessibilidade</span><kbd>Alt + A</kbd></div>
            <div class="sxq-shortcut-item"><span>Painel de Suporte</span><kbd>Alt + S</kbd></div>
            <div class="sxq-shortcut-item"><span>Fechar Janela</span><kbd>Esc</kbd></div>
          </div>
        </div>
      </div>
      <footer class="sxq-panel__footer">
        <button type="button" class="btn btn--ghost btn--pequeno" id="sxq-btn-reset-a11y">
          ${ICONS.reset}
          <span>Restaurar Padrões</span>
        </button>
        <button type="button" class="btn btn--primario btn--pequeno" id="sxq-btn-ok-a11y">Pronto</button>
      </footer>
    `;
    document.body.appendChild(a11yPanel);

    // 4. Painel de Suporte
    const supportPanel = document.createElement('div');
    supportPanel.id = 'sxq-panel-support';
    supportPanel.className = 'sxq-panel';
    supportPanel.setAttribute('role', 'dialog');
    supportPanel.setAttribute('aria-modal', 'true');
    supportPanel.setAttribute('aria-labelledby', 'sxq-support-title');

    const cargoAtual = this.usuario?.cargo || 'Inspetor';

    supportPanel.innerHTML = `
      <header class="sxq-panel__header">
        <div class="sxq-panel__title-box">
          <span class="sxq-panel__icon">${ICONS.help}</span>
          <h3 class="sxq-panel__title" id="sxq-support-title">Centro de Suporte & Ajuda</h3>
        </div>
        <button type="button" class="sxq-panel__btn-close" id="sxq-close-support" aria-label="Fechar painel de suporte">
          ${ICONS.close}
        </button>
      </header>

      <nav class="sxq-tabs-nav" role="tablist" aria-label="Abas de suporte">
        <button type="button" class="sxq-tab-btn sxq-active" data-tab="faq" role="tab" aria-selected="true">Dúvidas (FAQ)</button>
        <button type="button" class="sxq-tab-btn" data-tab="tour" role="tab" aria-selected="false">Tour da Tela</button>
        <button type="button" class="sxq-tab-btn" data-tab="cargo" role="tab" aria-selected="false">Guia do Cargo</button>
        <button type="button" class="sxq-tab-btn" data-tab="contato" role="tab" aria-selected="false">Contato</button>
      </nav>

      <div class="sxq-panel__body">
        <!-- Aba 1: FAQ -->
        <div class="sxq-tab-content sxq-active" id="sxq-tab-faq" role="tabpanel">
          <div style="font-size: 0.85rem; color: var(--text-suave);">Perguntas frequentes para auxílio operacional na fábrica:</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${FAQ_DATA.map((item, idx) => `
              <div class="sxq-faq-item" id="faq-item-${idx}">
                <button type="button" class="sxq-faq-header" aria-expanded="false" data-faq="${idx}">
                  <span>${item.q}</span>
                  ${ICONS.chevronDown}
                </button>
                <div class="sxq-faq-body">${item.a}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Aba 2: Tour Guiado -->
        <div class="sxq-tab-content" id="sxq-tab-tour" role="tabpanel">
          <div class="sxq-tour-cta-card">
            <h4>${ICONS.tour} Conheça esta tela em detalhes</h4>
            <p>Inicie uma apresentação passo a passo interativa destacando os botões, tabelas e indicadores desta página.</p>
            <button type="button" class="btn btn--dourado btn--bloco" id="sxq-btn-start-tour">
              ${ICONS.tour}
              <span>Iniciar Tour Interativo</span>
            </button>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-suave); text-align: center;">
            Dica: você pode avançar os passos com as setas do teclado ou cancelar com <kbd>Esc</kbd>.
          </div>
        </div>

        <!-- Aba 3: Guia do Cargo -->
        <div class="sxq-tab-content" id="sxq-tab-cargo" role="tabpanel">
          <div class="sxq-role-card">
            <div class="sxq-role-card__header">
              <span class="sxq-role-card__title">Seu Perfil: ${cargoAtual}</span>
              <span class="badge badge--sucesso">Ativo</span>
            </div>
            <p style="font-size: 0.85rem; margin: 0;">Principais atividades esperadas para seu perfil operacional:</p>
            <ul class="sxq-role-list">
              ${this.obterAtividadesCargo(cargoAtual)}
            </ul>
          </div>

          <div style="display: flex; gap: 8px; flex-direction: column;">
            <a href="manual.html" class="btn btn--secundario btn--bloco" style="text-align: center;">
              ${ICONS.book}
              <span>Abrir Manual Completo do Usuário</span>
            </a>
            <a href="documentacao.html" class="btn btn--ghost btn--pequeno btn--bloco" style="text-align: center;">
              Documentação de Arquitetura e Engenharia
            </a>
          </div>
        </div>

        <!-- Aba 4: Contato / Chamado -->
        <div class="sxq-tab-content" id="sxq-tab-contato" role="tabpanel">
          <form class="sxq-contact-form" id="sxq-form-support">
            <div class="sxq-contact-field">
              <label for="sxq-sup-tipo">Tipo de Solicitação</label>
              <select id="sxq-sup-tipo" required>
                <option value="Dúvida Operacional">Dúvida Operacional</option>
                <option value="Problema Técnico / Bug">Problema Técnico / Bug</option>
                <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                <option value="Ajuda de Acessibilidade">Ajuda de Acessibilidade</option>
              </select>
            </div>
            <div class="sxq-contact-field">
              <label for="sxq-sup-msg">Descreva a solicitação ou erro</label>
              <textarea id="sxq-sup-msg" rows="4" placeholder="Ex: O fone SN-1020 não avança de etapa..." required></textarea>
            </div>
            <button type="submit" class="btn btn--primario btn--bloco">
              ${ICONS.mail}
              <span>Enviar para a Equipe de Suporte</span>
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(supportPanel);
  }

  obterAtividadesCargo(cargo) {
    const c = (cargo || '').toLowerCase();
    if (c.includes('inspetor')) {
      return `
        <li>Cadastrar novos lotes recebidos no menu Fones.</li>
        <li>Registrar conformidade visual e técnica em Inspeções.</li>
        <li>Encaminhar itens com defeito para a Manutenção.</li>
      `;
    }
    if (c.includes('técnico') || c.includes('tecnico')) {
      return `
        <li>Consultar chamados abertos na fila de Manutenção.</li>
        <li>Registrar peças substituídas e diagnósticos técnicos.</li>
        <li>Concluir reparos e reencaminhar fones aprovados para teste.</li>
      `;
    }
    if (c.includes('gerente')) {
      return `
        <li>Monitorar taxa de aprovação e métricas no Dashboard.</li>
        <li>Acompanhar histórico de manutenções e perdas.</li>
        <li>Exportar relatórios analíticos de produção de fones.</li>
      `;
    }
    // Admin / outros
    return `
      <li>Gerenciamento de usuários e permissões do sistema.</li>
      <li>Controle completo de fones, testes e manutenções.</li>
      <li>Supervisão geral dos relatórios de qualidade e auditoria.</li>
    `;
  }

  atualizarUIControles() {
    // Atualiza botões de contraste
    const btnPadrao = document.getElementById('sxq-opt-contrast-padrao');
    const btnAlto = document.getElementById('sxq-opt-contrast-alto');
    if (btnPadrao && btnAlto) {
      btnPadrao.classList.toggle('sxq-active', this.prefs.contrast === 'padrao');
      btnAlto.classList.toggle('sxq-active', this.prefs.contrast === 'alto');
    }

    // Atualiza botões de fonte
    document.querySelectorAll('.sxq-font-btn').forEach((btn) => {
      btn.classList.toggle('sxq-active', btn.dataset.size === this.prefs.fontSize);
    });

    // Atualiza checkboxes
    const chkFocus = document.getElementById('sxq-check-focus');
    const chkMotion = document.getElementById('sxq-check-motion');
    if (chkFocus) chkFocus.checked = this.prefs.focusVisible;
    if (chkMotion) chkMotion.checked = this.prefs.reducedMotion;
  }

  vincularEventos() {
    const btnFabA11y = document.getElementById('sxq-btn-fab-a11y');
    const btnFabSupport = document.getElementById('sxq-btn-fab-support');
    const overlay = document.getElementById('sxq-a11y-overlay');
    const closeA11y = document.getElementById('sxq-close-a11y');
    const closeSupport = document.getElementById('sxq-close-support');
    const btnOkA11y = document.getElementById('sxq-btn-ok-a11y');
    const btnResetA11y = document.getElementById('sxq-btn-reset-a11y');

    // Botões FAB
    if (btnFabA11y) {
      btnFabA11y.addEventListener('click', () => this.togglePainel('a11y'));
    }
    if (btnFabSupport) {
      btnFabSupport.addEventListener('click', () => this.togglePainel('support'));
    }

    // Fechar painéis
    [overlay, closeA11y, closeSupport, btnOkA11y].forEach((el) => {
      if (el) el.addEventListener('click', () => this.fecharPaineis());
    });

    // Restaurar padrões
    if (btnResetA11y) {
      btnResetA11y.addEventListener('click', () => this.restaurarPadroes());
    }

    // Contraste
    const btnContrastPadrao = document.getElementById('sxq-opt-contrast-padrao');
    const btnContrastAlto = document.getElementById('sxq-opt-contrast-alto');
    if (btnContrastPadrao) {
      btnContrastPadrao.addEventListener('click', () => {
        this.salvarPreferencia('contrast', 'padrao');
        this.atualizarUIControles();
      });
    }
    if (btnContrastAlto) {
      btnContrastAlto.addEventListener('click', () => {
        this.salvarPreferencia('contrast', 'alto');
        this.atualizarUIControles();
      });
    }

    // Tamanho da fonte
    document.querySelectorAll('.sxq-font-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sz = btn.dataset.size;
        this.salvarPreferencia('fontSize', sz);
        this.atualizarUIControles();
      });
    });

    // Switches foco e movimento
    const chkFocus = document.getElementById('sxq-check-focus');
    const chkMotion = document.getElementById('sxq-check-motion');
    if (chkFocus) {
      chkFocus.addEventListener('change', (e) => {
        this.salvarPreferencia('focusVisible', e.target.checked);
      });
    }
    if (chkMotion) {
      chkMotion.addEventListener('change', (e) => {
        this.salvarPreferencia('reducedMotion', e.target.checked);
      });
    }

    // Abas de suporte
    document.querySelectorAll('.sxq-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.sxq-tab-btn').forEach((b) => {
          b.classList.toggle('sxq-active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });
        document.querySelectorAll('.sxq-tab-content').forEach((panel) => {
          panel.classList.toggle('sxq-active', panel.id === `sxq-tab-${tabId}`);
        });
      });
    });

    // FAQ Accordion
    document.querySelectorAll('.sxq-faq-header').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.sxq-faq-item');
        const isOpen = item.classList.contains('sxq-expanded');
        item.classList.toggle('sxq-expanded', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen);
      });
    });

    // Tour Guiado Start
    const btnStartTour = document.getElementById('sxq-btn-start-tour');
    if (btnStartTour) {
      btnStartTour.addEventListener('click', () => {
        this.fecharPaineis();
        this.iniciarTour();
      });
    }

    // Formulário de Suporte
    const formSupport = document.getElementById('sxq-form-support');
    if (formSupport) {
      formSupport.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('sxq-sup-tipo')?.value || 'Dúvida';
        const msg = document.getElementById('sxq-sup-msg')?.value || '';
        const userEmail = this.usuario?.email || 'operador@soundx.com';
        const subject = encodeURIComponent(`[Suporte SoundX Quality] ${tipo} - ${this.usuario?.nome || 'Operador'}`);
        const body = encodeURIComponent(`Tipo: ${tipo}\nUsuário: ${this.usuario?.nome || 'N/A'} (${userEmail})\nCargo: ${this.usuario?.cargo || 'N/A'}\nPágina: ${window.location.pathname}\n\nDescrição:\n${msg}`);
        window.location.href = `mailto:suporte@soundxquality.com?subject=${subject}&body=${body}`;
        this.fecharPaineis();
      });
    }

    // Atalhos Globais de Teclado
    document.addEventListener('keydown', (e) => {
      // Ignora se estiver digitando em campos de texto
      const tag = (e.target.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (e.key === 'Escape') {
        if (this.painelAtivo) {
          this.fecharPaineis();
        } else if (document.getElementById('sxq-tour-card')) {
          this.encerrarTour();
        }
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'a') {
          e.preventDefault();
          this.togglePainel('a11y');
        } else if (key === 's') {
          e.preventDefault();
          this.togglePainel('support');
        } else if (key === '1') {
          e.preventDefault();
          window.location.href = 'dashboard.html';
        } else if (key === '2') {
          e.preventDefault();
          window.location.href = 'fones.html';
        } else if (key === '3') {
          e.preventDefault();
          window.location.href = 'inspecoes.html';
        } else if (key === '4') {
          e.preventDefault();
          window.location.href = 'testes.html';
        } else if (key === '5') {
          e.preventDefault();
          window.location.href = 'manutencao.html';
        }
      }
    });
  }

  togglePainel(tipo) {
    if (this.painelAtivo === tipo) {
      this.fecharPaineis();
    } else {
      this.abrirPainel(tipo);
    }
  }

  abrirPainel(tipo) {
    this.fecharPaineis();
    this.painelAtivo = tipo;
    this.ultimoElementoFocado = document.activeElement;

    const overlay = document.getElementById('sxq-a11y-overlay');
    const panel = document.getElementById(`sxq-panel-${tipo}`);
    const fabBtn = document.getElementById(`sxq-btn-fab-${tipo}`);

    if (overlay) overlay.classList.add('sxq-open');
    if (panel) {
      panel.classList.add('sxq-open');
      // Trap focus
      const focusable = panel.querySelector('button, input, [tabindex="0"]');
      if (focusable) focusable.focus();
    }
    if (fabBtn) {
      fabBtn.classList.add('sxq-active');
      fabBtn.setAttribute('aria-expanded', 'true');
    }
  }

  fecharPaineis() {
    this.painelAtivo = null;
    const overlay = document.getElementById('sxq-a11y-overlay');
    const panels = document.querySelectorAll('.sxq-panel');
    const fabBtns = document.querySelectorAll('.sxq-fab-btn');

    if (overlay) overlay.classList.remove('sxq-open');
    panels.forEach((p) => p.classList.remove('sxq-open'));
    fabBtns.forEach((b) => {
      b.classList.remove('sxq-active');
      b.setAttribute('aria-expanded', 'false');
    });

    if (this.ultimoElementoFocado && typeof this.ultimoElementoFocado.focus === 'function') {
      this.ultimoElementoFocado.focus();
    }
  }

  // ---------- TOUR GUIADO ----------
  iniciarTour() {
    const passos = TOUR_STEPS[this.paginaAtual] || TOUR_STEPS.dashboard;
    this.tourPassos = passos;
    this.tourPassoAtual = 0;
    this.executarPassoTour();
  }

  executarPassoTour() {
    this.limparSpotlights();

    if (this.tourPassoAtual >= this.tourPassos.length) {
      this.encerrarTour();
      return;
    }

    const passo = this.tourPassos[this.tourPassoAtual];
    let targetEl = null;

    // Tenta encontrar elemento válido
    const seletores = passo.target.split(',');
    for (const s of seletores) {
      const el = document.querySelector(s.trim());
      if (el && el.offsetParent !== null) {
        targetEl = el;
        break;
      }
    }

    if (!targetEl) targetEl = document.querySelector('.main-content') || document.body;

    targetEl.classList.add('sxq-tour-spotlight');
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    this.renderizarCardTour(targetEl, passo);
  }

  renderizarCardTour(targetEl, passo) {
    let card = document.getElementById('sxq-tour-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'sxq-tour-card';
      card.className = 'sxq-tour-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-live', 'polite');
      document.body.appendChild(card);
    }

    const total = this.tourPassos.length;
    const atual = this.tourPassoAtual + 1;

    card.innerHTML = `
      <div class="sxq-tour-card__header">
        <span class="sxq-tour-card__step">Passo ${atual} de ${total}</span>
        <button type="button" class="sxq-panel__btn-close" id="sxq-tour-close" aria-label="Sair do tour">
          ${ICONS.close}
        </button>
      </div>
      <h4 class="sxq-tour-card__title">${passo.title}</h4>
      <p class="sxq-tour-card__desc">${passo.desc}</p>
      <div class="sxq-tour-card__actions">
        <button type="button" class="btn btn--ghost btn--pequeno" id="sxq-tour-prev" ${atual === 1 ? 'disabled' : ''}>Anterior</button>
        <button type="button" class="btn btn--primario btn--pequeno" id="sxq-tour-next">
          ${atual === total ? 'Concluir' : 'Próximo'}
        </button>
      </div>
    `;

    // Posicionamento inteligente do card
    const rect = targetEl.getBoundingClientRect();
    const cardWidth = 330;
    const cardHeight = 180;
    let top = rect.bottom + 16;
    let left = rect.left;

    if (top + cardHeight > window.innerHeight) {
      top = Math.max(16, rect.top - cardHeight - 16);
    }
    if (left + cardWidth > window.innerWidth) {
      left = Math.max(16, window.innerWidth - cardWidth - 24);
    }

    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;

    // Ações do tour
    document.getElementById('sxq-tour-close')?.addEventListener('click', () => this.encerrarTour());
    document.getElementById('sxq-tour-prev')?.addEventListener('click', () => {
      this.tourPassoAtual--;
      this.executarPassoTour();
    });
    document.getElementById('sxq-tour-next')?.addEventListener('click', () => {
      this.tourPassoAtual++;
      this.executarPassoTour();
    });
  }

  limparSpotlights() {
    document.querySelectorAll('.sxq-tour-spotlight').forEach((el) => {
      el.classList.remove('sxq-tour-spotlight');
    });
  }

  encerrarTour() {
    this.limparSpotlights();
    const card = document.getElementById('sxq-tour-card');
    if (card) card.remove();
  }
}

// Instância global
export const a11yManager = new SoundXAccessibility();

// Função chamada por initShell em ui.js
export function initAccessibility(usuario = null, pagina = null) {
  a11yManager.init(usuario, pagina);
}

// Auto-inicialização quando carregado em páginas sem initShell
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      a11yManager.init();
    });
  } else {
    a11yManager.init();
  }
}
