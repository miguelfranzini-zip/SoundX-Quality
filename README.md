# SoundX Quality — Sistema de Controle de Qualidade de Fones de Ouvido

[![Status](https://img.shields.io/badge/Status-100%25%20Concluído-brightgreen.svg)](https://github.com/miguelfranzini-zip/SoundX-Quality)
[![Testes](https://img.shields.io/badge/Testes-100%25%20Aprovados-success.svg)](backend/test-app-completo.js)
[![Arquitetura](https://img.shields.io/badge/Arquitetura-REST%20%2B%20ACID-orange.svg)](frontend/documentacao.html)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7.svg)](https://soundxquality.netlify.app/)
[![Backend](https://img.shields.io/badge/Backend-Vercel-000000.svg)](https://sound-x-quality.vercel.app)
[![Banco](https://img.shields.io/badge/Database-Supabase%20%2F%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)

> Repositório: [https://github.com/miguelfranzini-zip/SoundX-Quality](https://github.com/miguelfranzini-zip/SoundX-Quality)  
> 🌐 **Frontend Oficial em Produção:** [https://soundxquality.netlify.app/](https://soundxquality.netlify.app/)  
> 🚀 **API / Backend em Produção:** [https://sound-x-quality.vercel.app](https://sound-x-quality.vercel.app)  
> 📖 **Manual Técnico & Apresentação (Slides):** [https://soundxquality.netlify.app/documentacao.html](https://soundxquality.netlify.app/documentacao.html)

---

## 🏆 Status do Projeto: 100% Concluído & Homologado

O sistema SoundX Quality encontra-se **100% implementado, testado e pronto para operação industrial**. Todas as rotinas de bancada, fluxo de manutenção, transações com integridade ACID, controle RBAC com exclusão segura, tooltips explicativos contextuais e documentação técnica estão operacionais.

### Resumo Executivo em Números:
- **14 Páginas Web SPA:** Sem frameworks pesados; navegação fluida em milissegundos.
- **23 Endpoints REST:** API modularizada em controladores e rotas dedicadas.
- **5 Tabelas Relacionais:** Modeladas no PostgreSQL (Supabase) com auto-migração resiliente.
- **4 Testes Técnicos de Bancada:** Áudio L/R, Microfone/Voz, Conexão e Bateria/Carga.
- **3 Personas RBAC:** Inspetor de Qualidade, Técnico de Oficina e Administrador/Gestor.
- **2 Provedores de Dados:** PostgreSQL na nuvem (principal) + Provedor Local JSON (contingência offline).
- **100% dos Testes Automatizados Aprovados:** Suíte ponta a ponta sem qualquer pendência.

---

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
  - **Exclusividade em ações destrutivas (DELETE):** Apenas administradores podem excluir fones, laudos de inspeção, ordens de manutenção e usuários, salvaguardando a auditoria da fábrica (RNF08).
  - **Salvaguarda de Exclusão de Usuários:** Bloqueio estrito que impede autoexclusão e exclusão do último administrador remanescente do sistema.

---

## 🗄️ Matriz de Operações (CRUD & RBAC)

| Módulo / Entidade | Criar (POST) | Listar / Visualizar (GET) | Editar (PUT) | Excluir (DELETE) |
| :--- | :--- | :--- | :--- | :--- |
| **Fones de Ouvido** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | **Admin** *(preserva histórico em cascata)* |
| **Inspeções** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | **Admin** *(reconcilia status do fone automaticamente)* |
| **Testes Técnicos** | Inspetor, Admin | Todos autenticados | Inspetor, Admin | Inspetor, Admin *(remoção de testes duplicados)* |
| **Manutenção (O.S.)** | Todos autenticados | Técnico, Admin | Técnico, Admin | **Admin** *(impede descarte indevido de O.S.)* |
| **Usuários** | **Admin** | **Admin** | **Admin** / Próprio (senha) | **Admin** *(bloqueia autoexclusão e último admin)* |

---

## 📋 Requisitos do Sistema
**Funcionais (RF01–RF16):** cadastrar/editar/excluir produtos, lotes, inspetores e critérios; criar checklists; registrar inspeções, não conformidades e fotos; pesquisar registros; visualizar histórico; gerar relatórios; visualizar dashboard; autenticação; gerenciar e excluir usuários com salvaguardas.

**Não Funcionais (RNF01–RNF10):** resposta ≤ 3s; disponibilidade ≥ 99%; senhas criptografadas com Bcrypt; suporte a Chrome/Edge/Firefox; acesso restrito a autenticados com JWT; responsividade (desktop/tablet/smartphone); PostgreSQL / Supabase com fallback local resiliente; rastreabilidade inalterável; evidências fotográficas seguras com validação; versionamento via Git/GitHub.

---

## 📌 Checklist do Projeto — 100% Concluído

- [x] **Identidade Visual e Design System Oficial** (Cores oficiais, tipografia Garet/Muli, gradientes, logos e tokens CSS centralizados)
- [x] **Personas e Perfis de Acesso (RBAC)** (Inspetor, Técnico e Administrador com segregação granular e validação de permissões)
- [x] **Gestão de Usuários & Exclusão Segura** (CRUD completo de usuários, proteção contra autoexclusão e bloqueio do último admin)
- [x] **Modelagem & Auto-Migração do Banco de Dados** (PostgreSQL Supabase com criação automática de colunas `foto_url` e `lote`)
- [x] **Back-end Completo com Transações ACID** (23 endpoints REST, atomicidade tudo-ou-nada via `withTransaction` e reconciliação de status)
- [x] **Front-end Completo com 14 Páginas SPA** (Interface moderna, feedback imediato com toasts, modais de confirmação e zero build pesado)
- [x] **Tooltips Informativos Flutuantes Globais `(!)`** (Ajuda contextual em formulários e tabelas sem cortes por `overflow`)
- [x] **Apresentação Executiva & Modo Imersivo** (11 slides visuais, logo na proporção nativa 16:9, zero emojis, ícones SVG e atalhos <kbd>F</kbd>/<kbd>Esc</kbd>)
- [x] **Aba 09 · Resumo Geral na Documentação** (Síntese consolidada de todos os tópicos e matriz sinótica da arquitetura)
- [x] **Suíte de Testes Automatizados Ponta a Ponta** (`test-app-completo.js` validando banco, rotas, login e 17 scripts JS com 100% de sucesso)

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

### 2. Rodar o Teste Completo do Sistema
Para rodar a verificação automatizada completa (banco, rotas, login, páginas e sintaxe dos scripts):
```bash
node backend/test-app-completo.js
```

### 3. (Opcional) Conectar ao PostgreSQL / Supabase
1. Crie um arquivo `backend/.env` baseado no `backend/.env.example`.
2. Configure sua string de conexão:
   ```env
   DATABASE_URL=postgresql://postgres:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=soundx_secret_key_2026
   ```
3. O sistema aplica auto-migração das colunas necessárias automaticamente na inicialização.

### 4. Acessar a Aplicação
- 🌐 **Frontend Oficial (Netlify):** [https://soundxquality.netlify.app/](https://soundxquality.netlify.app/)
- 🚀 **Backend / API (Vercel):** [https://sound-x-quality.vercel.app](https://sound-x-quality.vercel.app)
- 💻 **Ambiente Local:** [http://localhost:3001](http://localhost:3001)
- 📊 **Apresentação em Slides:** [http://localhost:3001/documentacao.html#apresentacao](http://localhost:3001/documentacao.html#apresentacao)
- 📖 **Resumo Executivo de Todos os Tópicos:** [http://localhost:3001/documentacao.html#resumo](http://localhost:3001/documentacao.html#resumo)

> *Credenciais de Teste Homologadas:*
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
