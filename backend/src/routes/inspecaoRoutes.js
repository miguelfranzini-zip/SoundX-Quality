const express = require('express');
const router = express.Router();
const inspecaoController = require('../controllers/inspecaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

// Protege todas as rotas de inspeção com o JWT
router.use(authMiddleware);

// Rota do Dashboard (métrica geral)
router.get('/dashboard', inspecaoController.obterDashboard);

// Rotas de listagem e criação de inspeções
router.get('/', inspecaoController.listarInspecoes);
router.post('/', checkRole('Inspetor'), inspecaoController.criarInspecao);

module.exports = router;