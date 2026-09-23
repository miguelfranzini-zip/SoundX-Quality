const express = require('express');
const router = express.Router();
const inspecaoController = require('../controllers/inspecaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

const { validarIDParam } = require('../middlewares/validarIdMiddleware');

// Protege todas as rotas de inspeção com o JWT
router.use(authMiddleware);

// Rota do Dashboard (métrica geral)
router.get('/dashboard', inspecaoController.obterDashboard);

// Rotas de listagem, criação, edição e exclusão de inspeções
router.get('/', inspecaoController.listarInspecoes);
router.post('/', checkRole('Inspetor'), inspecaoController.criarInspecao);
router.put('/:id', checkRole('Inspetor'), validarIDParam, inspecaoController.atualizarInspecao);
router.delete('/:id', checkRole('Admin'), validarIDParam, inspecaoController.excluirInspecao);

module.exports = router;