# SoundX Quality — Correções Aplicadas

> Registro das correções executadas a partir de [`ANALISE-PRIORIDADES.md`](./ANALISE-PRIORIDADES.md).
> Análises originais: [`ANALISE-FRONTEND.md`](./ANALISE-FRONTEND.md) e [`ANALISE-BACKEND.md`](./ANALISE-BACKEND.md).
>
> **Importante:** as alterações foram validadas com `node --check` (sintaxe). A aplicação **não foi executada** porque `backend/node_modules` não está instalado e `local_data.json` não existe.

---

## Resumo

| Prioridade | Item | Status |
|---|---|---|
| P0 | Queries de manutenção com placeholders errados | ✅ Corrigido |
| P0 | Queries de inspeções com placeholders errados | ✅ Corrigido |
| P0 | Import inválido do Chart.js | ✅ Corrigido |
| P0 | `escapeHtml` não escapa aspas (XSS) | ✅ Corrigido |
| P1 | Fallback JSON não persiste alterações | ✅ Corrigido |
| P1 | Auth não revalida usuário/ativo/cargo | ✅ Corrigido |
| P1 | Senhas em texto plano | ✅ Migração para bcrypt no login |
| P1 | Matriz de permissões inconsistente | ✅ Alinhada |
| P1 | Busca/paginação do Histórico | ✅ Corrigida |
| P1 | CORS permissivo | ✅ Restringido |
| P2 | Status do fone não reconciliado | ✅ Corrigido (exclusão de OS) |
| P2 | KPIs e filtro de 90 dias | ✅ Corrigidos |
| P2 | Reset administrativo no PostgreSQL | ✅ Implementado |
| P2 | `ensureSchema` não cria tabelas | ✅ Implementado |
| P2 | `23505` no update de fone | ✅ Corrigido |
| P2 | `userAuthController` vaza `error.message` | ✅ Corrigido |
| P2 | `helmet`/CSP/rate limiting | ⏳ Pendente (requer dependências) |
| P2 | Bloquear fallback `/tmp` no Vercel | ⏳ Pendente (decisão de deploy) |
| P3 | 404 JSON para `/api/*` | ✅ Implementado |
| P3 | Validação TLS do PostgreSQL | ✅ Configurável |
| P3 | `guardPagina` por substring | ✅ Corrigido |
| P3 | `config.js` em domínio customizado | ⏳ Pendente |
| P3 | Paginação em `/fones` e `/users` | ⏳ Pendente |
| P3 | `docs.js` / `documentacao.html` | ⏳ Pendente |

---

## Backend

### 1. Listagem de manutenções (`manutencaoController.js`)

- `WHERE` montado dinamicamente com `condicoes[]` + `filtros[]`.
- O mesmo conjunto de filtros é usado no `count` e na consulta paginada.
- Filtros agora realmente aplicados: `de`, `ate`, `status`, `id_fone`, `id_tecnico`, `prioridade`.
- `id_tecnico` usa `? IN (m.concluido_por, m.solicitado_por)` (1 parâmetro).
- **Arquivo:** `backend/src/controllers/manutencaoController.js:102-151`

### 2. Listagem de inspeções (`inspecaoController.js`)

- Mesmo padrão de `WHERE` dinâmico.
- Novo filtro `q` (busca textual em série, modelo, observação e inspetor).
- Filtro `inspetor` passou a usar `LOWER(func.nome) LIKE LOWER(?)`.
- **Arquivo:** `backend/src/controllers/inspecaoController.js:290-360`

### 3. Provedor local (`database.js`)

- `atualizarInspecao`: lê os 4 parâmetros corretamente e grava `foto_url`.
- `assumirManutencao`: mapeamento adicionado para `status` + `concluido_por`.
- Atualizações de status do fone com valor literal agora são mapeadas.
- Consultas de reconciliação adicionadas:
  - `SELECT ... FROM inspecao WHERE id_fone = ?`
  - `SELECT ... FROM inspecao` (todas, usada no FPY)
  - `SELECT ... FROM manutencao WHERE id_manutencao = ?` (mais flexível)
