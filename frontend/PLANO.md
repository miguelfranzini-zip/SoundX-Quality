# 📐 Plano de Implementação — Front-end SoundX Quality

Plano completo para construção da interface web do **SoundX Quality**, seguindo o Design System oficial (Cores, Tipografia, Gradientes e Logotipo) e integrada à API REST existente em `backend/`.

---

## 1. Visão Geral

| Item | Definição |
| --- | --- |
| **Objetivo** | Interface web completa para controle de qualidade, testes técnicos e manutenção de fones de ouvido |
| **Público** | Inspetores, Técnicos de Manutenção, Gerentes/Admins |
| **Stack** | HTML5 + CSS3 + JavaScript (vanilla, sem framework) |
| **Comunicação** | `fetch` + API REST (`/api/*`), autenticação JWT (Bearer) |
| **Base** | Design System SoundX (creme/laranja/dourado/marrom; Garet + Muli) |

### 1.1 Premissas
- Back-end pronto e em execução em `http://localhost:3000` (rotas protegidas por JWT + RBAC).
- Fonte Garet disponível via CDN (Fontshare); Muli via Google Fonts.
- Logos disponíveis: `2.png`, `3.png`, `4.png`, `5.png`, `6.png` (raiz do projeto).
- Front-end servido estaticamente pelo Express ou por Live Server, sem build tooling.

---

## 2. Estrutura de Pastas

```
frontend/
├── index.html                    # Tela de Login
├── dashboard.html
├── fones.html                    # Lista de fones
├── fone-historico.html           # Rastreabilidade completa de um fone
├── fone-cadastro.html            # Cadastro de novo fone
├── inspecoes.html                # Lista de inspeções
├── inspecao-form.html            # Nova inspeção + checklist de testes
├── testes.html                   # Cadastro/associação de testes a inspeção
├── manutencao.html               # Fila de manutenção + atualização de reparo
├── acesso-negado.html            # Página 403
├── css/
│   ├── tokens.css                # Variáveis de design (cores, tipografia, sombras, raios, espaçamento)
│   ├── base.css                  # Reset, tipografia global, fundos, utilitários
│   ├── layout.css                # Shell (sidebar + topbar + main), grid responsivo
│   └── components.css            # Buttons, cards, tables, forms, badges, modal, toast, skeleton, kpi
├── js/
│   ├── config.js                 # URL da API, tempo de expiração do token
│   ├── api.js                    # Wrapper fetch: token, headers, erros 401/403/500
│   ├── auth.js                   # Login, logout, sessão, guard de rotas por cargo
│   ├── ui.js                     # Render de sidebar, toasts, helpers de DOM e formatação
│   └── pages/
│       ├── login.js
│       ├── dashboard.js
│       ├── fones.js
│       ├── fone-historico.js
│       ├── fone-cadastro.js
│       ├── inspecoes.js
│       ├── inspecao-form.js
│       ├── testes.js
│       └── manutencao.js
└── assets/
    └── logo/                     # Cópias das versões do logo para uso no front
```

---

## 3. Design System (Tokens CSS)

### 3.1 Cores
```css
:root {
  --creme:          #FEEFCE;
  --off-white:      #FFF8E8;
  --laranja:        #FF9800;
  --dourado:        #FFBD2B;
  --marrom:         #602100;
  --marrom-profundo:#290E00;
  --terracota:      #BB7A59;

  --bg-base:        var(--creme);
  --bg-alternativo: var(--off-white);

  /* Estados / semanticos */
  --sucesso: #2E7D32;
  --atencao: #FF9800;
  --erro:    #C62828;
}
```

### 3.2 Gradientes
```css
--grad-base:   linear-gradient(135deg, #FEEFCE, #FFCA7B);
--grad-energia:linear-gradient(135deg, #FC9C2E, #FCC045);
--grad-suave:  linear-gradient(135deg, #FFC481, #FFDA8D);
--grad-dark:   linear-gradient(135deg, #5F2407, #BA7C5D);
--grad-forte:  linear-gradient(135deg, #FF9800, #602100);
```
**Regra de uso:** gradientes pontuais (banners, KPIs, capas), nunca como preenchimento total do layout.

### 3.3 Tipografia
```css
--font-display: 'Garet', sans-serif;
--font-text:    'Muli', sans-serif;
```
| Elemento | Fonte | Peso |
| --- | --- | --- |
| Display / H1 | Garet | Bold |
| H2 | Garet | Semibold |
| H3 / Cards | Garet | Medium/Semibold |
| KPIs / Números | Garet | Bold |
| Botões / Menus / Labels | Muli | Semibold/Bold |
| Texto / Legenda / Dados | Muli | Regular |

