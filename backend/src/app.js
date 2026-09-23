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

const app = express();

const allowedOrigins = [
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/fones', foneRoutes);
app.use('/api/inspecoes', inspecaoRoutes);
app.use('/api/testes', testeRoutes);
app.use('/api/manutencao', manutencaoRoutes);

// Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', versao: '1.0.0', timestamp: new Date() });
});

// Vercel precisa que o app seja exportado, não iniciado com listen
module.exports = app;