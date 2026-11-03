# SoundX Quality — Plano de Prioridades

> Plano de ação ordenado a partir das análises do projeto.
> Detalhes completos: [`ANALISE-FRONTEND.md`](./ANALISE-FRONTEND.md) e [`ANALISE-BACKEND.md`](./ANALISE-BACKEND.md).
>
> **Contexto:** revisão estática — a aplicação não foi executada porque `backend/node_modules` não está instalado e `local_data.json` não existe.

---

## Como ler este documento

| Campo | Significado |
|---|---|
| **Prioridade** | Ordem de execução (P0 = agora, P3 = quando sobrar tempo) |
| **Impacto** | O que o usuário/sistema sente hoje |
| **Esforço** | Estimativa relativa (baixo / médio / alto) |
| **Depende de** | O que precisa estar pronto antes |

Regra prática: **P0 e P1 destravam telas e protegem dados**. **P2 melhora consistência**. **P3 é higiene.**

---

## Visão geral

| # | Prioridade | Item | Área | Esforço |
|---|---|---|---|---|
| 1 | P0 | Queries de manutenção com placeholders errados | Backend | Baixo |
| 2 | P0 | Queries de inspeções com placeholders errados | Backend | Baixo |
| 3 | P0 | Import inválido do Chart.js derruba Dashboard/Histórico | Frontend | Baixo |
| 4 | P0 | `escapeHtml` não escapa aspas (XSS armazenado) | Frontend | Baixo |
| 5 | P1 | Fallback JSON não persiste alterações | Backend | Médio |
| 6 | P1 | Auth não revalida usuário/ativo/cargo no banco | Backend | Médio |
| 7 | P1 | Senhas em texto plano e login sem rate limit | Backend | Médio |
| 8 | P1 | Matriz de permissões inconsistente (API × UI) | Full-stack | Médio |
| 9 | P1 | Busca/paginação do Histórico quebradas | Frontend | Médio |
| 10 | P1 | CORS permissivo | Backend | Baixo |
| 11 | P2 | Status do fone não reconciliado (exclusão/edição) | Backend | Médio |
| 12 | P2 | KPIs e filtro de 90 dias incorretos | Frontend + Backend | Médio |
| 13 | P2 | Reset administrativo inócuo no PostgreSQL | Backend | Médio |
| 14 | P2 | `ensureSchema` não cria tabelas | Backend | Baixo |
| 15 | P2 | Fallback `/tmp` no Vercel (perda de dados) | Backend | Baixo |
| 16 | P2 | Tratamento de `23505` no update de fone | Backend | Baixo |
| 17 | P2 | `helmet`, CSP e rate limiting | Backend | Médio |
| 18 | P2 | `userAuthController` vaza `error.message` | Backend | Baixo |
| 19 | P3 | 404 JSON para `/api/*` | Backend | Baixo |
| 20 | P3 | Validação TLS do PostgreSQL | Backend | Baixo |
| 21 | P3 | `guardPagina` por substring | Frontend | Baixo |
| 22 | P3 | `config.js` em domínio customizado | Frontend | Baixo |
| 23 | P3 | Paginação em `/fones` e `/users` | Full-stack | Médio |
| 24 | P3 | `docs.js` / `documentacao.html` desatualizados | Frontend | Baixo |

---

## P0 — Destravar o que está quebrado hoje

### 1. Corrigir placeholders de `GET /api/manutencao`

- **Arquivo:** `backend/src/controllers/manutencaoController.js:102-135`
- **Problema:** count com 0 placeholders e 6 params; consulta com 2 placeholders e 8 params; filtros ignorados.
- **Efeito:** HTTP 500 em toda listagem no PostgreSQL.
- **Ação:** montar `WHERE` dinâmico com `condicoes[]` e `params[]`, aplicando o mesmo conjunto no `count` e na consulta paginada.
- **Aceite:** `GET /api/manutencao?pagina=1&limite=20&status=Pendente` retorna 200 no PG com o filtro aplicado.

### 2. Corrigir placeholders de `GET /api/inspecoes`

- **Arquivo:** `backend/src/controllers/inspecaoController.js:272-305`
- **Problema:** mesmo padrão do item 1 (count 5/0, consulta 7/2).
- **Efeito:** tela de inspeções falha no PG.
- **Ação:** mesma estratégia do item 1.
- **Aceite:** listagem paginada e filtrada retorna 200 e o `total` correto.

### 3. Corrigir import do Chart.js

