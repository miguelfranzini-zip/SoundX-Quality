const express = require('express');
const router = express.Router();
const manutencaoController = require('../controllers/manutencaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

router.use(authMiddleware);

// Inspetor, Gerente, Técnico e Admin podem abrir/solicitar manutenção
router.post('/', checkRole('Inspetor', 'Gerente', 'Técnico', 'Admin'), manutencaoController.criarManutencao);

// Listagem geral com filtros (histórico / auditoria)
router.get('/', checkRole('Admin', 'Gerente', 'Técnico', 'Inspetor'), manutencaoController.listarManutencoes);

// Fila operacional de fones aguardando reparo
router.get('/fila', checkRole('Técnico', 'Gerente', 'Admin'), manutencaoController.listarFila);

// Técnico assume a ordem de manutenção
router.put('/:id/assumir', checkRole('Técnico', 'Gerente', 'Admin'), validarIDParam, manutencaoController.assumirManutencao);

// Atualização de diagnóstico, ação corretiva e status
router.put('/:id', checkRole('Técnico', 'Gerente', 'Admin'), validarIDParam, manutencaoController.atualizarManutencao);

// Exclusão de ordem de manutenção (restrito a Admin)
router.delete('/:id', checkRole('Admin'), validarIDParam, manutencaoController.excluirManutencao);

module.exports = router;
