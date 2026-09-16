# SoundX Quality — Sistema de Controle de Qualidade de Fones de Ouvido

> Repositório: *[informe a URL do repositório no GitHub]*

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

## 👤 Personas do Sistema
- **Inspetor de Qualidade (Operacional):** Testa física e funcionalmente os fones, cadastra fones/lotes, executa checklists, registra não conformidades e anexa evidências. Foco: agilidade na execução e registro.
- **Técnico de Manutenção (Especialista):** Consulta os diagnósticos das inspeções, executa o reparo apropriado e atualiza o status/histórico do dispositivo.
- **Gerente / Gestor de Qualidade (Administrativo):** Cadastra inspetores e critérios/testes, gerencia usuários e permissões, acompanha dashboards e emite relatórios analíticos.

## 🗄️ Banco de Dados (`controle_qualidade_fones`)
10 tabelas interligadas: `funcionario`, `fone`, `inspecao`, `teste`, `resultado_teste`, `defeito`, `defeito_encontrado`, `tecnico`, `manutencao`, `gerente`.

## 📋 Requisitos do Sistema
**Funcionais (RF01–RF16):** cadastrar/editar/excluir produtos, lotes, inspetores e critérios; criar checklists; registrar inspeções, não conformidades e fotos; pesquisar registros; visualizar histórico; gerar relatórios; visualizar dashboard; autenticação; gerenciar permissões.

**Não Funcionais (RNF01–RNF10):** resposta ≤ 3s; disponibilidade ≥ 99%; senhas criptografadas; suporte a Chrome/Edge/Firefox; acesso restrito a autenticados; responsividade (desktop/tablet/smartphone); MySQL; rastreabilidade inalterável; uploads em JPG/JPEG/PNG; versionamento via Git/GitHub.

## 📌 Status Atual do Projeto
- [x] Identidade Visual e Design System
- [x] Personas e Perfis de Acesso
- [x] Requisitos Funcionais e Não Funcionais
- [x] Modelagem do Banco de Dados (DDL) e dados iniciais (DML)
- [x] Back-end (API REST com Node.js/Express, autenticação JWT e RBAC)
- [ ] Front-end (interface web com suporte ao Design System)

## 🛠️ Tecnologias
- HTML5
- CSS3
- JavaScript
- Node.js + Express (API REST)
- MySQL (SGBD Relacional)
- Git & GitHub (Controle de Versão)

## 👥 Equipe
- Miguel Porto Franzini
- Gabriel Lopes da Silva
- Fernanda Garcia Nichele
- Geovane Tobias
- Rafael Augusto Lamb