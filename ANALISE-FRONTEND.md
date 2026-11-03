# SoundX Quality — Análise do Front-end

> Revisão estática do código em `frontend/`.
> Análise complementar do servidor: [`ANALISE-BACKEND.md`](./ANALISE-BACKEND.md).
>
> **Contexto:** a aplicação não foi executada localmente porque `backend/node_modules` não está instalado e `local_data.json` não existe. Os achados abaixo vêm da leitura do código.

---

## Índice

- [Críticos](#-críticos)
- [Altos](#-altos)
- [Médios](#-médios)
- [Baixos](#-baixos)
- [Checklist de correção](#checklist-de-correção)

---

## 🔴 Críticos

### 1. Chart.js quebra o Dashboard e o Histórico por inteiro

**Arquivos:** `frontend/js/charts.js:7`, `frontend/js/pages/dashboard.js:4`, `frontend/js/pages/historico.js:4`

```js
// charts.js
import Chart from '../assets/vendor/chart.umd.js';
```

O arquivo `frontend/assets/vendor/chart.umd.js` é um build **UMD** do Chart.js v3.9.1, que **não possui `export default` nem `export {}`**. Um `import` ESM de um arquivo sem exportações é inválido e o módulo falha ao carregar.

Como `dashboard.js` e `historico.js` importam `charts.js` estaticamente, **as duas páginas inteiras quebram** — não apenas os gráficos.

**Correção sugerida (uma das duas):**

- Carregar o UMD via `<script>` no HTML e usar `window.Chart`:
  ```html
  <script src="../assets/vendor/chart.umd.js"></script>
  ```
  ```js
  // charts.js
  const Chart = window.Chart;
  ```
- Ou baixar o build **ESM** oficial (`chart.esm.js`) e importar desse arquivo.

---

### 2. XSS armazenado: `escapeHtml` não escapa aspas

**Arquivo:** `frontend/js/ui.js:281-284`

```js
export function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}
```

`textContent` + `innerHTML` escapa `&`, `<` e `>`, mas **não escapa `"` nem `'`**. O valor é usado dentro de atributos HTML em várias páginas:

| Arquivo | Linha | Uso |
|---|---|---|
| `frontend/js/pages/user-cadastro.js` | 59, 66 | `data-nome="${escapeHtml(u.nome)}"` |
| `frontend/js/pages/historico.js` | 44 | `href="${escapeHtml(u)}"` e `title="..."` |
| `frontend/js/pages/inspecoes.js` | 38 | `href="${escapeHtml(u)}"` |
| `frontend/js/pages/fones.js` | 46-48 | conteúdo de células |

Um nome ou observação contendo `"` encerra o atributo e injeta novos atributos/eventos. Agravante: o token de sessão fica em `localStorage` (`sxq_session`), então um XSS consegue exfiltrá-lo.

**Correção sugerida:**

```js
export function escapeHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
```

Depois, revisar todos os usos em atributos (`data-*`, `title`, `href`, `value`).

---

### 3. `manutencao-solicitar.js` monta `<option>` sem escape

**Arquivo:** `frontend/js/pages/manutencao-solicitar.js:59-68`

```js
return `<option value="${f.id_fone}" ${sel}>${f.numero_serie} — ${f.modelo}${lote} (${f.status})</option>`;
```

`numero_serie`, `modelo`, `lote` e `status` vêm da API e são interpolados sem `escapeHtml`. Qualquer um deles pode injetar markup no `innerHTML`.

**Correção:** aplicar `escapeHtml` em cada campo (inclusive no `lote`).

---

## 🟠 Altos

### 4. Busca e paginação do Histórico estão erradas

**Arquivo:** `frontend/js/pages/historico.js`

- O texto digitado pelo usuário é enviado como `inspetor` (filtro de nome do inspetor), e não como busca geral.
- A filtragem por texto é feita **no cliente, apenas sobre a página atual** — resultados de outras páginas nunca aparecem.
- `total` e `total_paginas` não refletem o filtro aplicado, então a paginação exibe números incorretos.

**Correção:** enviar o termo como parâmetro de busca (`q`) e aplicar o filtro no backend, junto com `LIMIT/OFFSET`; usar o `total` retornado pela API.

---

### 5. Aba de 90 dias do Dashboard não funciona

**Arquivo:** `frontend/js/pages/dashboard.js:139` e `:307-328`

```js
: (periodoSelecionado === 90 ? serie : serie.slice(-30));
```

A API sempre devolve 30 dias de série. O botão de 90 dias reutiliza a mesma série, então a opção é inócua — o usuário clica e nada muda.

**Correção:** a API precisa aceitar `?dias=90` (ou devolver 90 dias) e o front deve solicitar o período selecionado.

---

### 6. KPIs incorretos no Dashboard

**Arquivo:** `frontend/js/pages/dashboard.js`

- **“Fones Reprovados”** conta fones em `Em Análise` como reprovados.
- **FPY (First Pass Yield)** usa o status atual do fone em vez do resultado da primeira inspeção.
- As estatísticas de “30 dias” estão fixas no backend, independentemente do filtro.

**Correção:** separar claramente os estados (`Em Análise` ≠ `Reprovado`), calcular FPY a partir da primeira inspeção de cada fone e alinhar o período com o filtro da tela.

---

### 7. Status de fone inconsistente entre front e back

**Arquivos:** `frontend/js/pages/fones.js`, `frontend/js/pages/testes.js`, `frontend/js/pages/inspecoes.js`

- O dropdown de status do front inclui `Em manutenção` (com acento/minúsculas), mas o backend só reconhece `Em Manutencao`.
- Adicionar/remover testes não reconcilia o resultado da inspeção nem o status do fone.

**Correção:** centralizar a lista de status em um único módulo (`frontend/js/constantes.js`) com exatamente os valores aceitos pelo backend, e fazer a reconciliação no servidor.

---

### 8. Botões de ação aparecem para cargos que a API nega

**Arquivos:** `frontend/js/pages/fones.js`, `inspecoes.js`, `manutencao.js`, `testes.js`, `user-cadastro.js`

- Botões de exclusão são exibidos para **Gerente**, mas as rotas exigem `Admin` (`foneRoutes.js:15`, `inspecaoRoutes.js:20`, `manutencaoRoutes.js:26`).
- `testes.js` mostra ações de edição/exclusão para Gerente, mas as rotas exigem `Inspetor` (`testeRoutes.js:13-16`).
- O guard de `user-cadastro.html` deixa Admin e Gerente entrarem, mas `/users` é Admin-only.

**Correção:** derivar a visibilidade dos botões da mesma matriz de permissões das rotas e corrigir o guard.

---

### 9. `guardPagina` usa correspondência por substring

**Arquivo:** `frontend/js/ui.js:56-57`

```js
const cUser = normalizarCargo(usuario.cargo);
return item.cargos.map(normalizarCargo).some((c) => cUser === c || cUser.includes(c));
```

`includes` pode liberar cargos indevidos por coincidência de substring. A comparação deve ser por igualdade.

---

### 10. `frontend/js/config.js` cai para same-origin em domínio customizado

**Arquivo:** `frontend/js/config.js`

Sem a variável de ambiente de build, a URL da API vira a própria origem. Em um domínio customizado (sem `netlify.toml`/`vercel.json` aplicável), as chamadas batem no host do front e falham.

**Correção:** exigir a env de build e falhar de forma explícita (ou documentar o fallback).

---

## 🟡 Médios

### 11. `/fones` e `/users` sem paginação/limite no front

As listagens crescem sem controle e não há filtro de vencimento. Em bases maiores, a tabela fica pesada e a experiência degrada.

**Correção:** implementar paginação (ou “carregar mais”) e filtros no backend, com o front consumindo os parâmetros.

### 12. `docs.js` reflete o termo de busca sem escape

**Arquivo:** `frontend/js/pages/docs.js`

O termo digitado é inserido no DOM via `innerHTML` sem escape — self-XSS (menos grave, mas vale corrigir com `textContent`).

### 13. Aba “Diagnóstico” desatualizada

**Arquivo:** `frontend/documentacao.html`

A aba descreve comportamentos que não existem mais no código atual, o que induz o usuário ao erro.

---

## 🔵 Baixos

- **Mensagens de erro cruas:** algumas páginas exibem `error.message` diretamente ao usuário.
- **Duplicação de lógica de status:** listas de status espalhadas por várias páginas.
- **Falta de estados de carregamento/erro consistentes** em tabelas e gráficos.
- **Acessibilidade:** botões só com ícone sem `aria-label` em alguns pontos.

---

## Checklist de correção

- [ ] Trocar o import do Chart.js (UMD → `window.Chart` ou build ESM).
- [ ] Corrigir `escapeHtml` para escapar `"` e `'`.
- [ ] Escapar todos os campos em `manutencao-solicitar.js`.
- [ ] Implementar busca/paginação reais no Histórico.
- [ ] Implementar o filtro de 90 dias de ponta a ponta.
- [ ] Corrigir os KPIs (reprovados, FPY, período).
- [ ] Unificar a lista de status de fone com o backend.
- [ ] Alinhar visibilidade de botões e guards com a matriz de permissões.
- [ ] Trocar `includes` por igualdade no `guardPagina`.
- [ ] Revisar `config.js` para domínios customizados.
- [ ] Adicionar paginação em `/fones` e `/users`.
- [ ] Corrigir `docs.js` e atualizar `documentacao.html`.
