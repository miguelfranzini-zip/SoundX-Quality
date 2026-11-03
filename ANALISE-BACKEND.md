# SoundX Quality — Análise do Back-end

> Revisão estática do código em `backend/`.
> Análise complementar do cliente: [`ANALISE-FRONTEND.md`](./ANALISE-FRONTEND.md).
>
> **Contexto:** a aplicação não foi executada localmente porque `backend/node_modules` não está instalado e `local_data.json` não existe. Os achados abaixo vêm da leitura do código. O projeto suporta PostgreSQL e um *fallback* local em JSON.

---

## Índice

- [Críticos](#-críticos)
- [Altos](#-altos)
- [Médios](#-médios)
- [Baixos](#-baixos)
- [Infra e deploy](#-infra-e-deploy)
- [Checklist de correção](#checklist-de-correção)

---

## 🔴 Críticos

### 1. `GET /api/manutencao` quebra sempre no PostgreSQL

**Arquivo:** `backend/src/controllers/manutencaoController.js:102-135`

- A query de contagem (`countQuery`) **não tem nenhum `?`**, mas recebe **6 parâmetros** (linhas 102-114).
- A query principal tem só 2 placeholders (`LIMIT ? OFFSET ?`), mas recebe **8 parâmetros** (linhas 117-135).
- Além disso, os filtros (`de`, `ate`, `status`, `id_fone`, `id_tecnico`, `prioridade`) **não são aplicados no `WHERE`** — a consulta até ignora o que o usuário pediu.

**Erro resultante no PG:**

```
bind message supplies 8 parameters, but prepared statement requires 2
```

Ou seja: **toda listagem de manutenção retorna HTTP 500** em produção.

**Correção:** montar o `WHERE` dinamicamente, acumulando `condicoes` e `params`, e usar os placeholders na ordem correta tanto no `count` quanto na consulta paginada.

---

### 2. `GET /api/inspecoes` com paginação quebra pelo mesmo motivo

**Arquivo:** `backend/src/controllers/inspecaoController.js:272-305`

- `countQuery`: 5 parâmetros enviados, 0 placeholders na string.
- Consulta paginada: 7 parâmetros enviados, apenas 2 placeholders (`LIMIT ? OFFSET ?`).

Como o front sempre envia `pagina`/`limite`, a tela de inspeções também falha no PostgreSQL.

**Correção:** mesma estratégia do item 1 — `WHERE` dinâmico com `condicoes`/`params`.

---

### 3. Provedor local (fallback JSON) não persiste alterações

**Arquivo:** `backend/src/config/database.js`

| Problema | Linha | Efeito |
|---|---|---|
| `atualizarInspecao` | 407-416 | A query real envia 4 parâmetros (`resultado_final`, `observacao`, `foto_url`, `id`), mas o mapeador lê só 3 → `id = foto_url` → `Number(id)` vira `NaN` → `affectedRows: 0`. **A edição de inspeção nunca salva.** |
| `assumirManutencao` | — | A query `UPDATE manutencao SET status = 'Em Manutencao', concluido_por = ? ...` (usada em `manutencaoController.js:165`) **não tem mapeamento** → não faz nada. |
| Status do fone | — | `UPDATE fone SET status = 'Reprovado / Manutenção'` (literal) não está mapeado. |

Além disso, o fallback regrava o `local_data.json` inteiro a cada query, **sem lock**, o que pode corromper o arquivo sob concorrência.

**Correção:** corrigir os mapeamentos (destructuring e posição dos parâmetros), ou **descontinuar o fallback JSON** em favor de um banco real (SQLite em dev).

---

### 4. Autenticação não revalida o usuário no banco

**Arquivo:** `backend/src/middlewares/authMiddleware.js:23-30`

```js
jwt.verify(token, secret, (err, decoded) => {
  ...
  req.usuario = { id: decoded.id, cargo: decoded.cargo };
  return next();
});
```

O token é validado, mas o usuário **nunca é consultado no banco**. Consequências:

- Usuário **deletado** continua acessando até o token expirar.
- Usuário **desativado** (`ativo: false`) continua acessando.
- **Mudança de cargo** (ex.: rebaixar um Admin) não tem efeito até o token expirar.

**Correção:** após `jwt.verify`, buscar o funcionário por `id`, checar `ativo` e usar o **cargo atual do banco** (não o do token).

---

## 🟠 Altos

### 5. Senhas em texto plano e fallback inseguro

**Arquivo:** `backend/src/controllers/authController.js:25-31`

```js
if (funcionario.senha && (funcionario.senha.startsWith('$2a$') || ...)) {
  senhaCorreta = bcrypt.compareSync(senha, funcionario.senha);
} else {
  senhaCorreta = senha === funcionario.senha;  // texto plano
}
```

- Aceita senha em texto plano se não for hash bcrypt.
- Os seeds (`database.js:32-34`) e o README usam `1234`.
- Não há normalização de e-mail (`trim`/`toLowerCase`) na busca.
- Não há **rate limiting** no login (força bruta).

**Correção:** remover o fallback, migrar os seeds para hash, normalizar e-mail e adicionar rate limit (ex.: `express-rate-limit`).

---

### 6. `checkRole` dá bypass total ao Admin

**Arquivo:** `backend/src/middlewares/roleMiddleware.js:19-22`

```js
// Admin possui acesso geral operacional e administrativo
if (cargoUsuario === 'admin') {
  return next();
}
```

Qualquer rota passa a permitir Admin, inclusive as que deveriam ser restritas. Isso **mascara erros de matriz de permissões** e amplia o impacto de um token de Admin comprometido.

**Correção:** remover o bypass implícito e listar `Admin` explicitamente nas rotas em que ele deve ter acesso — assim a matriz fica auditável.

---

### 7. Matriz de permissões inconsistente entre API e UI

**Arquivos de rota:**

| Rota | Exige | Front mostra para |
|---|---|---|
| `DELETE /fones/:id` (`foneRoutes.js:15`) | `Admin` | Admin, Gerente |
| `DELETE /inspecoes/:id` (`inspecaoRoutes.js:20`) | `Admin` | Admin, Gerente |
| `DELETE /manutencao/:id` (`manutencaoRoutes.js:26`) | `Admin` | Admin, Gerente |
| `POST/PUT/DELETE /testes` (`testeRoutes.js:13-16`) | `Inspetor` | Admin, Gerente, Inspetor |
| `/users/*` (`userRoutes.js`) | `Admin` | Admin, Gerente (guard) |

**Correção:** definir uma matriz única (documento + constante compartilhada) e usá-la nas rotas e nos guards/botões do front.

---

### 8. Exclusão de manutenção deixa o fone travado

**Arquivo:** `backend/src/controllers/manutencaoController.js:255-260`

```js
await db.query('DELETE FROM manutencao WHERE id_manutencao = ?', [id]);
```

A OS é apagada sem reconciliar `fone.status`. O fone permanece `Reprovado / Manutenção` para sempre, mesmo sem nenhuma ordem aberta.

**Correção:** dentro de uma transação, verificar se restam outras OS abertas para o fone e, se não houver, recalcular o status (ex.: `Aguardando inspeção` ou `Reprovado`).

---

### 9. Criação de OS já concluída

**Arquivo:** `backend/src/controllers/manutencaoController.js:49-58`

`criarManutencao` aceita `status` arbitrário, inclusive `Concluido`, sem validar a transição. É possível nascer uma OS já finalizada, sem `acao_corretiva` nem `data_conclusao`.

**Correção:** validar o `status` contra uma lista permitida e forçar `Pendente`/`Solicitada` na criação.

---

### 10. CORS permissivo

**Arquivo:** `backend/src/app.js:23-66`

- Aceita qualquer `*.netlify.app`, `*.vercel.app` e **qualquer origem que contenha** `localhost`/`127.0.0.1`.
- O handler de `OPTIONS` **reflete qualquer `Origin`** (linha 65), anulando a whitelist.

**Correção:** usar uma lista explícita de origens (env `CORS_ORIGINS`), comparação exata e remover o reflexo do `OPTIONS`.

---

### 11. Reset administrativo não funciona no PostgreSQL

**Arquivo:** `backend/src/app.js:120-146`

- Escreve apenas no `local_data.json`; com PG em produção o endpoint responde **“sucesso”** mas não reseta nada.
- No Vercel grava em `/tmp`, que é efêmero.

**Correção:** implementar o reset via `TRUNCATE`/`DELETE` nas tabelas do PG, dentro de transação, ou desabilitar o endpoint quando o provedor for PG.

---

### 12. Duplicidade de número de série no update não é tratada no PG

**Arquivo:** `backend/src/controllers/foneController.js:146`

```js
if (error.code === 'ER_DUP_ENTRY') { ... }
```

Só trata o código do MySQL. No PostgreSQL o erro é `23505`, que sobe como **500** em vez de 409. O `create` já trata os dois (`foneController.js:45`); o `update` não.

**Correção:** incluir `error.code === '23505'` e `error.constraint?.includes('numero_serie')`.

---

## 🟡 Médios

### 13. `ensureSchema()` não cria tabelas

**Arquivo:** `backend/src/config/database.js:896-902`

`ensureSchema()` só executa `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Em um banco PostgreSQL novo, a aplicação falha até alguém rodar `backend/database.sql` manualmente.

**Correção:** incluir os `CREATE TABLE IF NOT EXISTS` no bootstrap ou documentar/automatizar a migração.

---

### 14. Fallback no Vercel usa `/tmp` (efêmero)

**Arquivo:** `backend/src/config/database.js:13-23`

`/tmp` é recriado a cada cold start. Dados gravados no fallback **desaparecem**. Além disso, múltiplas instâncias serverless não compartilham o arquivo.

**Correção:** exigir PostgreSQL em produção e bloquear o fallback quando `VERCEL` estiver definido.

---

### 15. `userAuthController` vaza detalhes e mistura idiomas

**Arquivo:** `backend/src/controllers/userAuthController.js`

- Retorna `error.message` cru ao cliente.
- Mensagens em inglês em uma API em português.
- Exige senha mínima de **6 caracteres**, incompatível com o seed `1234`.

**Correção:** mensagens padronizadas em português, sem detalhes internos, e política de senha consistente com os dados de seed.

---

### 16. Conexão PostgreSQL com `rejectUnauthorized: false`

**Arquivo:** `backend/src/config/database.js`

Desabilita a validação do certificado TLS, abrindo espaço para MITM na conexão com o banco.

**Correção:** usar `rejectUnauthorized: true` com CA configurada (ou `sslmode=require`/`verify-full`).

---

### 17. Ausência de `helmet`/CSP e rate limiting global

**Arquivo:** `backend/src/app.js`

Não há `helmet`, CSP nem limite de requisições. Endpoints de login e de escrita ficam expostos a abuso.

**Correção:** adicionar `helmet`, CSP adequada ao front e `express-rate-limit` (mais restrito em `/auth/login`).

---

### 18. 404 de API devolve HTML

**Arquivo:** `backend/src/app.js`

Uma rota `/api/*` inexistente cai no handler de arquivos estáticos e retorna HTML em vez de JSON. Isso confunde clientes e o front.

**Correção:** adicionar um middleware 404 específico para `/api` retornando `{ mensagem: 'Rota não encontrada.' }`.

---

## 🔵 Baixos

- **Segredo JWT publicado:** `.env.example` e o README trazem `JWT_SECRET=soundx_secret_key_2026`. Trocar em produção e remover do repositório.
- **Credenciais de seed publicadas:** `admin@soundx.com` / `1234` no README.
- **`test-backend.js` enganoso:** tenta reverter a senha do admin para `1234` (4 caracteres), a API rejeita, e os logs de sucesso não refletem a realidade.
- **Logs com dados sensíveis:** alguns `console.error` incluem objetos de erro completos.
- **Falta de validação de entrada consistente:** nem todos os controllers validam tipos/limites antes de consultar.

---

## Infra e deploy

- **`netlify.toml` / `vercel.json`:** o front é estático e depende de a API estar acessível na URL configurada em `frontend/js/config.js`. Sem env de build, o fallback é same-origin — que não existe no Netlify/Vercel.
- **Banco de dados:** o projeto depende de `backend/database.sql` para criar o schema; não há migração automática.
- **Persistência:** o fallback JSON é adequado apenas para desenvolvimento local; em produção (Vercel) ele é efêmero e não compartilhado entre instâncias.
- **Observabilidade:** não há healthcheck nem logs estruturados.

---

## Checklist de correção

- [ ] Corrigir placeholders/params de `manutencaoController.js` (listagem).
- [ ] Corrigir placeholders/params de `inspecaoController.js` (listagem paginada).
- [ ] Corrigir mapeamentos do provedor local (`atualizarInspecao`, `assumirManutencao`, status do fone).
- [ ] Revalidar usuário/`ativo`/cargo no `authMiddleware`.
- [ ] Remover fallback de senha em texto plano e migrar seeds para bcrypt.
- [ ] Normalizar e-mail e adicionar rate limit no login.
- [ ] Remover bypass implícito do Admin no `checkRole` e alinhar a matriz de permissões.
- [ ] Reconciliar status do fone ao excluir manutenção.
- [ ] Validar transição de status na criação de OS.
- [ ] Restringir CORS a uma lista explícita.
- [ ] Implementar reset de dados para PostgreSQL.
- [ ] Tratar `23505` no update de fone.
- [ ] Incluir `CREATE TABLE IF NOT EXISTS` no bootstrap.
- [ ] Bloquear fallback JSON no Vercel.
- [ ] Padronizar mensagens do `userAuthController` sem vazar `error.message`.
- [ ] Habilitar validação TLS do PostgreSQL.
- [ ] Adicionar `helmet`, CSP e rate limiting.
- [ ] 404 JSON para `/api/*`.
- [ ] Remover segredos/credenciais do repositório e corrigir `test-backend.js`.
