# 🎧 SoundGuard Quality - Sistema de Controle de Qualidade de Fones de Ouvido

## 📌 Visão Geral do Projeto
O **SoundGuard Quality** é um sistema desenvolvido para gerenciar, avaliar e rastrear o controle de qualidade e manutenção de fones de ouvido.

Atualmente, o projeto encontra-se em sua etapa inicial de estruturação, contando com a modelagem do banco de dados relacional em MySQL (`controle_qualidade_fones`). Este banco de dados servirá como alicerce para o futuro desenvolvimento da aplicação web.

---

## 👤 Personas do Sistema

### 1. Inspetor de Qualidade (Usuário Operacional)
* **Perfil:** Colaborador encarregado de testar fisicamente e funcionalmente os fones de ouvido no dia a dia.
* **Objetivo:** Executar roteiros de testes de forma ágil e registrar o estado real dos produtos.
* **Principais ações:**
  * Cadastrar novos fones de ouvido e lotes de inspeção no sistema.
  * Executar checklists de testes padronizados (áudio, microfone, conexões e bateria).
  * Registrar não conformidades encontradas e vincular defeitos específicos aos fones.
  * Anexar fotos de evidência das falhas identificadas durante a inspeção.
  * Pesquisar e visualizar o histórico de inspeções realizadas.
* **Mapeamento:** RF01, RF04, RF07, RF08, RF09, RF10, RF11, RF12, RF15 | Tabelas: `funcionario`, `fone`, `inspecao`, `resultado_teste`, `defeito_encontrado`.

### 2. Técnico de Manutenção (Usuário Especialista)
* **Perfil:** Profissional especializado responsável pelo conserto e revisão dos aparelhos reprovados no controle de qualidade.
* **Objetivo:** Consultar o diagnóstico das inspeções para realizar o reparo apropriado e atualizar o histórico do fone.
* **Principais ações:**
  * Consultar falhas e apontamentos registrados pelos inspetores.
  * Registrar serviços de manutenção prestados em cada dispositivo.
  * Atualizar o status do fone no sistema após o reparo.
* **Mapeamento:** RF11, RF12, RF15 | Tabelas: `tecnico`, `manutencao`, `fone`.

### 3. Gerente / Gestor de Qualidade (Usuário Administrativo)
* **Perfil:** Responsável por supervisionar a operação, definir padrões de qualidade e gerenciar o acesso da equipe.
* **Objetivo:** Acompanhar métricas globais de aprovação/reprovação e manter o sistema configurado corretamente.
* **Principais ações:**
  * Cadastrar inspetores e novos critérios ou testes de inspeção.
  * Gerenciar usuários, perfis e permissões de acesso ao sistema.
  * Acompanhar o dashboard com indicadores de desempenho e taxas de defeito.
  * Emitir relatórios analíticos de qualidade.
* **Mapeamento:** RF05, RF06, RF13, RF14, RF15, RF16 | Tabelas: `gerente`, `teste`, `defeito`, `funcionario`.

---

## 🗄️ Estrutura e Funcionalidades do Banco de Dados (`controle_qualidade_fones`)

A base de dados do **SoundGuard Quality** é composta por tabelas interligadas que cobrem todo o fluxo de avaliação, teste, apontamento de defeitos e manutenção dos dispositivos:

1. **`funcionario`**: Armazena o cadastro dos colaboradores responsáveis pela execução das inspeções e operações do sistema, contendo dados de identificação e credenciais de acesso.
2. **`fone`**: Registra as especificações individuais de cada fone de ouvido (número de série, modelo, marca, tipo de conexão, data de fabricação e status atual no fluxo de inspeção).
3. **`inspecao`**: Registra as sessões de inspeção realizadas nos fones, associando a data/hora, o fone inspecionado, o funcionário responsável, o resultado final da avaliação e observações gerais.
4. **`teste`**: Define o catálogo de testes padronizados que podem ser aplicados (ex.: teste de áudio esquerdo/direito, conexão Bluetooth, microfone e bateria), detalhando o objetivo e o valor esperado.
5. **`resultado_teste`**: Guarda o resultado de cada teste individual realizado dentro de uma determinada inspeção, permitindo comparar o valor obtido com o valor esperado.
6. **`defeito`**: Catálogo de defeitos conhecidos, categorizados por nome, descrição e grau de gravidade.
7. **`defeito_encontrado`**: Tabela associativa que vincula os defeitos identificados durante uma inspeção específica, permitindo adicionar observações pontuais.
8. **`tecnico`**: Cadastra os profissionais técnicos especializados para realizar manutenções ou reparos.
9. **`manutencao`**: Registra o histórico de manutenções efetuadas em fones que apresentaram falhas, vinculando o dispositivo, o técnico responsável, o serviço prestado e o status da manutenção.
10. **`gerente`**: Armazena as contas dos gestores do sistema com privilégios administrativos.

