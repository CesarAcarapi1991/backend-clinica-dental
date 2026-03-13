const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authenticateToken = require('../middlewares/auth');
const { esAdmin, esOdontologo } = require('../middlewares/roles');

// Rutas protegidas
router.post('/staff', authenticateToken, esAdmin, usuarioController.crearStaff);
router.post('/paciente', authenticateToken, esOdontologo, usuarioController.crearPaciente);
router.get('/', authenticateToken, esAdmin, usuarioController.listarUsuarios);

module.exports = router;