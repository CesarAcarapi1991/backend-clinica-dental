// const express = require('express');
// const router = express.Router();
// const citaController = require('../controllers/citaController');
// const authenticateToken = require('../middlewares/auth');
// const { esOdontologo, esAsistente, esPaciente } = require('../middlewares/roles');

// // Todas las rutas requieren autenticación
// router.use(authenticateToken);

// // Configuración de horarios (solo admin/odontólogo)
// router.post('/horarios', esOdontologo, citaController.configurarHorarios);
// router.post('/bloquear', esOdontologo, citaController.bloquearAgenda);

// // Consultar disponibilidad
// router.get('/disponibilidad', esAsistente, citaController.horariosDisponibles);

// // Gestión de citas
// router.post('/', esAsistente, citaController.crearCita);
// router.get('/paciente/:paciente_id', esAsistente, citaController.citasPaciente);
// router.get('/odontologo/:odontologo_id', esOdontologo, citaController.citasOdontologo);
// router.get('/:id', esAsistente, citaController.detalleCita);
// router.patch('/:id/estado', esAsistente, citaController.actualizarEstado);

// module.exports = citaController;

// src/routes/citaRoutes.js
const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const authenticateToken = require('../middlewares/auth');
const { esOdontologo, esAsistente, esPaciente } = require('../middlewares/roles');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Configuración de horarios (solo admin/odontólogo)
router.post('/horarios', esOdontologo, citaController.configurarHorarios);
router.post('/bloquear', esOdontologo, citaController.bloquearAgenda);

// Consultar disponibilidad
router.get('/disponibilidad', esAsistente, citaController.horariosDisponibles);

// 📋 NUEVAS RUTAS PARA LISTADO DE CITAS
router.get('/listar', esAsistente, citaController.listarCitas);
router.get('/estadisticas', esAsistente, citaController.estadisticasCitas);
router.get('/dia', esAsistente, citaController.citasDelDia);

// Gestión de citas
router.post('/', esAsistente, citaController.crearCita);
router.get('/paciente/:paciente_id', esAsistente, citaController.citasPaciente);
router.get('/odontologo/:odontologo_id', esOdontologo, citaController.citasOdontologo);
router.get('/:id', esAsistente, citaController.detalleCita);
router.patch('/:id/estado', esAsistente, citaController.actualizarEstado);

// ✅ Exportar el router, NO el controlador
module.exports = router;