- **Arquivo:** `frontend/js/charts.js:7`
- **Problema:** `import Chart from '../assets/vendor/chart.umd.js'` — UMD sem exportações ESM.
- **Efeito:** `dashboard.html` e `historico.html` quebram por inteiro.
- **Ação:** carregar o UMD via `<script>` e usar `window.Chart`, ou trocar para o build ESM oficial.
- **Aceite:** Dashboard e Histórico carregam sem erro no console e os gráficos renderizam.

### 4. Corrigir `escapeHtml`

- **Arquivo:** `frontend/js/ui.js:281-284`
- **Problema:** não escapa `"` nem `'`, mas o retorno é usado em atributos HTML.
- **Efeito:** XSS armazenado via nome/observação/URL, com risco de roubo do token em `localStorage`.
- **Ação:** substituir por uma função que escape `& < > " '`; revisar usos em `data-*`, `title`, `href` e `value`; escapar também os campos em `manutencao-solicitar.js:59-68`.
- **Aceite:** cadastrar um nome com `"` e `<script>` não injeta atributos nem executa código.

---

## P1 — Proteger dados e alinhar regras

### 5. Corrigir o provedor local (fallback JSON)

- **Arquivo:** `backend/src/config/database.js`
- **Problema:** `atualizarInspecao` lê 3 params de 4 (id vira `foto_url` → `NaN`); `assumirManutencao` e updates de status do fone sem mapeamento; gravação sem lock.
- **Efeito:** edições silenciosamente perdidas no modo local.
- **Ação:** corrigir os destructuring/posições e adicionar os mapeamentos faltantes; se possível, trocar o fallback por SQLite em dev.
- **Aceite:** editar uma inspeção, assumir uma OS e alterar status do fone persistem após reload.

### 6. Revalidar usuário no `authMiddleware`

- **Arquivo:** `backend/src/middlewares/authMiddleware.js:23-30`
- **Problema:** confia apenas no payload do token.
- **Efeito:** usuário deletado/desativado/rebaixado mantém acesso até o token expirar.
- **Ação:** buscar o funcionário por `id`, checar `ativo` e usar o cargo atual do banco.
- **Aceite:** desativar um usuário invalida o acesso na requisição seguinte.

### 7. Remover senha em texto plano e proteger o login

- **Arquivo:** `backend/src/controllers/authController.js:25-31`
- **Problema:** fallback compara senha em texto plano; seeds usam `1234`; sem normalização de e-mail; sem rate limit.
- **Ação:** remover o fallback, migrar seeds para bcrypt, normalizar e-mail e adicionar rate limit em `/auth/login`.
- **Aceite:** login só funciona com hash; 5 tentativas erradas em sequência passam a ser bloqueadas.

### 8. Unificar a matriz de permissões

- **Arquivos:** `backend/src/routes/*.js`, `frontend/js/ui.js`, páginas com botões de ação.
- **Problema:** Gerente vê botões que a API nega; `checkRole` dá bypass total ao Admin; `guardPagina` usa substring.
- **Ação:** definir a matriz em um único lugar, remover o bypass implícito, usar igualdade nos guards e derivar a visibilidade dos botões dela.
- **Aceite:** para cada cargo, o que aparece na UI é exatamente o que a API permite.

### 9. Corrigir busca e paginação do Histórico

- **Arquivo:** `frontend/js/pages/historico.js`
- **Problema:** texto vai como `inspetor`; filtro client-side só na página atual; totais errados.
- **Ação:** enviar termo como `q`, filtrar no backend e usar o `total` retornado.
- **Aceite:** buscar um termo retorna resultados de todas as páginas e o contador bate com a realidade.

### 10. Restringir CORS

- **Arquivo:** `backend/src/app.js:23-66`
- **Problema:** aceita qualquer `*.netlify.app`/`*.vercel.app`/`localhost` e reflete qualquer `Origin` no `OPTIONS`.
- **Ação:** lista explícita via env `CORS_ORIGINS`, comparação exata, remover o reflexo.
- **Aceite:** origem não listada recebe erro de CORS; origens permitidas continuam funcionando.

---

## P2 — Consistência e robustez

### 11. Reconciliar status do fone

- **Arquivos:** `backend/src/controllers/manutencaoController.js:255-260`, `inspecaoController.js`, `testeController.js`
- **Problema:** excluir OS/inspeção/teste não recalcula o status do fone; criação aceita `Concluido`.
- **Ação:** transações que recalculam o status após cada mudança e validam transições na criação.
- **Aceite:** excluir a última OS aberta devolve o fone a um status coerente.

### 12. Corrigir KPIs e filtro de 90 dias

- **Arquivos:** `frontend/js/pages/dashboard.js`, endpoints de estatísticas.
- **Problema:** “Reprovados” conta `Em Análise`; FPY usa status atual; API fixa 30 dias.
- **Ação:** separar estados, calcular FPY pela primeira inspeção e aceitar `?dias=`.
- **Aceite:** alternar 7/30/90 dias muda os dados; KPIs batem com as inspeções reais.

