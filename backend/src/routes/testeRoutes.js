const express = require('express');
const router = express.Router();
const testeController = require('../controllers/testeController');
const authMiddleware = require('../middlewares/authMiddleware');

const checkRole = require('../middlewares/roleMiddleware');

const { validarIDParam } = require('../middlewares/validarIdMiddleware');

// Protege todas as rotas com JWT
router.use(authMiddleware);

router.post('/', checkRole('Inspetor'), testeController.cadastrarTeste);
router.get('/inspecao/:id_inspecao', testeController.listarTestesPorInspecao);
router.put('/:id', checkRole('Inspetor'), validarIDParam, testeController.atualizarTeste);
router.delete('/:id', checkRole('Inspetor'), validarIDParam, testeController.excluirTeste);

module.exports = router;