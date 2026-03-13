const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/cambiar-password', authenticateToken, authController.cambiarPassword);

module.exports = router;