const express = require('express');
const router = express.Router();
const foneController = require('../controllers/foneController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

const checkRole = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', foneController.listarFones);
router.post('/', checkRole('Inspetor', 'Gerente'), foneController.cadastrarFone);
router.get('/:id/historico', validarIDParam, foneController.obterHistorico);
router.put('/:id', checkRole('Inspetor', 'Gerente'), validarIDParam, foneController.atualizarFone);
router.delete('/:id', checkRole('Admin'), validarIDParam, foneController.excluirFone);

module.exports = router;