### 3.4 Sombras, Raios e Espaçamento
```css
--shadow-sm: 0 1px 3px rgba(41,14,0,.10);
--shadow-md: 0 4px 12px rgba(41,14,0,.12);
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
```

### 3.5 Regras de UI
- **Priorizar:** espaços negativos, tipografia forte, grandes blocos cromáticos, contraste creme↔marrom.
- **Evitar:** sombras exageradas, gradientes aleatórios, excesso de cores, poluição visual.
- Laranja = **ação/CTA**. Dourado = **energia/destaque**. Marrom escuro = **títulos/alto contraste**.
- Fundos escuros institucionais: usar `--marrom-profundo` (sidebar ativa, footer, capas).

---

## 4. Autenticação e RBAC

### 4.1 Fluxo de Login
1. Tela `index.html` → `POST /api/auth/login` com `email` e `senha`.
2. Situação de sucesso: salvar `token` e `usuario` no `localStorage`.
3. Guard de rotas (`auth.js`) redireciona por cargo:
   - `Inspetor` → `inspecoes.html`
   - `Técnico` → `manutencao.html`
   - `Admin` / `Gerente` → `dashboard.html`

### 4.2 Interceptador de API (`api.js`)
```js
async function api(path, { method = 'GET', body } = {}) {
  const token = session.token;
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { logout(); location.href = 'index.html'; throw new Error('Sessão expirada'); }
  if (res.status === 403) { location.href = 'acesso-negado.html'; throw new Error('Acesso negado'); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.mensagem || 'Erro na requisição'); }
  return res.json();
}
```

### 4.3 Controle de Menus por Cargo
| Menu | Inspetor | Técnico | Admin/Gerente |
| --- | :---: | :---: | :---: |
| Dashboard | ✅ | ❌ | ✅ |
| Fones | ✅ | ❌ | ✅ |
| Inspeções | ✅ | ❌ | ✅ |
| Testes | ✅ | ❌ | ✅ |
| Manutenção | ❌ | ✅ | ✅ |

> **Importante:** o bloqueio real é feito no back-end (RBAC). O front apenas esconde menus — o `403` é tratado centralmente no `api.js`.

---

## 5. Layout Shell

### 5.1 Estrutura
```
+-----------------------------------------------+
| SIDEBAR (logo + menu por cargo)  |  TOPBAR     |
|                                  |  (título +  |
|                                  |  usuário)   |
|                                  +-------------+
|                                  |             |
|              MAIN CONTENT        |   CONTEÚDO  |
|                                  |             |
+-----------------------------------------------+
```
- **Sidebar:** fundo `--off-white` ou marrom-profundo, logo no topo, menu vertical, versão mobile em drawer (hambúrguer).
- **Topbar:** título da seção atual, usuário logado com avatar inicial e dropdown "Sair".
- **Main:** fundo `--creme`, conteúdo em cards brancos/off-white.

### 5.2 Responsividade
- **Desktop (>1024px):** sidebar fixa + conteúdo.
- **Tablet (768–1024px):** sidebar recolhida (ícones).
- **Mobile (<768px):** sidebar em drawer, cards empilhados, tabelas com scroll horizontal.

---

## 6. Componentes Reutilizáveis

| Componente | Descrição |
| --- | --- |
| `Button` | Primário (laranja), secundário (outline marrom), danger, ghost, loading state |
| `Card` | Superfície off-white com sombra `--shadow-sm`, radius `--radius-md` |
| `KpiCard` | Número Garet Bold grande + label Muli + gradiente opcional (energia) |
| `Table` | Cabeçalho marrom escuro, zebra leve, hover, badges de status |
| `Badge/StatusPill` | Aguardando inspeção, Em inspeção, Aprovado, Reprovado / Manutenção, Em manutenção, Em Análise, Concluído, Concluido |
| `FormField` | Label (Muli Semibold) + input/select/textarea com foco laranja |
| `Modal` | Reuso para confirmações e formulários rápidos |
| `Toast` | Feedback de sucesso/erro (topo ou canto, com fade) |
| `ToastEmptyState` | Ilustração + mensagem quando não há dados |
| `Skeleton` | Placeholder de carregamento ao buscar da API |
| `SearchInput` | Busca com debounce |
| `Pagination` | Navegação de listas longas |
| `Avatar` | Iniciais do usuário + dropdown |

