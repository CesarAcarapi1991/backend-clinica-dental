// const express = require('express');
// const router = express.Router();
// const authenticateToken = require('../middlewares/auth');
// const { esAsistente } = require('../middlewares/roles');
// // Aquí irían los controladores de paciente si se necesitan más endpoints

// // Ejemplo de ruta para que el paciente vea su propio perfil
// router.get('/mi-perfil', authenticateToken, (req, res) => {
//   // Implementar lógica para que el paciente vea su perfil
//   res.json({ message: 'Perfil del paciente', user: req.user });
// });

// module.exports = router;
// src/routes/pacienteRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');
const { esAsistente, esOdontologo, esAdmin } = require('../middlewares/roles');
const pacienteController = require('../controllers/pacienteController');

// Rutas para el propio paciente
router.get('/mi-perfil', authenticateToken, pacienteController.getMiPerfil);
router.put('/mi-perfil', authenticateToken, pacienteController.actualizarMiPerfil);

// Rutas para el historial del paciente (accesible por el propio paciente o staff)
router.get('/:id/historial', authenticateToken, esAsistente, pacienteController.getHistorialPaciente);

// Rutas para administración de pacientes (solo staff)
router.get('/', authenticateToken, esAsistente, pacienteController.listarPacientes);
router.get('/buscar', authenticateToken, esAsistente, pacienteController.buscarPacientes);
router.get('/:id', authenticateToken, esAsistente, pacienteController.getPacienteById);

// Rutas sensibles (solo admin)
router.delete('/:id', authenticateToken, esAdmin, pacienteController.desactivarPaciente);
router.patch('/:id/reactivar', authenticateToken, esAdmin, pacienteController.reactivarPaciente);

module.exports = router;