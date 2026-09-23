# SoundX Quality — Sistema de Controle de Qualidade de Fones de Ouvido

> Repositório: *[https://github.com/miguelfranzini-zip/SoundX-Quality]*

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
Aplicação web integrada a um banco de dados relacional MySQL (`controle_qualidade_fones`), estruturada com Design System minimalista e sofisticado. A solução oferece rotinas de cadastro, execução de checklists de inspeção, anexação de evidências, histórico de reparos e painéis de indicadores em tempo real, com controle de acesso por perfil (RBAC).

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

**Não Funcionais (RNF01–RNF10):** resposta ≤ 3s; disponibilidade ≥ 99%; senhas criptografadas; suporte a Chrome/Edge/Firefox; acesso restrito a autenticados; responsividade (desktop/tablet/smartphone); MySQL; rastreabilidade inalterável; uploads em JPG/JPEG/PNG; versionamento via Git/GitHub.

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

### 1. Iniciar o Banco de Dados (MySQL via XAMPP)
1. Abra o **XAMPP Control Panel** e dê **Start** em **Apache** e **MySQL**.
2. Acesse o phpMyAdmin em [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
3. Na aba **SQL**, execute o script localizado em [`backend/database.sql`](file:///c:/Users/Aluno/Desktop/SoundX-Quality-main/backend/database.sql).

### 2. Iniciar o Servidor (Back-end + Front-end integrado)
1. Abra o terminal na pasta do backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. O servidor iniciará na porta **3001**.

### 3. Acessar a Aplicação
Abra seu navegador e acesse:
👉 **[http://localhost:3001](http://localhost:3001)**

> *Dica de teste:* Na tela de login, utilize os botões de **Acesso Rápido** para alternar instantaneamente entre os perfis de **Inspetor**, **Técnico** e **Admin**.

---

## 🛠️ Tecnologias
- **Front-end:** HTML5 semântico, CSS3 Moderno (Tokens, Variáveis, Flexbox, Grid), JavaScript Vanilla (ES Modules)
- **Back-end:** Node.js, Express 5, JWT (`jsonwebtoken`), Criptografia (`bcryptjs`), MySQL2
- **Banco de Dados:** MySQL 8.0+ / MariaDB (via XAMPP) com fallback local em JSON
- **Controle de Versão:** Git & GitHub

---

## 👥 Equipe
- Miguel Porto Franzini
- Gabriel Lopes da Silva
- Fernanda Garcia Nichele
- Geovane Tobias
- Rafael Augusto Lamb