---

## 7. Telas e Funcionalidades (detalhamento)

### 7.1 Login (`index.html`)
- Card centralizado com logo, campos `email` e `senha`, botão "Entrar" (laranja).
- Validação client-side (email válido, senha não vazia).
- Tratamento de erro: 401 → mensagem de credenciais inválidas.
- Redirecionamento por cargo após login.

### 7.2 Dashboard (`dashboard.html`)
- **KPIs (topo):** total de inspeções, aprovados, reprovados, taxa de aprovação (%).
- Fonte: `GET /api/inspecoes/dashboard`.
- Cards de KPI com gradientes oficiais (energia/fraco).
- Estados: loading (skeleton), vazio (empty state), erro (toast + retry).

### 7.3 Fones (`fones.html`)
- Lista com busca por número de série/modelo (`SearchInput` com debounce).
- Colunas: nº de série, modelo, marca, conexão, status (badge), data de fabricação.
- Ações por linha: "Histórico" → `fone-historico.html?id=X`.
- Botão "Novo Fone" → `fone-cadastro.html`.
- Dados de `GET /api/fones`.

### 7.4 Cadastro de Fone (`fone-cadastro.html`)
- Formulário: `numero_serie`, `modelo`, `marca`, `tipo_conexao`, `data_fabricacao`, `status`.
- Validação: `numero_serie` e `modelo` obrigatórios.
- Envio: `POST /api/fones` → toast sucesso → redirecionar para `fones.html`.
- Erro `ER_DUP_ENTRY` já mapeado pelo back como 400.

### 7.5 Histórico do Fone (`fone-historico.html`)
- Cabeçalho com dados do fone + status atual.
- Abas/seções: **Inspeções**, **Testes**, **Manutenções** (ordem cronológica).
- Destaques: contador `total_inspecoes`.
- Fonte: `GET /api/fones/:id/historico`.

### 7.6 Inspeções (`inspecoes.html`)
- Lista de inspeções (`GET /api/inspecoes`), colunas: data, fone, resultado, observação, inspetor.
- Botão "Nova Inspeção" → `inspecao-form.html`.
- Link para histórico do fone a partir da linha.

### 7.7 Nova Inspeção (`inspecao-form.html`)
- Select de fone (carregado de `GET /api/fones` limitado/ordenado).
- Campos: `resultado_final` (select: Aprovado / Reprovado / Reprovado / Manutenção), `observacao` (textarea).
- Envio: `POST /api/inspecoes` → usa `id_funcionario` do token (back).
- Após criar, opção de **associar testes** à inspeção recém-criada (encaminha a `testes.html?inspecao=ID`).

### 7.8 Testes (`testes.html`)
- Modo A: associar teste a uma inspeção (`POST /api/testes`) — selecionar inspeção (preenchido por query param quando vindo de inspecao-form).
- Modo B: listar testes de uma inspeção (`GET /api/testes/inspecao/:id_inspecao`).
- Campos de teste conforme retorno do catálogo (nome/parametros e resultado).

### 7.9 Manutenção (`manutencao.html`)
- Fila: `GET /api/manutencao/fila` (join com fone já feito no back).
- Colunas: fone, modelo/nº série, defeito, data de entrada, status.
- Ação "Concluir/Atualizar": modal com `status` (select) e `acao_corretiva` (textarea).
- Envio: `PUT /api/manutencao/:id` → atualiza fila imediatamente (refetch) e ativa o fluxo de reteste no back.

### 7.10 Acesso Negado (`acesso-negado.html`)
- Página 403 amigável com iconografia, botão "Voltar" e botão "Login".

---

## 8. Padrões de Código

- **Módulos ES6:** `type="module"` nos scripts de página; cada página `import { onLoad() }`.
- **fetch sempre via `api.js`** (nunca `fetch` solto fora do wrapper).
- **Nomes:** `kebab-case` para arquivos, `camelCase` para funções/variáveis, constantes em `UPPER_SNAKE`.
- **Funções:** uma responsabilidade, nome descritivo (`renderTable`, `formatDate`, `toast`).
- **Segurança:** nunca exibir/logar token; limpar `localStorage` no logout.
- **Acessibilidade:** labels nos form fields, `alt` nas imagens/logo, contraste AA (marrom sobre creme), estados de foco visíveis (laranja).
- **Comentários:** apenas quando necessário (instrução global do projeto: minimizar).

---

## 9. Estados de Interface

