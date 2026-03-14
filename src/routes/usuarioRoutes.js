// const express = require('express');
// const router = express.Router();
// const usuarioController = require('../controllers/usuarioController');
// const authenticateToken = require('../middlewares/auth');
// const { esAdmin, esOdontologo } = require('../middlewares/roles');

// // Rutas protegidas
// router.post('/staff', authenticateToken, esAdmin, usuarioController.crearStaff);
// router.post('/paciente', authenticateToken, esOdontologo, usuarioController.crearPaciente);
// router.get('/', authenticateToken, esAdmin, usuarioController.listarUsuarios);

// module.exports = router;


// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authenticateToken = require('../middlewares/auth');
const { esAdmin, esOdontologo, esAsistente } = require('../middlewares/roles');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de creación
router.post('/staff', esAdmin, usuarioController.crearStaff);
router.post('/paciente', esOdontologo, usuarioController.crearPaciente);

// Rutas de listado
router.get('/', esAdmin, usuarioController.listarUsuarios);

// Rutas de obtención por ID
router.get('/staff/:id', esAdmin, usuarioController.obtenerStaffPorId);
router.get('/paciente/:id', esAsistente, usuarioController.obtenerPacientePorId);

// Rutas de modificación
router.put('/staff/:id', esAdmin, usuarioController.modificarStaff);
router.put('/paciente/:id', esOdontologo, usuarioController.modificarPaciente);

// Rutas específicas
router.patch('/staff/:id/rol', esAdmin, usuarioController.cambiarRolStaff);
router.patch('/:usuario_id/estado', esAdmin, usuarioController.cambiarEstadoUsuario);
router.post('/:usuario_id/reset-password', esAdmin, usuarioController.resetearPassword);

// ✅ Verificar que todas las funciones existen en usuarioController
console.log('✅ usuarioRoutes cargado correctamente');

module.exports = router;