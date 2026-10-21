# SoundX Quality — Sistema de Controle de Qualidade de Fones de Ouvido

> Repositório: [https://github.com/miguelfranzini-zip/SoundX-Quality](https://github.com/miguelfranzini-zip/SoundX-Quality)  
> 🌐 **Frontend em Produção:** [https://soundxquality.netlify.app/](https://soundxquality.netlify.app/)  
> 🚀 **API / Backend em Produção:** [https://sound-x-quality.vercel.app](https://sound-x-quality.vercel.app)

## 📌 Escopo do Projeto

### Problema
Descentralização, falta de padronização e pouca rastreabilidade no gerenciamento do controle de qualidade, testes técnicos e manutenções de fones de ouvido. As falhas são registradas de forma isolada, impossibilitando uma visão consolidada da qualidade e do histórico de cada item.

### Objetivo
Prover um sistema web completo para gerenciar, avaliar, registrar e rastrear todo o fluxo de controle de qualidade, não conformidades e manutenções de fones de ouvido, garantindo decisões baseadas em dados e histórico confiável.

### Público-alvo
- **Inspetores de Qualidade:** Realizam testes físicos/funcionais, checklists e registram falhas/evidências.
- **Técnicos de Manutenção:** Consultam diagnósticos, realizam reparações e atualizam o status dos equipamentos.
- **Gerentes de Qualidade:** Gerenciam permissões, cadastram testes/critérios, acompanham dashboards e relatórios analíticos.

### Solução
Aplicação web integrada a um banco de dados relacional PostgreSQL (Supabase) ou provedor local resiliente com integridade referencial, estruturada com Design System minimalista e sofisticado. A solução oferece rotinas de cadastro, execução de checklists de inspeção, anexação de evidências, histórico de reparos e painéis de indicadores em tempo real, com controle de acesso por perfil (RBAC).

### Principais funcionalidades
- Gestão e cadastro de fones de ouvido, lotes, inspetores, técnicos e gerentes.
- Execução de checklists de testes padronizados (áudio, microfone, conexões e bateria).
- Registro detalhado de não conformidades com anexação de evidências fotográficas.
- Controle de serviços de manutenção preventiva e corretiva em itens reprovados.
- Consulta ao histórico completo de avaliações, garantindo rastreabilidade inalterável.
- Dashboard gráfico com KPIs de qualidade e emissão de relatórios analíticos.

## 🎨 Design System

Direção estética: **minimalista + tecnológica + quente + sofisticada**. Priorizar espaços negativos, tipografia forte, grandes blocos cromáticos e contraste; evitar excesso de elementos, gradientes aleatórios, sombras exageradas e poluição visual.

### Cores
- **Cor primária:** Laranja (`#FF9800`) — CTAs, destaques e ações principais.
- **Cor secundária:** Dourado (`#FFBD2B`) — Elementos de energia e destaque visual.
- **Cores de fundo:** Creme (`#FEEFCE`) e Off-white (`#FFF8E8`) — Superfícies e áreas de leitura.
- **Cores de texto:** Marrom Escuro (`#602100`) e Marrom Profundo (`#290E00`) — Alto contraste para títulos e textos.
- **Apoio:** Terracota (`#BB7A59`) — Elementos secundários.
- **Gradientes oficiais:** Creme→Laranja (fundos suaves), Laranja→Dourado (banners/energia), Marrom→Terracota (fundos escuros sofisticados), Laranja→Marrom (alto impacto). Usados pontualmente, nunca como preenchimento total.

### 🔤 Tipografia
Regra tipográfica: *Garet comunica. Muli explica.*
- **Fonte principal:** Garet (títulos, display, KPIs — Bold/Semibold/Medium).
- **Títulos:** Garet Bold (Display/H1), Semibold (H2), Medium/Semibold (H3 e cards).
- **Subtítulos:** Garet Semibold.
- **Texto:** Muli Regular (textos corridos, dados técnicos, legendas); Muli Semibold/Bold (botões, menus e labels).

### 🔷 Logotipo
Símbolo moderno e minimalista em alto contraste, composto por contorno geométrico retangular com cantos arredondados contendo o ícone estilizado de um fone de ouvido em conjunto com a sigla **SX** (*SoundX*). O design reflete sofisticação, precisão técnica e identidade tecnológica.

As versões do logotipo estão disponíveis nos arquivos `2.png`, `3.png`, `4.png`, `5.png` e `6.png` na raiz do projeto, para uso em fundos claros, escuros e aplicações variadas.

## 👤 Personas do Sistema e Matriz de Permissões (RBAC)

O sistema possui controle de acesso refinado baseado nos perfis operacionais e administrativos da fábrica:

### 1. Inspetor de Qualidade (Operacional)
- **Perfil de Acesso:** `Inspetor`
- **Usuário Demonstração:** `lucas@email.com` | Senha: `1234`
- **Responsabilidades:**
  - Cadastrar e editar dados dos fones de ouvido (número de série, modelo, marca, conexão, lote).
  - Executar checklists de testes técnicos padronizados (áudio, microfone, conexões e bateria).
  - Registrar e retificar laudos de inspeção, aprovando ou reprovando itens.
  - Editar e excluir testes específicos lançados durante a verificação.
  - Consultar o histórico e a rastreabilidade completa de cada fone.

### 2. Técnico de Manutenção (Especialista)
- **Perfil de Acesso:** `Técnico`
- **Usuário Demonstração:** `tecnico@soundx.com` | Senha: `1234`
- **Responsabilidades:**
  - Monitorar a **Fila de Manutenção** em tempo real com os fones reprovados pela qualidade.
  - Abrir ordens de serviço de manutenção manuais quando necessário.
  - Atualizar o status da ordem (`Pendente`, `Em Manutencao`, `Concluido`), detalhar o diagnóstico da falha e descrever as ações corretivas efetuadas.
  - Ao concluir a manutenção, o dispositivo é automaticamente liberado para status *"Em Análise"* para reteste pela equipe de qualidade.

### 3. Administrador / Gestor de Qualidade (Gestão & Governança)
- **Perfil de Acesso:** `Admin` / `Gerente`
- **Usuário Demonstração:** `admin@soundx.com` | Senha: `1234`
- **Responsabilidades:**
  - Acesso total e irrestrito a todos os módulos, telas e registros.
  - Acompanhamento do **Dashboard de Indicadores** com KPIs em tempo real (total de fones produzidos, volume de inspeções, fones aprovados vs. reprovados e taxa percentual de conformidade).
  - **Exclusividade em ações destrutivas (DELETE):** Apenas administradores podem excluir fones, laudos de inspeção e ordens de manutenção, salvaguardando a integridade histórica e a rastreabilidade da produção (RNF08).
  - Poder de edição sobre qualquer registro operacional.

---

## 🗄️ Matriz de Operações (CRUD & RBAC)

| Módulo / Entidade | Criar (POST) | Listar / Visualizar (GET) | Editar (PUT) | Excluir (DELETE) |
| :--- | :--- | :--- | :--- | :--- |
| **Fones de Ouvido** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | **Admin** *(preserva histórico em cascata)* |
| **Inspeções** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | **Admin** *(recalcula taxas e dashboards)* |
| **Testes Técnicos** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | Inspetor, Admin *(remoção de testes duplicados)* |
| **Manutenção** | Todos autenticados | Técnico, Admin | Técnico, Admin | **Admin** *(impede descarte indevido de O.S.)* |

---

## 📋 Requisitos do Sistema
**Funcionais (RF01–RF16):** cadastrar/editar/excluir produtos, lotes, inspetores e critérios; criar checklists; registrar inspeções, não conformidades e fotos; pesquisar registros; visualizar histórico; gerar relatórios; visualizar dashboard; autenticação; gerenciar permissões.

**Não Funcionais (RNF01–RNF10):** resposta ≤ 3s; disponibilidade ≥ 99%; senhas criptografadas; suporte a Chrome/Edge/Firefox; acesso restrito a autenticados; responsividade (desktop/tablet/smartphone); PostgreSQL / Supabase com fallback local resiliente; rastreabilidade inalterável; evidências fotográficas seguras com validação; versionamento via Git/GitHub.

---

## 📌 Status Atual do Projeto
- [x] **Identidade Visual e Design System** (Cores oficiais, tipografia Garet/Muli, gradientes e logos)
- [x] **Personas e Perfis de Acesso** (Inspetor, Técnico e Administrador com RBAC integrado)
- [x] **Modelagem do Banco de Dados** (DDL e DML inicial com integridade referencial e cascade)
- [x] **Back-end Completo** (API REST em Node.js/Express, autenticação JWT, validação de IDs e fallback local)
- [x] **Front-end Completo** (Interface Web moderna, barra lateral retrátil com persistência, cards de KPI, tabelas responsivas, busca em tempo real e modais)
- [x] **CRUD Completo e Integrado** (Operações de Criação, Leitura, Edição e Exclusão com diálogos de confirmação em todas as 4 entidades)

---

## 🚀 Como Executar o Sistema Localmente

O sistema possui arquitetura resiliente com **zero-configuração inicial obrigatória**: caso não haja um banco PostgreSQL configurado, o servidor ativa automaticamente o provedor local de dados persistentes (`local_data.json`).

### 1. Iniciar o Servidor (Back-end + Front-end integrado)
1. Abra o terminal na raiz do projeto ou na pasta do backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. O servidor iniciará na porta **3001**:
   - Back-end API: `http://localhost:3001/api`
   - Front-end SPA: `http://localhost:3001`

### 2. (Opcional) Conectar ao PostgreSQL / Supabase
1. Crie um arquivo `backend/.env` baseado no `backend/.env.example`.
2. Configure sua string de conexão:
   ```env
   DATABASE_URL=postgresql://postgres:senha@host.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=soundx_secret_key_2026
   ```
3. Execute o script DDL localizado em [`backend/database.sql`](file:///c:/Users/Aluno/Documents/SoundX-Quality/backend/database.sql).

### 3. Acessar a Aplicação
- 🌐 **Frontend Oficial (Netlify):** [https://soundxquality.netlify.app/](https://soundxquality.netlify.app/)
- 🚀 **Backend / API (Vercel):** [https://sound-x-quality.vercel.app](https://sound-x-quality.vercel.app)
- 💻 **Ambiente Local:** [http://localhost:3001](http://localhost:3001)
- 📊 **Apresentação em Slides:** [http://localhost:3001/documentacao.html#apresentacao](http://localhost:3001/documentacao.html#apresentacao) ou no Netlify em `/documentacao.html#apresentacao`

> *Credenciais de Teste:*
> - **Inspetor:** `lucas@email.com` | Senha: `1234`
> - **Técnico:** `tecnico@soundx.com` | Senha: `1234`
> - **Admin:** `admin@soundx.com` | Senha: `1234`

---

## 🛠️ Tecnologias
- **Front-end:** HTML5 semântico, CSS3 Moderno (Design Tokens, Variáveis, Flexbox, Grid), JavaScript Vanilla (ES Modules)
- **Back-end:** Node.js, Express 5, JWT (`jsonwebtoken`), Criptografia (`bcryptjs`), Driver PostgreSQL (`pg`)
- **Banco de Dados:** PostgreSQL (Supabase) com provedor de contingência local em JSON (`local_data.json`)
- **Controle de Versão:** Git & GitHub

---

## 👥 Equipe
- Miguel Porto Franzini
- Gabriel Lopes da Silva
- Fernanda Garcia Nichele
- Geovane Tobias
- Rafael Augusto Lamb