Toda tela com dados assíncronos deve tratar 3 estados:
1. **Loading:** skeletons ou spinner laranja.
2. **Success:** conteúdo renderizado.
3. **Error/Empty:** toast de erro + empty state quando `[]`.

Padrão usado nos controllers de página:
```
carregar();   -> showSkeleton()
render(data); -> hideSkeleton(), render content
falha(err);   -> toast(err.message), hideSkeleton()
```

---

## 10. Fases de Implementação

### Fase 0 — Fundação (meio dia)
- Criar `frontend/` com estrutura, `tokens.css`, `base.css`.
- Incluir fontes (Garet/Muli), logos, página `acesso-negado.html`.
- Estilo do shell: sidebar + topbar responsivos com HTML/CSS estático.

### Fase 1 — Autenticação (1 dia)
- `config.js`, `api.js`, `auth.js`, `ui.js`.
- `index.html` + `login.js` (login, logout, guard de rotas).
- Integração com `POST /api/auth/login` e tratamento 401.

### Fase 2 — Dashboard (meio dia)
- `dashboard.html` + `dashboard.js`, KPIs com gradientes.
- Integração `GET /api/inspecoes/dashboard` + estados de carregamento.

### Fase 3 — Módulo Fones (1 dia)
- `fones.html`, `fone-cadastro.html`, `fone-historico.html` + respectivos controllers.
- Busca com debounce, badges de status, navegação entre telas, histórico.

### Fase 4 — Módulo Inspeções e Testes (1–2 dias)
- `inspecoes.html`, `inspecao-form.html`, `testes.html` + controllers.
- Fluxo: criar inspeção → associar testes.
- Validações de formulário e mapeamento de erros da API.

### Fase 5 — Módulo Manutenção (1 dia)
- `manutencao.html` + `manutencao.js`.
- Fila, modal de atualização, refetch e feedback de status.

### Fase 6 — Responsividade e Polimento (1 dia)
- Ajustar breakpoints (desktop/tablet/mobile), tabelas horizontais, drawer mobile.
- Micro-interações (hover, foco), transições suaves, empty states.

### Fase 7 — Testes Finais e QA (1 dia)
- Fluxos completos com os 3 perfis (Inspetor, Técnico, Admin) testando bloqueio RBAC (403).
- Testes nos 3 navegadores (Chrome, Edge, Firefox).
- Testes de responsividade e RNF01 (tempo de resposta visualmente < 3s).

---

## 11. Checklist de Testes Manuais

- [ ] Login com cargo correto redireciona para a tela certa (Inspetor/Técnico/Admin).
- [ ] Inspetor consegue criar inspeção e testes; Técnico não (recebe 403 → página acesso negado).
- [ ] Técnico vê fila e consegue concluir manutenção; Inspetor não (403).
- [ ] Admin/Gerente acessam todas as telas.
- [ ] Histórico do fone mostra inspeções + testes + manutenções corretamente.
- [ ] Cadastro de fone valida obrigatórios e duplicidade (400 com mensagem).
- [ ] Token expirado/inválido → logout automático e retorno ao login (401).
- [ ] Conexão recusada (servidor offline) → toast de erro amigável.
- [ ] Responsividade em 375px, 768px e 1366px.

---

## 12. Extensões Futuras (requerem evolução do back-end)
| Funcionalidade | Requisito | Endpoint sugerido |
| --- | --- | --- |
| CRUD de usuários e permissões | RF05, RF16 | `GET/POST/PUT/DELETE /api/funcionarios` |
| Cadastro de critérios/testes | RF06 | `CRUD /api/testes-catalogo` |
| Relatórios analíticos (export PDF/CSV) | RF13 | `GET /api/relatorios` |
| Upload de evidências fotográficas | RF10, RNF09 | `POST /api/inspecoes/:id/evidencias` (multer) |
| Lotes de inspeção | RF04 | `CRUD /api/lotes` |
| Editar/Excluir fone | RF02, RF03 | `PUT/DELETE /api/fones/:id` |
| Paginação server-side | — | query `?page=&limit=` nas listas |

---

## 13. Estimativa Total
| Fase | Tempo estimado |
| --- | --- |
| Fase 0 | 0,5 dia |
| Fase 1 | 1 dia |
| Fase 2 | 0,5 dia |
| Fase 3 | 1 dia |
| Fase 4 | 1–2 dias |
| Fase 5 | 1 dia |
| Fase 6 | 1 dia |
| Fase 7 | 1 dia |
| **Total** | **≈ 7–9 dias** |