---

## 📋 Requisitos do Sistema

### 🛠️ Requisitos Funcionais (RF)
* **RF01 - Cadastrar produtos**: Permite cadastrar fones de ouvido no sistema.
* **RF02 - Editar produtos**: Permite atualizar informações dos fones cadastrados.
* **RF03 - Excluir produtos**: Permite a remoção de fones de ouvido do sistema.
* **RF04 - Cadastrar lotes**: Permite cadastrar e agrupar produtos por lotes de inspeção.
* **RF05 - Cadastrar inspetores**: Permite o cadastro de funcionários responsáveis pelas inspeções.
* **RF06 - Cadastrar critérios de inspeção**: Permite definir parâmetros e critérios para avaliação de qualidade.
* **RF07 - Criar checklists**: Permite a criação de roteiros de testes e verificações.
* **RF08 - Registrar inspeções**: Permite efetuar o lançamento do resultado completo de uma inspeção.
* **RF09 - Registrar não conformidades**: Permite detalhar falhas e problemas detectados nos produtos.
* **RF10 - Anexar fotos nas inspeções**: Permite o envio de evidências fotográficas do estado do produto.
* **RF11 - Pesquisar produtos, lotes e inspeções**: Funcionalidade de busca e filtragem de registros.
* **RF12 - Visualizar histórico de inspeções**: Consulta detalhada do histórico de avaliações realizadas.
* **RF13 - Gerar relatórios**: Emissão de documentos descritivos e sintéticos sobre a qualidade dos produtos.
* **RF14 - Visualizar dashboard com indicadores**: Exibição de painéis gráficos com dados consolidados de desempenho e taxa de aprovação/rejeição.
* **RF15 - Fazer login no sistema**: Autenticação de usuários para acesso seguro.
* **RF16 - Gerenciar usuários e permissões**: Controle de perfis e acessos administrativos no sistema.

### ⚡ Requisitos Não Funcionais (RNF)
* **RNF01 - Desempenho**: O sistema deve responder às requisições em até 3 segundos.
* **RNF02 - Disponibilidade**: O sistema deve estar disponível 99% do tempo.
* **RNF03 - Segurança de Senhas**: As senhas devem ser armazenadas de forma criptografada no banco de dados.
* **RNF04 - Compatibilidade**: O sistema deve ser compatível e funcionar adequadamente nos navegadores Google Chrome, Microsoft Edge e Mozilla Firefox.
* **RNF05 - Autenticação**: Apenas usuários autenticados podem acessar as funcionalidades do sistema.
* **RNF06 - Responsividade**: A interface deve ser responsiva, adaptando-se a telas de computadores, tablets e smartphones.
* **RNF07 - Banco de Dados**: O sistema deve utilizar banco de dados relacional MySQL.
* **RNF08 - Rastreabilidade**: O sistema deve manter um histórico permanente de todas as inspeções realizadas.
* **RNF09 - Formatos de Imagem**: O sistema deve permitir apenas o upload de imagens nos formatos JPG, PNG e JPEG.
* **RNF10 - Controle de Versão**: O projeto deve utilizar Git e GitHub para gerenciamento e versionamento do código.

---

## 📌 Status Atual do Projeto
O projeto **SoundGuard Quality** está em sua etapa inicial, composta por:
- Definido nome oficial do projeto (**SoundGuard Quality**).
- Mapeamento das Personas e Perfis de Acesso.
- Modelagem do banco de dados relacional em MySQL (DDL).
- Povoamento inicial de dados para testes (DML).
- Mapeamento completo dos Requisitos Funcionais e Não Funcionais.

