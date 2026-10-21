# 🎧 SoundX Quality — Backend API

> 🌐 **Frontend Oficial (Netlify):** [https://soundxquality.netlify.app/](https://soundxquality.netlify.app/)  
> 🚀 **API em Produção (Vercel):** [https://sound-x-quality.vercel.app](https://sound-x-quality.vercel.app)

API REST para controle de qualidade, registro de testes técnicos e gestão de manutenção na linha de produção de fones de ouvido.

## 🚀 Como Executar o Projeto

1. **Clonar o repositório e instalar dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do backend (ou use o fallback local automático):
   ```bash
   PORT=3001
   DATABASE_URL=postgresql://postgres:senha@host.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=soundx_secret_key_2026
   FRONTEND_URL=http://localhost:3001
   ```
   > **Nota de Resiliência:** Caso a variável `DATABASE_URL` não seja informada ou o banco PostgreSQL esteja indisponível, a API ativa automaticamente o **Provedor Local JSON (`local_data.json`)**, permitindo execução completa e persistente sem dependência de banco externo.

3. **Executar o servidor:**
   ```bash
   npm start
   ```

   A API e o Front-end rodarão integrados em http://localhost:3001.

## 📋 Tabela de Endpoints (CRUD & RBAC)

| Método | Endpoint                 | Protegido | Cargos Permitidos     | Descrição                                   |
| ------ | ------------------------ | --------- | --------------------- | ------------------------------------------- |
| POST   | /api/auth/login          | Não       | Público               | Autenticação e geração de token JWT         |
| POST   | /api/user-auth/change-password | Sim | Todos autenticados    | Alteração de senha do usuário conectado     |
| GET    | /api/users               | Sim       | Admin                 | Lista todos os usuários cadastrados         |
| POST   | /api/users               | Sim       | Admin                 | Cadastra novo usuário/funcionário           |
| GET    | /api/fones               | Sim       | Todos autenticados    | Lista todos os fones cadastrados            |
| POST   | /api/fones               | Sim       | Admin, Inspetor       | Cadastra um novo fone (com número e lote)   |
| PUT    | /api/fones/:id           | Sim       | Admin, Inspetor       | Atualiza dados de um fone                   |
| DELETE | /api/fones/:id           | Sim       | Admin                 | Exclui um fone e histórico em cascata      |
| GET    | /api/fones/:id/historico | Sim       | Todos autenticados    | Exibe a rastreabilidade completa do fone    |
| GET    | /api/inspecoes           | Sim       | Todos autenticados    | Lista o histórico geral de inspeções        |
| GET    | /api/inspecoes/dashboard | Sim       | Todos autenticados    | Métricas e indicadores em tempo real        |
| POST   | /api/inspecoes           | Sim       | Admin, Inspetor       | Registra nova inspeção (+ checklist e foto) |
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
| POST   | /api/admin/reset-dados   | Sim       | Admin                 | Restaura base para estado inicial (senhas protegidas) |

> **Nota de RBAC:** Apenas usuários com perfil `Admin` têm autorização para exclusões destrutivas (DELETE) e reset de base, preservando a auditoria da fábrica.

## 🧪 Testes Automatizados

Para rodar a suíte completa de testes de integração (16 validações cobrindo autenticação, transações, invariante de O.S., coerência de checklist e sanitização de URLs):

```bash
npm test
```

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