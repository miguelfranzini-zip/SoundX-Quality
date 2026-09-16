const express = require('express');
const router = express.Router();
const testeController = require('../controllers/testeController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protege todas as rotas com JWT
router.use(authMiddleware);

router.post('/', testeController.cadastrarTeste);
router.get('/inspecao/:id_inspecao', testeController.listarTestesPorInspecao);

module.exports = router;