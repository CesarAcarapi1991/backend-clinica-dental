// // src/app.js - Versión actualizada

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes');
// const usuarioRoutes = require('./routes/usuarioRoutes');
// const tratamientoRoutes = require('./routes/tratamientoRoutes');
// const pacienteRoutes = require('./routes/pacienteRoutes');
// const authenticateToken = require('./middlewares/auth');
// const forcePasswordChange = require('./middlewares/forcePasswordChange');

// const app = express();

// // Middlewares
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Middleware de autenticación global (opcional, aplicar por ruta)
// // app.use(authenticateToken); // Si quieres proteger todas las rutas

// // Rutas públicas
// app.use('/api/auth', authRoutes);

// // Middleware para forzar cambio de contraseña en rutas protegidas
// // Nota: Este middleware debe ir DESPUÉS de authenticateToken
// app.use('/api', authenticateToken, forcePasswordChange);

// // Rutas protegidas
// app.use('/api/usuarios', usuarioRoutes);
// app.use('/api/tratamientos', tratamientoRoutes);
// app.use('/api/pacientes', pacienteRoutes);

// // Ruta de prueba pública
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     message: 'API de Odontología funcionando',
//     timestamp: new Date()
//   });
// });

// // Manejo de errores 404
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Ruta no encontrada' });
// });

// // Middleware de manejo de errores global
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Error interno del servidor',
//     message: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// module.exports = app;

// src/app.js - Versión corregida
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const citaRoutes = require('./routes/citaRoutes');
const authenticateToken = require('./middlewares/auth');
const forcePasswordChange = require('./middlewares/forcePasswordChange');
const historialRoutes = require('./routes/historialRoutes');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Ruta de prueba pública
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de Odontología funcionando',
    timestamp: new Date()
  });
});

// Middleware de autenticación para rutas protegidas
app.use('/api', authenticateToken);

// Middleware para forzar cambio de contraseña (después de autenticación)
app.use('/api', forcePasswordChange);

// Rutas protegidas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/historial', historialRoutes);

// Manejo de errores 404 - CORREGIDO
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Error de validación de JWT
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
  });
});

module.exports = app;