### 13. Reset administrativo no PostgreSQL

- **Arquivo:** `backend/src/app.js:120-146`
- **Problema:** só escreve no JSON; no PG responde sucesso sem resetar.
- **Ação:** implementar via transação (`TRUNCATE`/`DELETE`) ou desabilitar quando o provedor for PG.
- **Aceite:** reset limpa as tabelas corretas e preserva os usuários.

### 14. `ensureSchema` criar tabelas

- **Arquivo:** `backend/src/config/database.js:896-902`
- **Problema:** só roda `ALTER TABLE`.
- **Ação:** incluir `CREATE TABLE IF NOT EXISTS` no bootstrap.
- **Aceite:** banco vazio sobe a aplicação sem rodar SQL manual.

### 15. Bloquear fallback JSON no Vercel

- **Arquivo:** `backend/src/config/database.js:13-23`
- **Problema:** `/tmp` é efêmero e não compartilhado entre instâncias.
- **Ação:** exigir PG quando `VERCEL` estiver definido.
- **Aceite:** deploy sem `DATABASE_URL` falha de forma explícita, em vez de perder dados.

### 16. Tratar `23505` no update de fone

- **Arquivo:** `backend/src/controllers/foneController.js:146`
- **Problema:** só trata `ER_DUP_ENTRY`.
- **Ação:** incluir `23505` e a constraint de `numero_serie`.
- **Aceite:** editar para um serial duplicado retorna 409, não 500.

### 17. `helmet`, CSP e rate limiting

- **Arquivo:** `backend/src/app.js`
- **Problema:** nenhuma dessas proteções.
- **Ação:** adicionar `helmet`, CSP compatível com o front e `express-rate-limit` (mais restrito no login).
- **Aceite:** headers de segurança presentes; login limitado.

### 18. Padronizar `userAuthController`

- **Arquivo:** `backend/src/controllers/userAuthController.js`
- **Problema:** vaza `error.message`, mistura idiomas, política de senha incompatível com o seed.
- **Ação:** mensagens em português, sem detalhes internos, política consistente.
- **Aceite:** erros retornam mensagens padronizadas.

---

## P3 — Higiene e melhorias

### 19. 404 JSON para `/api/*`

- **Arquivo:** `backend/src/app.js`
- **Ação:** middleware específico retornando JSON.

### 20. Validação TLS do PostgreSQL

- **Arquivo:** `backend/src/config/database.js`
- **Ação:** `rejectUnauthorized: true` com CA configurada.

### 21. `guardPagina` por igualdade

- **Arquivo:** `frontend/js/ui.js:56-57`
- **Ação:** trocar `includes` por comparação exata.

### 22. `config.js` em domínio customizado

- **Arquivo:** `frontend/js/config.js`
- **Ação:** exigir env de build e falhar explicitamente quando ausente.

### 23. Paginação em `/fones` e `/users`

- **Ação:** implementar `pagina`/`limite` no backend e consumir no front.

### 24. Atualizar `docs.js` e `documentacao.html`

- **Ação:** escapar o termo de busca e atualizar a aba “Diagnóstico”.

---

## Sequência recomendada de execução

```text
Semana 1  →  P0 (itens 1-4)
            Destrava as telas e fecha o XSS. Tudo de esforço baixo.

Semana 2  →  P1 (itens 5-10)
            Protege dados, login e alinha permissões.

Semana 3  →  P2 (itens 11-18)
            Consistência de status, KPIs, deploy e segurança.

Semana 4  →  P3 (itens 19-24)
            Higiene e melhorias incrementais.
```

---

## Critérios de “pronto”

- [ ] Nenhuma tela quebra no console ao navegar por todas as páginas.
- [ ] Nenhum endpoint retorna 500 em fluxo normal no PostgreSQL.
- [ ] Nenhuma edição é perdida silenciosamente (local ou PG).
- [ ] Cargos veem exatamente o que podem fazer.
- [ ] Dados de teste criados com `"` e `<script>` não executam nada.
- [ ] Deploy no Vercel não perde dados.
- [ ] Segredos e credenciais de seed fora do repositório.

---

## Observações

- Os itens **1, 2, 3 e 4** são os de maior relação impacto/esforço: poucas linhas e destravam funcionalidades inteiras.
- Os itens **5–8** dependem de decisões de produto (manter ou não o fallback JSON, papéis de Gerente).
- Recomenda-se criar testes de integração para os endpoints de listagem antes de refatorar, para evitar regressões de placeholders.
