// // src/controllers/usuarioController.js - Versión actualizada

// const bcrypt = require('bcrypt');
// const Usuario = require('../models/Usuario');
// const UsuarioStaff = require('../models/UsuarioStaff');
// const Paciente = require('../models/Paciente');

// // Función para generar contraseña por defecto
// const generarPasswordDefault = (documento, nombres, fechaNacimiento) => {
//   // Opción 1: Usar el documento/identificador
//   if (documento) {
//     return `Odont${documento.slice(-6)}2024*`;
//   }
  
//   // Opción 2: Usar combinación de nombre y fecha
//   if (nombres && fechaNacimiento) {
//     const nombrePart = nombres.split(' ')[0].toLowerCase();
//     const fechaPart = fechaNacimiento.split('-').join('').slice(-4);
//     return `${nombrePart}${fechaPart}#`;
//   }
  
//   // Opción 3: Contraseña genérica segura
//   return 'Temporal2024*';
// };

// const usuarioController = {
//   // Crear usuario staff (admin)
//   async crearStaff(req, res) {
//     try {
//       const { 
//         email, 
//         nombres, 
//         apellidos, 
//         rol, 
//         telefono, 
//         numero_licencia, 
//         especialidad, 
//         fecha_contratacion,
//         documento_identidad // Campo adicional opcional
//       } = req.body;

//       // Validar que el tipo sea válido para staff
//       if (rol !== 'odontologo' && rol !== 'asistente') {
//         return res.status(400).json({ error: 'Rol inválido para staff' });
//       }

//       // Verificar si el email ya existe
//       const existingUser = await Usuario.findByEmail(email);
//       if (existingUser) {
//         return res.status(400).json({ error: 'El email ya está registrado' });
//       }

//       // Generar contraseña por defecto
//       const passwordDefault = generarPasswordDefault(
//         numero_licencia || documento_identidad, 
//         nombres,
//         fecha_contratacion
//       );

//       // Hashear contraseña
//       const salt = await bcrypt.genSalt(10);
//       const password_hash = await bcrypt.hash(passwordDefault, salt);

//       // Crear usuario base con cambiar_password = true
//       const newUser = await Usuario.create({
//         email,
//         password_hash,
//         tipo_usuario: rol
//       }); // Nota: cambiar_password es TRUE por defecto en la BD

//       // Crear perfil de staff
//       const staffData = {
//         usuario_id: newUser.id,
//         nombres,
//         apellidos,
//         rol,
//         telefono,
//         numero_licencia,
//         especialidad,
//         fecha_contratacion,
//         comentarios: req.body.comentarios
//       };

//       const newStaff = await UsuarioStaff.create(staffData);

//       res.status(201).json({
//         message: 'Usuario staff creado exitosamente',
//         usuario: {
//           id: newUser.id,
//           email: newUser.email,
//           tipo_usuario: newUser.tipo_usuario
//         },
//         perfil: newStaff,
//         password_temporal: passwordDefault, // En producción, enviar por email
//         nota: 'El usuario debe cambiar su contraseña en el primer inicio de sesión'
//       });

//     } catch (error) {
//       console.error('Error al crear staff:', error);
//       res.status(500).json({ error: 'Error interno del servidor' });
//     }
//   },

//   // Crear paciente (odontólogo o admin)
//   async crearPaciente(req, res) {
//     try {
//       const { 
//         email, 
//         nombres, 
//         apellidos, 
//         fecha_nacimiento, 
//         telefono, 
//         alergias, 
//         direccion, 
//         contacto_emergencia, 
//         telefono_emergencia,
//         documento_identidad // Campo adicional opcional
//       } = req.body;

//       // Verificar si el email ya existe
//       const existingUser = await Usuario.findByEmail(email);
//       if (existingUser) {
//         return res.status(400).json({ error: 'El email ya está registrado' });
//       }

//       // Generar contraseña por defecto (usando documento o fecha de nacimiento)
//       const passwordDefault = generarPasswordDefault(
//         documento_identidad || telefono,
//         nombres,
//         fecha_nacimiento
//       );

//       // Hashear contraseña
//       const salt = await bcrypt.genSalt(10);
//       const password_hash = await bcrypt.hash(passwordDefault, salt);

//       // Crear usuario base con cambiar_password = true
//       const newUser = await Usuario.create({
//         email,
//         password_hash,
//         tipo_usuario: 'paciente'
//       }); // Nota: cambiar_password es TRUE por defecto en la BD

//       // Crear perfil de paciente
//       const pacienteData = {
//         usuario_id: newUser.id,
//         nombres,
//         apellidos,
//         fecha_nacimiento,
//         telefono,
//         alergias,
//         direccion,
//         contacto_emergencia,
//         telefono_emergencia
//       };

//       const newPaciente = await Paciente.create(pacienteData);

