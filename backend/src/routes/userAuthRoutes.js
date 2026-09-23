const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota para alterar senha (requer autenticação)
router.post('/change-password', authMiddleware, userAuthController.changePassword);

module.exports = router;