- Consumo de parâmetros das listagens agora é baseado nas condições presentes no SQL (não em posição fixa).
- Queries de `count` deixaram de ser capturadas pelos padrões de listagem.
- **Arquivo:** `backend/src/config/database.js`

### 4. Autenticação (`authMiddleware.js` / `authController.js`)

- O middleware agora busca o funcionário no banco a cada requisição:
  - valida existência;
  - valida `ativo`;
  - usa o **cargo atual** do banco.
- Login normaliza e-mail (`trim` + `toLowerCase`).
- Senhas legadas em texto plano são aceitas **uma única vez** e imediatamente regravadas como hash bcrypt.
- Seeds novos já nascem com hash (`getInitialData` e reset administrativo).
- `loadLocalData` migra automaticamente senhas em texto plano de `local_data.json`.
- **Arquivos:** `backend/src/middlewares/authMiddleware.js`, `backend/src/controllers/authController.js`, `backend/src/config/database.js`

### 5. Permissões (`roleMiddleware.js` + rotas)

- Removido o bypass implícito de Admin no `checkRole`.
- Admin passou a ser listado **explicitamente** nas rotas onde deve ter acesso:
  - `foneRoutes.js` (POST/PUT);
  - `inspecaoRoutes.js` (POST/PUT);
  - `testeRoutes.js` (POST/PUT/DELETE).
- Gerente passou a ter acesso explícito às rotas de testes (coerente com o menu e a página).
- **Arquivos:** `backend/src/middlewares/roleMiddleware.js`, `backend/src/routes/*.js`

### 6. CORS (`app.js`)

- Lista explícita de origens (`origensPermitidas`).
- Suporte a `CORS_ORIGINS` (separado por vírgulas) e `FRONTEND_URL`.
- Em desenvolvimento, aceita apenas `localhost`/`127.0.0.1` reais (regex), não qualquer host que contenha a palavra.
- Removido o middleware `OPTIONS` que refletia qualquer `Origin`.
- **Arquivo:** `backend/src/app.js:23-75`

### 7. Exclusão de manutenção (`manutencaoController.js`)

- A exclusão agora roda em transação.
- Se não restarem OS abertas para o fone, o status é recalculado com base na última inspeção:
  - `Aprovado` → `Aprovado`;
  - demais → `Reprovado / Manutenção`;
  - sem inspeções → `Aguardando inspeção`.
- **Arquivo:** `backend/src/controllers/manutencaoController.js:268-311`

### 8. Dashboard (`inspecaoController.js`)

- `fones_reprovados` agora conta apenas `status LIKE 'Reprovado%'` (não inclui `Em Análise`).
- FPY calculado pela **primeira inspeção** de cada fone, exposto em `fpy`.
- Série histórica aceita `?dias=` (1 a 365) em vez de fixar 30 dias.
- **Arquivo:** `backend/src/controllers/inspecaoController.js`

### 9. Reset administrativo (`app.js`)

- Em PostgreSQL, executa `TRUNCATE TABLE teste, inspecao, manutencao, fone RESTART IDENTITY CASCADE`.
- Mantém os usuários.
- No modo local, continua reescrevendo o JSON, agora com senhas em bcrypt.
- **Arquivo:** `backend/src/app.js:115-164`

### 10. Schema e conexão (`database.js`)

- `ensureSchema` agora executa `CREATE TABLE IF NOT EXISTS` para as 5 tabelas.
- Seed inicial de funcionários com senha em bcrypt.
- TLS do PostgreSQL configurável:
  - valida certificado por padrão;
  - `DATABASE_SSL=false` desliga SSL;
  - `DATABASE_SSL_REJECT_UNAUTHORIZED=false` relaxa a validação (somente se necessário).
- **Arquivo:** `backend/src/config/database.js`

### 11. Outros ajustes

- `foneController.js`: update agora trata `23505` (duplicidade no PostgreSQL).
- `userAuthController.js`: mensagens em português, sem `error.message`, e validação de hash.
- `app.js`: 404 JSON para `/api/*`.

---

## Frontend

### 12. Chart.js (`charts.js` + HTMLs)

