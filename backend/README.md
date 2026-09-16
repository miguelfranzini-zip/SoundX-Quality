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
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=controle_qualidade_fones
   JWT_SECRET=soundx_secret_key
   ```

3. **Iniciar o Banco de Dados:**
   Execute o script `setup_database.sql` no phpMyAdmin / MySQL Workbench.

4. **Executar o servidor:**
   ```bash
   npm run dev
   ```

   A API rodará em http://localhost:3000.

## 📋 Tabela de Endpoints

| Método | Endpoint                 | Protegido | Cargos Permitidos     | Descrição                                   |
| ------ | ------------------------ | --------- | --------------------- | ------------------------------------------- |
| POST   | /api/auth/login          | Não       | Público               | Autenticação do usuário                     |
| GET    | /api/fones               | Sim       | Todos                 | Lista todos os fones cadastrados            |
| POST   | /api/fones               | Sim       | Admin, Inspetor       | Cadastra um novo fone                       |
| GET    | /api/fones/:id/historico | Sim       | Todos                 | Exibe a rastreabilidade completa do fone    |
| POST   | /api/inspecoes           | Sim       | Admin, Inspetor       | Registra uma nova inspeção                  |
| POST   | /api/testes              | Sim       | Admin, Inspetor       | Associa testes específicos a uma inspeção   |
| GET    | /api/manutencao/fila     | Sim       | Admin, Técnico        | Lista fones aguardando reparo               |
| PUT    | /api/manutencao/:id      | Sim       | Admin, Técnico        | Atualiza o status do reparo                 |

> **Nota:** O grupo "Admin" e "Gerente" possuem acesso irrestrito a todas as rotas protegidas.

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