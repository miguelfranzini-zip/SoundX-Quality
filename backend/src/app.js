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

app.use(cors());
app.use(express.json());

// Front-end (pasta publica do projeto)
app.use(express.static(path.resolve(__dirname, '../../frontend')));

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

module.exports = app;