- `charts.js` não importa mais o UMD como módulo.
- Usa `window.Chart`, com erro explícito caso o script não tenha sido carregado.
- `dashboard.html` e `historico.html` carregam `assets/vendor/chart.umd.js` via `<script>` antes do módulo.
- **Arquivos:** `frontend/js/charts.js`, `frontend/dashboard.html`, `frontend/historico.html`

### 13. XSS (`ui.js` + `manutencao-solicitar.js`)

- `escapeHtml` agora codifica `&`, `<`, `>`, `"` e `'`.
- Campos de fone em `manutencao-solicitar.js` passaram a usar `escapeHtml`.
- **Arquivos:** `frontend/js/ui.js:281-292`, `frontend/js/pages/manutencao-solicitar.js:59-68`

### 14. Histórico (`historico.js`)

- Busca textual agora é enviada como `q`.
- Removido o filtro client-side que só olhava a página atual.
- `totalRegistros` usa o `total` retornado pela API.
- **Arquivo:** `frontend/js/pages/historico.js:49-84`

### 15. Dashboard (`dashboard.js`)

- Filtro de período busca `?dias=7|30|90` na API.
- A série não é mais cortada artificialmente no cliente.
- KPI de FPY usa `gerais.fpy`.
- **Arquivo:** `frontend/js/pages/dashboard.js`

### 16. Permissões (`auth.js` + `ui.js` + páginas)

- `guardPagina` agora exige correspondência exata de cargo, inclusive para Admin/Gerente.
- Novo helper `isAdmin(cargo)`.
- Menu lateral mostra apenas itens permitidos ao cargo.
- Botões de exclusão aparecem apenas para Admin (coerente com as rotas).
- **Arquivos:** `frontend/js/auth.js`, `frontend/js/ui.js`, `frontend/js/pages/fones.js`, `inspecoes.js`, `manutencao.js`

### 17. Alteração de senha (`alterar-senha.js`)

- Passou a aceitar `data.mensagem` (padrão da API) e mantém compatibilidade com `data.message`.

---

## Como validar

1. Instalar dependências:
   ```bash
   cd backend
   npm install
   ```
2. Subir a API:
   ```bash
   npm run dev
   ```
3. Testar os fluxos abaixo:
   - `GET /api/manutencao?pagina=1&limite=20&status=Pendente` → 200.
   - `GET /api/inspecoes?pagina=1&limite=15&q=SoundX` → 200 com `total`.
   - Login com `admin@soundx.com` / `1234` → deve funcionar e migrar a senha para hash.
   - Abrir `dashboard.html` e `historico.html` → gráficos renderizam.
   - Cadastrar um nome com `"` e `<script>` → nada é injetado.
   - Entrar como Gerente → não deve ver “Cadastrar Usuário” nem botões de exclusão.
   - Excluir a última OS de um fone → status do fone é recalculado.

---

## Pendências conscientes

| Item | Motivo |
|---|---|
| `helmet`, CSP e rate limiting | Exige adicionar dependências (`helmet`, `express-rate-limit`) e validar a CSP com o front. |
| Bloquear fallback `/tmp` no Vercel | Pode inviabilizar um deploy de demonstração sem `DATABASE_URL`; precisa de decisão de produto. |
| Paginação em `/fones` e `/users` | Mudança de contrato da API e da UI; melhor tratar em um passo dedicado. |
| `config.js` em domínio customizado | Depende da estratégia de deploy (env de build por ambiente). |
| `docs.js` / `documentacao.html` | Conteúdo desatualizado; requer revisão editorial. |

---

## Observações técnicas

- **`? IN (col1, col2)`**: válido em PostgreSQL e MySQL; mantém 1 parâmetro para o filtro de técnico.
- **`DATE(coluna)`**: usado para comparar apenas a parte da data, compatível com PostgreSQL e MySQL.
- **Migração de senhas**: acontece no login e no carregamento do `local_data.json`; depois disso, o fallback em texto plano deixa de ser necessário.
- **Chart.js**: a ordem dos scripts é importante — o UMD precisa vir antes do módulo da página.
- **`tests` legados**: `test-backend.js` ainda tenta reverter a senha para `1234`; com a política mínima de 6 caracteres, esse trecho continua falhando (comportamento anterior à correção).
