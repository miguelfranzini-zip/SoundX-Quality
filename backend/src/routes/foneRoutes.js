const express = require('express');
const router = express.Router();
const foneController = require('../controllers/foneController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

router.use(authMiddleware);

router.get('/', foneController.listarFones);
router.post('/', foneController.cadastrarFone);
router.get('/:id/historico', validarIDParam, foneController.obterHistorico); // <-- Rota do histórico

module.exports = router;