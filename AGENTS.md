# AGENTS.md — Coordenação Multi-Agente (SoundX Quality)

> **Leia antes de qualquer comando `git` ou edição de arquivo.**
> Dois agentes operam **ao mesmo tempo, no mesmo diretório e no mesmo repositório**: `opencode` e `antigravity`.
> O objetivo deste arquivo é impedir que um agente sobrescreva, apague ou conflite com o trabalho do outro.

---

## 0. Estado atual (bootstrap)

- Diretório: `C:\Users\Aluno\Downloads\SoundX-Quality-main`
- Remoto: `https://github.com/miguelfranzini-zip/SoundX-Quality` — branch `main`
- HEAD local = `16b4653` = `origin/main` (projeto já idêntico ao GitHub)
- `core.autocrlf=true` (arquivos CRLF do Windows não aparecem como modificados)
- Push **ainda não autenticado**: não há credencial GitHub no Windows Credential Manager

---

## 1. Regras invioláveis

| # | Regra | Motivo |
|---|-------|--------|
| 1 | **Nunca** `git push --force` / `--force-with-lease` | Reescreve histórico e apaga commits do outro |
| 2 | **Nunca** `git reset --hard`, `git clean -fd`, `git checkout .`, `git restore .` | Descarta trabalho não commitado do outro agente |
| 3 | **Nunca** `git add -A` / `git commit -am` | Captura o WIP do outro agente no seu commit |
| 4 | **Nunca** commitar direto em `main` (exceto 1 commit de protocolo/bootstrap) | Evita corrida no branch compartilhado |
| 5 | **Nunca** editar arquivo de outra área sem lock válido | Evita edição simultânea do mesmo arquivo |
| 6 | **Nunca** `git stash` | O stash é global e afeta o outro agente |
| 7 | **Nunca** commitar `.env`, tokens, `local_data.json` | Segredos |
| 8 | **Nunca** apagar arquivo que você não criou sem lock + aviso no seu state | Perda irreversível de trabalho |

---

## 2. Checklist obrigatório antes de começar

```powershell
git status --short                  # há WIP de outro agente?
git log --oneline -5                # o que mudou desde a última vez?
Get-Content .agents/state/*.md      # qual tarefa o outro agente está executando?
```

- Se `git status` mostrar arquivos modificados **que não são seus** → o outro agente está no meio de uma tarefa.
  Não commite, não reverta, não faça stash. Trabalhe apenas nos seus arquivos.
- Se o outro agente estiver na mesma área que você quer usar → escolha outra tarefa ou aguarde.

---

## 3. Locks por área (impede edição simultânea)

Lock = **diretório** em `.agents/locks/<area>`. A criação é atômica no NTFS: falhar = lock ocupado.

**Adquirir:**
```powershell
New-Item -ItemType Directory .agents/locks/backend -ErrorAction Stop
Set-Content .agents/locks/backend/owner.txt "opencode|$(Get-Date -Format o)|TTL=90min|<tarefa>"
```

**Liberar (sempre ao terminar, mesmo com erro):**
```powershell
Remove-Item -Recurse -Force .agents/locks/backend
```

**Lock órfão (agente caiu):** se `owner.txt` tiver mais de **90 minutos**, qualquer agente pode assumir:
1. registrar no seu `.agents/state/<agente>.md`: `assumi lock <area> de <outro> (stale)`
2. remover o diretório e recriar.

**Áreas:**

| Área | Caminhos |
|------|----------|
| `backend` | `backend/**` |
| `frontend-js` | `frontend/js/**` |
| `frontend-ui` | `frontend/*.html`, `frontend/css/**`, `frontend/assets/**` |
| `docs` | `README.md`, `*.md`, `frontend/documentacao.html`, `frontend/manual.html` |
| `infra` | `netlify.toml`, `vercel.json`, `package.json`, `.gitignore`, `backend/package.json`, `backend/vercel.json` |

`infra` e `docs` são **compartilhadas**: lock obrigatório, uma por vez.

---

## 4. Branches e merge

- Cada agente trabalha em `agent/<agente>/<tema>` — nunca em `main`.
- Antes de abrir PR/merge: `git fetch origin && git rebase origin/main` (rebase só na **sua** branch).
- Merge em `main`: **um por vez**, fast-forward, com a árvore limpa.

```powershell
git switch -c agent/opencode/<tema>
git add <caminhos-explicitos>
git commit -m "tipo(escopo): resumo em ate 72 chars"
git fetch origin; git rebase origin/main
git push -u origin HEAD
```

---

## 5. Divisão de áreas (padrão sugerido)

| Agente | Área principal | Observação |
|--------|----------------|------------|
| `opencode` | `backend` + `infra` | APIs, controllers, rotas, deploy |
| `antigravity` | `frontend-js` + `frontend-ui` | páginas, estilos, componentes |
| ambos | `docs` | sempre com lock |

> Ajustável: se precisar mudar, edite esta tabela com lock em `infra` e avise no seu state.

---

## 6. Orçamento de contexto, tokens e raciocínio

| Recurso | Limite | Prática |
|---------|--------|---------|
| Leitura de arquivo | ~300 linhas por vez | `grep`/`Select-String` primeiro, depois faixa de linhas |
| Arquivos por tarefa | ≤ 8 | tarefa maior = quebrar em subtarefas |
| Arquivos por commit | ≤ 10 | commits pequenos, revisáveis |
| Assunto do commit | ≤ 72 caracteres | corpo só se necessário |
| Saída de terminal | filtrar | `Select-Object -First 30`, `git diff --stat` em vez de `git diff` completo |
| Estado entre sessões | ≤ 40 linhas | `.agents/state/<agente>.md` |
| Escopo | 1 tarefa por vez | sem refatoração fora do escopo, sem abstração nova não pedida |
| Sincronização | `git diff --stat` + `git log --oneline -5` | não reler o repositório inteiro para saber o que mudou |

**Regra de ouro de contexto:** se a informação já está no GitHub ou no `.agents/state/`, não reanalise o código — leia o resumo.

---

## 7. Memória entre sessões

Cada agente mantém **um** arquivo, só ele escreve:

`.agents/state/opencode.md` · `.agents/state/antigravity.md`

Formato (máx. 40 linhas):
```
## Agora
tarefa: <uma linha>
branch: agent/<agente>/<tema>
lock: <area|nenhum>
arquivos: <lista curta>

## Feito nesta sessão
- ...

## Próximo
- ...

## Bloqueios
- ...
```

Atualize ao **iniciar** e ao **terminar** cada tarefa, antes de liberar o lock.

---

## 8. Handshake (os dois agentes recebem o mesmo prompt)

1. Ler este `AGENTS.md`.
2. Rodar o checklist da seção 2.
3. Escrever `.agents/state/<agente>.md` com a tarefa pretendida.
4. Adquirir o lock da área.
5. Só então editar.

Se os dois tentarem a mesma área, **quem criar o lock primeiro ganha**; o outro escolhe outra tarefa. Sem negociação por chat — o lock é a decisão.

---

## 9. Sinais de conflito — pare imediatamente

- `git push` rejeitado (`non-fast-forward`) → **não force**. `git fetch && git rebase origin/main`.
- `.git/index.lock` existente → outro agente está commitando. Aguarde 30s, não apague o arquivo à força.
- Arquivo que você editou mudou sozinho (`git status`) → o outro agente está nele. Saia da área, avise no state.
- Conflito de merge → resolva **só** nos arquivos da sua área; se envolver área alheia, reverta seu commit e reabra a tarefa.
