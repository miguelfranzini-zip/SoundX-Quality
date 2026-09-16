const express = require('express');
const router = express.Router();
const manutencaoController = require('../controllers/manutencaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

router.use(authMiddleware);

router.post('/', manutencaoController.criarManutencao);
router.get('/fila', checkRole('Técnico'), manutencaoController.listarFila);
router.put('/:id', checkRole('Técnico'), validarIDParam, manutencaoController.atualizarManutencao);

module.exports = router;