//       res.status(201).json({
//         message: 'Paciente creado exitosamente',
//         usuario: {
//           id: newUser.id,
//           email: newUser.email,
//           tipo_usuario: newUser.tipo_usuario
//         },
//         perfil: newPaciente,
//         password_temporal: passwordDefault, // En producción, enviar por email
//         nota: 'El paciente debe cambiar su contraseña en el primer inicio de sesión'
//       });

//     } catch (error) {
//       console.error('Error al crear paciente:', error);
//       res.status(500).json({ error: 'Error interno del servidor' });
//     }
//   },

//   // Método para resetear contraseña (admin)
//   async resetearPassword(req, res) {
//     try {
//       const { usuario_id } = req.params;
      
//       // Verificar que el usuario existe
//       const usuario = await Usuario.findById(usuario_id);
//       if (!usuario) {
//         return res.status(404).json({ error: 'Usuario no encontrado' });
//       }

//       // Generar nueva contraseña temporal
//       const nuevaPassword = `Temp${Math.floor(Math.random() * 10000)}*`;
      
//       // Hashear nueva contraseña
//       const salt = await bcrypt.genSalt(10);
//       const password_hash = await bcrypt.hash(nuevaPassword, salt);

//       // Actualizar contraseña y marcar para cambio
//       await Usuario.cambiarPassword(usuario_id, password_hash);
//       // Asegurar que cambiar_password sea TRUE
//       await Usuario.query(
//         'UPDATE usuarios SET cambiar_password = true WHERE id = $1',
//         [usuario_id]
//       );

//       res.json({
//         message: 'Contraseña reseteada exitosamente',
//         password_temporal: nuevaPassword,
//         nota: 'El usuario debe cambiar su contraseña en el próximo inicio de sesión'
//       });

//     } catch (error) {
//       console.error('Error al resetear password:', error);
//       res.status(500).json({ error: 'Error interno del servidor' });
//     }
//   },

//   // Listar todos los usuarios según tipo (admin)
//   async listarUsuarios(req, res) {
//     try {
//       const { tipo } = req.query;
      
//       if (tipo === 'paciente') {
//         const pacientes = await Paciente.findAll();
//         return res.json(pacientes);
//       } else if (tipo === 'staff') {
//         const odontologos = await UsuarioStaff.findByRol('odontologo');
//         const asistentes = await UsuarioStaff.findByRol('asistente');
//         return res.json({ odontologos, asistentes });
//       }

//       res.status(400).json({ error: 'Tipo de usuario no válido' });

//     } catch (error) {
//       console.error('Error al listar usuarios:', error);
//       res.status(500).json({ error: 'Error interno del servidor' });
//     }
//   }
// };

// module.exports = usuarioController;

// src/controllers/usuarioController.js
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const UsuarioStaff = require('../models/UsuarioStaff');
const Paciente = require('../models/Paciente');

