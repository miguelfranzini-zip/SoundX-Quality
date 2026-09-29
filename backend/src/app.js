const express = require('express');
const cors = require('cors');
const path = require('path');

// Garante o carregamento do .env mesmo se executado fora da pasta backend
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

require('./config/database');

const authRoutes = require('./routes/authRoutes');
const foneRoutes = require('./routes/foneRoutes');
const inspecaoRoutes = require('./routes/inspecaoRoutes');
const testeRoutes = require('./routes/testeRoutes');
const manutencaoRoutes = require('./routes/manutencaoRoutes');
const userRoutes = require('./routes/userRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Configuração do CORS (permite Netlify, Vercel, Localhost e requisições públicas da API)
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: Postman, apps, server-to-server)
    if (!origin) return callback(null, true);

    // Permite qualquer origem do Netlify, Vercel ou Localhost
    if (
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Se houver FRONTEND_URL configurada nas variáveis de ambiente
    if (process.env.FRONTEND_URL) {
      const allowed = process.env.FRONTEND_URL.trim().replace(/\/+$/, '').toLowerCase();
      if (origin.toLowerCase() === allowed) {
        return callback(null, true);
      }
    }

    // Permite refletir a origem para compatibilidade máxima com deploy no Netlify
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Responde explicitamente requisições de preflight OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Front-end (pasta pública do projeto — apenas em modo local)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.resolve(__dirname, '../../frontend')));
}

// Rota raiz e API Info (útil para testar direto no navegador se a API está online)
app.get('/', (req, res) => {
  res.json({
    projeto: 'SoundX Quality API',
    status: 'online',
    versao: '1.0.0',
    endpoints: {
      status: '/api/status',
      auth: '/api/auth/login',
      fones: '/api/fones',
      inspecoes: '/api/inspecoes',
      manutencao: '/api/manutencao',
      testes: '/api/testes'
    },
    timestamp: new Date()
  });
});

app.get('/api', (req, res) => {
  res.json({
    projeto: 'SoundX Quality API',
    status: 'online',
    versao: '1.0.0',
    timestamp: new Date()
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/fones', foneRoutes);
app.use('/api/inspecoes', inspecaoRoutes);
app.use('/api/testes', testeRoutes);
app.use('/api/manutencao', manutencaoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-auth', userAuthRoutes);

// Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', versao: '1.0.0', timestamp: new Date() });
});

// Reset administrativo do banco de dados local (mantém apenas os usuários seed)
const db = require('./config/database');
app.post('/api/admin/reset-dados', authMiddleware, (req, res) => {
  const cargoNormalizado = String(req.usuario?.cargo || '').toLowerCase();
  if (cargoNormalizado !== 'admin' && cargoNormalizado !== 'gerente') {
    return res.status(403).json({ mensagem: 'Apenas Admin/Gerente pode resetar os dados.' });
  }

  try {
    const dbModule = require('./config/database');
    // Acessa o localProvider para resetar os dados
    const localProvider = require('./config/database');
    
    // Precisamos resetar o arquivo local_data.json
    const fs = require('fs');
    const path = require('path');
    const DATA_FILE = process.env.VERCEL 
      ? path.join('/tmp', 'local_data.json')
      : path.resolve(__dirname, '../../local_data.json');
    
    // Reinicia com os dados iniciais (apenas funcionários)
    const dadosIniciais = {
      funcionario: [
        { id_funcionario: 1, nome: 'Lucas Silva',   cpf: '123.456.789-00', cargo: 'Inspetor', email: 'lucas@email.com',    senha: '1234' },
        { id_funcionario: 2, nome: 'Marcos Santos', cpf: '234.567.890-11', cargo: 'Técnico',  email: 'tecnico@soundx.com', senha: '1234' },
        { id_funcionario: 3, nome: 'Carlos Souza',  cpf: '345.678.901-22', cargo: 'Admin',    email: 'admin@soundx.com',   senha: '1234' }
      ],
      fone: [],
      inspecao: [],
      teste: [],
      manutencao: []
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(dadosIniciais, null, 2), 'utf-8');
    
    res.json({ 
      mensagem: 'Dados resetados com sucesso. Mantidos apenas os usuários existentes.',
      dados: dadosIniciais.funcionario
    });
  } catch (error) {
    console.error('Erro ao resetar dados:', error);
    res.status(500).json({ mensagem: 'Erro ao resetar dados.' });
  }
});

// Tratamento de erros padrão retornando JSON
app.use((err, req, res, next) => {
  console.error('Erro na API:', err.message);
  res.status(err.status || 500).json({
    erro: true,
    mensagem: err.message || 'Erro interno no servidor'
  });
});

module.exports = app;