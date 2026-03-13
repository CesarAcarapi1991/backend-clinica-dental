const express = require('express');
const router = express.Router();
const tratamientoController = require('../controllers/tratamientoController');
const authenticateToken = require('../middlewares/auth');
const { esOdontologo, esPaciente } = require('../middlewares/roles');

// Rutas públicas (requieren autenticación)
router.get('/', authenticateToken, esPaciente, tratamientoController.listar);
router.get('/:id', authenticateToken, esPaciente, tratamientoController.obtenerPorId);

// Rutas solo para admin y odontólogos
router.post('/', authenticateToken, esOdontologo, tratamientoController.crear);
router.put('/:id', authenticateToken, esOdontologo, tratamientoController.actualizar);
router.delete('/:id', authenticateToken, esOdontologo, tratamientoController.desactivar);
router.patch('/:id/reactivar', authenticateToken, esOdontologo, tratamientoController.reactivar);

module.exports = router;