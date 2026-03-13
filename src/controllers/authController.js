// src/controllers/authController.js - Versión actualizada

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const UsuarioStaff = require('../models/UsuarioStaff');
const Paciente = require('../models/Paciente');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar entrada
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Buscar usuario
      const usuario = await Usuario.findByEmail(email);
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar si está bloqueado
      if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        return res.status(403).json({ 
          error: 'Usuario bloqueado temporalmente',
          bloqueado_hasta: usuario.bloqueado_hasta 
        });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValida) {
        await Usuario.incrementarIntentosFallidos(email);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Resetear intentos fallidos
      await Usuario.resetearIntentosFallidos(email);
      await Usuario.updateLastAccess(usuario.id);

      // Obtener información adicional según tipo
      let perfil = null;
      if (usuario.tipo_usuario !== 'admin') {
        if (usuario.tipo_usuario === 'paciente') {
          perfil = await Paciente.findByUsuarioId(usuario.id);
        } else {
          perfil = await UsuarioStaff.findByUsuarioId(usuario.id);
        }
      }

      // Verificar si debe cambiar la contraseña
      const debeCambiarPassword = usuario.cambiar_password;

      // Generar token
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          tipo_usuario: usuario.tipo_usuario,
          debeCambiarPassword: debeCambiarPassword
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login exitoso',
        token,
        debeCambiarPassword: debeCambiarPassword,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario,
          cambiar_password: usuario.cambiar_password,
        //   perfil
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async cambiarPassword(req, res) {
    try {
      const { password_actual, password_nuevo } = req.body;
      const usuarioId = req.user.id;

      // Validaciones
      if (!password_actual || !password_nuevo) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      if (password_nuevo.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      if (password_actual === password_nuevo) {
        return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
      }

      // Obtener usuario actual
      const usuario = await Usuario.findById(usuarioId);
      const usuarioCompleto = await Usuario.findByEmail(usuario.email);

      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(password_actual, usuarioCompleto.password_hash);
      if (!passwordValida) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Hashear nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(password_nuevo, salt);

      // Actualizar contraseña y marcar como cambiada
      await Usuario.cambiarPassword(usuarioId, newPasswordHash);

      // Generar nuevo token sin la bandera de cambio de password
      const nuevoToken = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          tipo_usuario: usuario.tipo_usuario,
          debeCambiarPassword: false
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({ 
        message: 'Contraseña actualizada exitosamente',
        token: nuevoToken
      });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Middleware para verificar si debe cambiar password
  async verificarCambioPassword(req, res, next) {
    try {
      if (req.user && req.user.cambiar_password) {
        // Permitir solo rutas de cambio de password
        const rutasPermitidas = ['/api/auth/cambiar-password'];
        
        if (!rutasPermitidas.includes(req.path)) {
          return res.status(403).json({ 
            error: 'Debes cambiar tu contraseña antes de continuar',
            requiereCambioPassword: true
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;