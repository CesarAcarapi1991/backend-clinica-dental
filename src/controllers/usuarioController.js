// src/controllers/usuarioController.js - Versión actualizada

const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const UsuarioStaff = require('../models/UsuarioStaff');
const Paciente = require('../models/Paciente');

// Función para generar contraseña por defecto
const generarPasswordDefault = (documento, nombres, fechaNacimiento) => {
  // Opción 1: Usar el documento/identificador
  if (documento) {
    return `Odont${documento.slice(-6)}2024*`;
  }
  
  // Opción 2: Usar combinación de nombre y fecha
  if (nombres && fechaNacimiento) {
    const nombrePart = nombres.split(' ')[0].toLowerCase();
    const fechaPart = fechaNacimiento.split('-').join('').slice(-4);
    return `${nombrePart}${fechaPart}#`;
  }
  
  // Opción 3: Contraseña genérica segura
  return 'Temporal2024*';
};

const usuarioController = {
  // Crear usuario staff (admin)
  async crearStaff(req, res) {
    try {
      const { 
        email, 
        nombres, 
        apellidos, 
        rol, 
        telefono, 
        numero_licencia, 
        especialidad, 
        fecha_contratacion,
        documento_identidad // Campo adicional opcional
      } = req.body;

      // Validar que el tipo sea válido para staff
      if (rol !== 'odontologo' && rol !== 'asistente') {
        return res.status(400).json({ error: 'Rol inválido para staff' });
      }

      // Verificar si el email ya existe
      const existingUser = await Usuario.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Generar contraseña por defecto
      const passwordDefault = generarPasswordDefault(
        numero_licencia || documento_identidad, 
        nombres,
        fecha_contratacion
      );

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(passwordDefault, salt);

      // Crear usuario base con cambiar_password = true
      const newUser = await Usuario.create({
        email,
        password_hash,
        tipo_usuario: rol
      }); // Nota: cambiar_password es TRUE por defecto en la BD

      // Crear perfil de staff
      const staffData = {
        usuario_id: newUser.id,
        nombres,
        apellidos,
        rol,
        telefono,
        numero_licencia,
        especialidad,
        fecha_contratacion,
        comentarios: req.body.comentarios
      };

      const newStaff = await UsuarioStaff.create(staffData);

      res.status(201).json({
        message: 'Usuario staff creado exitosamente',
        usuario: {
          id: newUser.id,
          email: newUser.email,
          tipo_usuario: newUser.tipo_usuario
        },
        perfil: newStaff,
        password_temporal: passwordDefault, // En producción, enviar por email
        nota: 'El usuario debe cambiar su contraseña en el primer inicio de sesión'
      });

    } catch (error) {
      console.error('Error al crear staff:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear paciente (odontólogo o admin)
  async crearPaciente(req, res) {
    try {
      const { 
        email, 
        nombres, 
        apellidos, 
        fecha_nacimiento, 
        telefono, 
        alergias, 
        direccion, 
        contacto_emergencia, 
        telefono_emergencia,
        documento_identidad // Campo adicional opcional
      } = req.body;

      // Verificar si el email ya existe
      const existingUser = await Usuario.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Generar contraseña por defecto (usando documento o fecha de nacimiento)
      const passwordDefault = generarPasswordDefault(
        documento_identidad || telefono,
        nombres,
        fecha_nacimiento
      );

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(passwordDefault, salt);

      // Crear usuario base con cambiar_password = true
      const newUser = await Usuario.create({
        email,
        password_hash,
        tipo_usuario: 'paciente'
      }); // Nota: cambiar_password es TRUE por defecto en la BD

      // Crear perfil de paciente
      const pacienteData = {
        usuario_id: newUser.id,
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        alergias,
        direccion,
        contacto_emergencia,
        telefono_emergencia
      };

      const newPaciente = await Paciente.create(pacienteData);

      res.status(201).json({
        message: 'Paciente creado exitosamente',
        usuario: {
          id: newUser.id,
          email: newUser.email,
          tipo_usuario: newUser.tipo_usuario
        },
        perfil: newPaciente,
        password_temporal: passwordDefault, // En producción, enviar por email
        nota: 'El paciente debe cambiar su contraseña en el primer inicio de sesión'
      });

    } catch (error) {
      console.error('Error al crear paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Método para resetear contraseña (admin)
  async resetearPassword(req, res) {
    try {
      const { usuario_id } = req.params;
      
      // Verificar que el usuario existe
      const usuario = await Usuario.findById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Generar nueva contraseña temporal
      const nuevaPassword = `Temp${Math.floor(Math.random() * 10000)}*`;
      
      // Hashear nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(nuevaPassword, salt);

      // Actualizar contraseña y marcar para cambio
      await Usuario.cambiarPassword(usuario_id, password_hash);
      // Asegurar que cambiar_password sea TRUE
      await Usuario.query(
        'UPDATE usuarios SET cambiar_password = true WHERE id = $1',
        [usuario_id]
      );

      res.json({
        message: 'Contraseña reseteada exitosamente',
        password_temporal: nuevaPassword,
        nota: 'El usuario debe cambiar su contraseña en el próximo inicio de sesión'
      });

    } catch (error) {
      console.error('Error al resetear password:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Listar todos los usuarios según tipo (admin)
  async listarUsuarios(req, res) {
    try {
      const { tipo } = req.query;
      
      if (tipo === 'paciente') {
        const pacientes = await Paciente.findAll();
        return res.json(pacientes);
      } else if (tipo === 'staff') {
        const odontologos = await UsuarioStaff.findByRol('odontologo');
        const asistentes = await UsuarioStaff.findByRol('asistente');
        return res.json({ odontologos, asistentes });
      }

      res.status(400).json({ error: 'Tipo de usuario no válido' });

    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = usuarioController;