// Función para generar contraseña por defecto
const generarPasswordDefault = (documento, nombres, fechaNacimiento) => {
  if (documento) {
    return `Odont${documento.slice(-6)}2024*`;
  }
  
  if (nombres && fechaNacimiento) {
    const nombrePart = nombres.split(' ')[0].toLowerCase();
    const fechaPart = fechaNacimiento.split('-').join('').slice(-4);
    return `${nombrePart}${fechaPart}#`;
  }
  
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
        documento_identidad
      } = req.body;

      if (rol !== 'odontologo' && rol !== 'asistente') {
        return res.status(400).json({ error: 'Rol inválido para staff' });
      }

      const existingUser = await Usuario.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const passwordDefault = generarPasswordDefault(
        numero_licencia || documento_identidad, 
        nombres,
        fecha_contratacion
      );

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(passwordDefault, salt);

      const newUser = await Usuario.create({
        email,
        password_hash,
        tipo_usuario: rol
      });

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
        password_temporal: passwordDefault,
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
        documento_identidad
      } = req.body;

      const existingUser = await Usuario.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const passwordDefault = generarPasswordDefault(
        documento_identidad || telefono,
        nombres,
        fecha_nacimiento
      );

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(passwordDefault, salt);

      const newUser = await Usuario.create({
        email,
        password_hash,
        tipo_usuario: 'paciente'
      });

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
        password_temporal: passwordDefault,
        nota: 'El paciente debe cambiar su contraseña en el primer inicio de sesión'
      });

    } catch (error) {
      console.error('Error al crear paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // MODIFICAR USUARIO STAFF (admin)
  async modificarStaff(req, res) {
    try {
      const { id } = req.params;
      const { 
        nombres,
        apellidos,
        telefono,
        numero_licencia,
        especialidad,
        comentarios
      } = req.body;

      const staffExistente = await UsuarioStaff.findById(id);
      if (!staffExistente) {
        return res.status(404).json({ error: 'Staff no encontrado' });
      }

      const staffActualizado = await UsuarioStaff.update(id, {
        nombres,
        apellidos,
        telefono,
        numero_licencia,
        especialidad,
        comentarios
      });

      res.json({
        message: 'Staff actualizado exitosamente',
        perfil: staffActualizado
      });

    } catch (error) {
      console.error('Error al modificar staff:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // MODIFICAR PACIENTE (admin, odontólogo o el propio paciente)
  async modificarPaciente(req, res) {
    try {
      const { id } = req.params;
      const {
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        alergias,
        direccion,
        contacto_emergencia,
        telefono_emergencia
      } = req.body;

      const pacienteExistente = await Paciente.findById(id);
      if (!pacienteExistente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Verificar permisos
      if (req.user.tipo_usuario === 'paciente') {
        const usuarioPaciente = await Paciente.findByUsuarioId(req.user.id);
        if (!usuarioPaciente || usuarioPaciente.id !== parseInt(id)) {
          return res.status(403).json({ error: 'No tienes permiso para modificar este paciente' });
        }
      }

      const pacienteActualizado = await Paciente.update(id, {
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        alergias,
        direccion,
        contacto_emergencia,
        telefono_emergencia
      });

      res.json({
        message: 'Paciente actualizado exitosamente',
        paciente: pacienteActualizado
      });

    } catch (error) {
      console.error('Error al modificar paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // CAMBIAR ROL DE STAFF (solo admin)
  async cambiarRolStaff(req, res) {
    try {
      const { id } = req.params;
      const { nuevo_rol } = req.body;

      if (nuevo_rol !== 'odontologo' && nuevo_rol !== 'asistente') {
        return res.status(400).json({ error: 'Rol no válido' });
      }

      const staffExistente = await UsuarioStaff.findById(id);
      if (!staffExistente) {
        return res.status(404).json({ error: 'Staff no encontrado' });
      }

      const query = 'UPDATE usuarios_staff SET rol = $1 WHERE id = $2 RETURNING *';
      const { rows } = await require('../config/database').query(query, [nuevo_rol, id]);
      
      await require('../config/database').query(
        'UPDATE usuarios SET tipo_usuario = $1 WHERE id = $2',
        [nuevo_rol, staffExistente.usuario_id]
      );

      res.json({
        message: 'Rol actualizado exitosamente',
        staff: rows[0]
      });

    } catch (error) {
      console.error('Error al cambiar rol:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ACTIVAR/DESACTIVAR USUARIO (admin)
  async cambiarEstadoUsuario(req, res) {
    try {
      const { usuario_id } = req.params;
      const { activo } = req.body;

      const usuario = await Usuario.findById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.email === 'admin@odontologia.com' && activo === false) {
        return res.status(400).json({ error: 'No puedes desactivar al administrador principal' });
      }

      await require('../config/database').query(
        'UPDATE usuarios SET activo = $1 WHERE id = $2',
        [activo, usuario_id]
      );

      res.json({
        message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
        usuario_id,
        activo
      });

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // OBTENER STAFF POR ID (admin)
  async obtenerStaffPorId(req, res) {
    try {
      const { id } = req.params;
      
      const staff = await UsuarioStaff.findById(id);
      if (!staff) {
        return res.status(404).json({ error: 'Staff no encontrado' });
      }

      const usuario = await Usuario.findById(staff.usuario_id);

      res.json({
        ...staff,
        email: usuario.email,
        activo: usuario.activo,
        ultimo_acceso: usuario.ultimo_acceso,
        cambiar_password: usuario.cambiar_password
      });

    } catch (error) {
      console.error('Error al obtener staff:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // OBTENER PACIENTE POR ID (admin, odontólogo, o el propio paciente)
  async obtenerPacientePorId(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      if (req.user.tipo_usuario === 'paciente') {
        const usuarioPaciente = await Paciente.findByUsuarioId(req.user.id);
        if (!usuarioPaciente || usuarioPaciente.id !== parseInt(id)) {
          return res.status(403).json({ error: 'No autorizado' });
        }
      }

      const usuario = await Usuario.findById(paciente.usuario_id);

      res.json({
        ...paciente,
        email: usuario.email,
        fecha_registro: usuario.fecha_registro,
        ultimo_acceso: usuario.ultimo_acceso,
        activo: usuario.activo
      });

    } catch (error) {
      console.error('Error al obtener paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Resetear contraseña (admin)
  async resetearPassword(req, res) {
    try {
      const { usuario_id } = req.params;
      
      const usuario = await Usuario.findById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const nuevaPassword = `Temp${Math.floor(Math.random() * 10000)}*`;
      
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(nuevaPassword, salt);

      await Usuario.cambiarPassword(usuario_id, password_hash);
      await require('../config/database').query(
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

        for (const odontologo of odontologos) {
          const usuario = await Usuario.findById(odontologo.usuario_id);
          odontologo.email = usuario.email;
          odontologo.activo = usuario.activo;
        }

        for (const asistente of asistentes) {
          const usuario = await Usuario.findById(asistente.usuario_id);
          asistente.email = usuario.email;
          asistente.activo = usuario.activo;
        }

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