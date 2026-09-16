const express = require('express');
const router = express.Router();
const testeController = require('../controllers/testeController');
const authMiddleware = require('../middlewares/authMiddleware');

const checkRole = require('../middlewares/roleMiddleware');

// Protege todas as rotas com JWT
router.use(authMiddleware);

router.post('/', checkRole('Inspetor'), testeController.cadastrarTeste);
router.get('/inspecao/:id_inspecao', testeController.listarTestesPorInspecao);

module.exports = router;