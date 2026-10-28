const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validarIDParam } = require('../middlewares/validarIdMiddleware');

// Criar novo usuário (apenas Admin)
router.post('/', authMiddleware, roleMiddleware('admin'), userController.createUser);

// Listar usuários ativos (apenas Admin). ?excluidos=1 lista os excluídos (histórico preservado).
router.get('/', authMiddleware, roleMiddleware('admin'), userController.listUsers);

// Exclusão lógica (soft delete) — apenas Admin. Preserva histórico.
router.delete('/:id', authMiddleware, roleMiddleware('admin'), validarIDParam, userController.deleteUser);

// Restaurar um usuário excluído (reativação) — apenas Admin
router.post('/:id/restaurar', authMiddleware, roleMiddleware('admin'), validarIDParam, userController.restoreUser);

module.exports = router;
