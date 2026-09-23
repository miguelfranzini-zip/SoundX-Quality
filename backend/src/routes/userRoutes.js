const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Criar novo usuário (apenas Admin)
router.post('/', authMiddleware, roleMiddleware('admin'), userController.createUser);

// Listar usuários (apenas Admin)
router.get('/', authMiddleware, roleMiddleware('admin'), userController.listUsers);

module.exports = router;
