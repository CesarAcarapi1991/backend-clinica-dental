// src/routes/historialRoutes.js
const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');
const authenticateToken = require('../middlewares/auth');
const { esOdontologo, esAsistente } = require('../middlewares/roles');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear historial para un paciente (solo odontólogo/admin)
router.post('/paciente/:paciente_id', esOdontologo, historialController.crearHistorial);

// Obtener historial completo de un paciente
router.get('/paciente/:paciente_id', esAsistente, historialController.getHistorialPaciente);

// Gestión de dientes
router.put('/:historial_id/diente/:diente_id/estado', esOdontologo, historialController.actualizarEstadoDiente);

// Gestión de tratamientos
router.post('/:historial_id/diente/:diente_id/programar', esOdontologo, historialController.programarTratamiento);
router.post('/:historial_id/programar-automatico', esOdontologo, historialController.programarAutomatico);

// Registrar atenciones
router.post('/:historial_id/atenciones', esOdontologo, historialController.registrarAtencion);

module.exports = router;