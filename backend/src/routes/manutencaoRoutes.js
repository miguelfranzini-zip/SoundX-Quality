const express = require('express');
const router = express.Router();
const manutencaoController = require('../controllers/manutencaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

router.use(authMiddleware);

router.post('/', manutencaoController.criarManutencao);
router.get('/fila', checkRole('Técnico', 'Gerente'), manutencaoController.listarFila);
router.put('/:id', checkRole('Técnico', 'Gerente'), validarIDParam, manutencaoController.atualizarManutencao);
router.delete('/:id', checkRole('Admin'), validarIDParam, manutencaoController.excluirManutencao);

module.exports = router;