# 🎧 SoundX Quality — Backend API

API REST para controle de qualidade, registro de testes técnicos e gestão de manutenção na linha de produção de fones de ouvido.

## 🚀 Como Executar o Projeto

1. **Clonar o repositório e instalar dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do backend:
   ```bash
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=controle_qualidade_fones
   JWT_SECRET=soundx_secret_key
   ```

3. **Iniciar o Banco de Dados:**
   Execute o script `database.sql` no phpMyAdmin (XAMPP) ou MySQL Workbench.

4. **Executar o servidor:**
   ```bash
   npm start
   ```

   A API e o Front-end rodarão integrados em http://localhost:3001.

## 📋 Tabela de Endpoints (CRUD & RBAC)

| Método | Endpoint                 | Protegido | Cargos Permitidos     | Descrição                                   |
| ------ | ------------------------ | --------- | --------------------- | ------------------------------------------- |
| POST   | /api/auth/login          | Não       | Público               | Autenticação e geração de token JWT         |
| GET    | /api/fones               | Sim       | Todos autenticados    | Lista todos os fones cadastrados            |
| POST   | /api/fones               | Sim       | Admin, Inspetor       | Cadastra um novo fone                       |
| PUT    | /api/fones/:id           | Sim       | Admin, Inspetor       | Atualiza dados de um fone                   |
| DELETE | /api/fones/:id           | Sim       | Admin                 | Exclui um fone e histórico em cascata      |
| GET    | /api/fones/:id/historico | Sim       | Todos autenticados    | Exibe a rastreabilidade completa do fone    |
| GET    | /api/inspecoes           | Sim       | Todos autenticados    | Lista o histórico geral de inspeções        |
| GET    | /api/inspecoes/dashboard | Sim       | Todos autenticados    | Métricas e indicadores em tempo real        |
| POST   | /api/inspecoes           | Sim       | Admin, Inspetor       | Registra uma nova inspeção                  |
| PUT    | /api/inspecoes/:id       | Sim       | Admin, Inspetor       | Atualiza parecer/resultado da inspeção      |
| DELETE | /api/inspecoes/:id       | Sim       | Admin                 | Exclui uma inspeção e seus testes           |
| GET    | /api/testes/inspecao/:id | Sim       | Todos autenticados    | Lista testes de uma inspeção                |
| POST   | /api/testes              | Sim       | Admin, Inspetor       | Registra teste técnico individual           |
| PUT    | /api/testes/:id          | Sim       | Admin, Inspetor       | Atualiza parâmetros/resultado do teste      |
| DELETE | /api/testes/:id          | Sim       | Admin, Inspetor       | Remove teste técnico avulso                 |
| GET    | /api/manutencao/fila     | Sim       | Admin, Técnico        | Lista fila de fones aguardando reparo       |
| POST   | /api/manutencao          | Sim       | Todos autenticados    | Abre ordem de serviço de manutenção manual  |
| PUT    | /api/manutencao/:id      | Sim       | Admin, Técnico        | Atualiza status, ação corretiva e defeito   |
| DELETE | /api/manutencao/:id      | Sim       | Admin                 | Exclui ordem de manutenção                  |

> **Nota:** Usuários com cargo `Admin` ou `Gerente` possuem acesso irrestrito a todas as rotas protegidas.

## 🧪 Exemplos de Payloads (Thunder Client)

### Login (POST /api/auth/login)

```json
{
  "email": "lucas@email.com",
  "senha": "1234"
}
```

### Criar Inspeção (POST /api/inspecoes)

```json
{
  "id_fone": 1,
  "resultado_final": "Reprovado / Manutenção",
  "observacao": "Falha de áudio no driver esquerdo."
}
```

### Concluir Manutenção (PUT /api/manutencao/1)

```json
{
  "status": "Concluido",
  "acao_corretiva": "Troca do componente e solda reffeita."
}
```