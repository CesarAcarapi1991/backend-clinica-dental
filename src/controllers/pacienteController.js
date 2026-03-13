// src/controllers/pacienteController.js
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

const pacienteController = {
  // Obtener perfil del paciente autenticado
  async getMiPerfil(req, res) {
    try {
      const usuarioId = req.user.id;
      
      const paciente = await Paciente.findByUsuarioId(usuarioId);
      if (!paciente) {
        return res.status(404).json({ error: 'Perfil de paciente no encontrado' });
      }

      // Obtener datos del usuario
      const usuario = await Usuario.findById(usuarioId);

      res.json({
        paciente: {
          id: paciente.id,
          nombres: paciente.nombres,
          apellidos: paciente.apellidos,
          email: usuario.email,
          fecha_nacimiento: paciente.fecha_nacimiento,
          telefono: paciente.telefono,
          alergias: paciente.alergias,
          direccion: paciente.direccion,
          contacto_emergencia: paciente.contacto_emergencia,
          telefono_emergencia: paciente.telefono_emergencia,
          fecha_registro: usuario.fecha_registro,
          ultimo_acceso: usuario.ultimo_acceso
        }
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar perfil del paciente (el propio paciente o admin/odontólogo)
  async actualizarMiPerfil(req, res) {
    try {
      const usuarioId = req.user.id;
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

      // Buscar el paciente por usuario_id
      const paciente = await Paciente.findByUsuarioId(usuarioId);
      if (!paciente) {
        return res.status(404).json({ error: 'Perfil de paciente no encontrado' });
      }

      // Actualizar datos
      const pacienteActualizado = await Paciente.update(paciente.id, {
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
        message: 'Perfil actualizado exitosamente',
        paciente: pacienteActualizado
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los pacientes (solo admin/odontólogo/asistente)
  async listarPacientes(req, res) {
    try {
      const pacientes = await Paciente.findAll();
      
      // Enriquecer con datos de usuario
      const pacientesConDatos = await Promise.all(
        pacientes.map(async (p) => {
          const usuario = await Usuario.findById(p.usuario_id);
          return {
            ...p,
            email: usuario?.email,
            activo: usuario?.activo,
            ultimo_acceso: usuario?.ultimo_acceso
          };
        })
      );

      res.json(pacientesConDatos);

    } catch (error) {
      console.error('Error al listar pacientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un paciente por ID (solo admin/odontólogo/asistente)
  async getPacienteById(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Obtener datos del usuario
      const usuario = await Usuario.findById(paciente.usuario_id);

      res.json({
        ...paciente,
        email: usuario?.email,
        fecha_registro: usuario?.fecha_registro,
        ultimo_acceso: usuario?.ultimo_acceso,
        cambiar_password: usuario?.cambiar_password,
        bloqueado: usuario?.bloqueado_hasta ? new Date(usuario.bloqueado_hasta) > new Date() : false
      });

    } catch (error) {
      console.error('Error al obtener paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Buscar pacientes por término (nombre, email, teléfono)
  async buscarPacientes(req, res) {
    try {
      const { termino } = req.query;
      
      if (!termino || termino.length < 3) {
        return res.status(400).json({ error: 'El término de búsqueda debe tener al menos 3 caracteres' });
      }

      // Búsqueda en la base de datos
      const query = `
        SELECT p.*, u.email, u.activo 
        FROM pacientes p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE 
          u.activo = true AND (
          p.nombres ILIKE $1 OR 
          p.apellidos ILIKE $1 OR 
          u.email ILIKE $1 OR
          p.telefono ILIKE $1
          )
        ORDER BY p.apellidos, p.nombres
        LIMIT 20
      `;
      
      const { rows } = await require('../config/database').query(query, [`%${termino}%`]);
      
      res.json(rows);

    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Desactivar paciente (soft delete) - solo admin
  async desactivarPaciente(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Desactivar el usuario (soft delete)
      await require('../config/database').query(
        'UPDATE usuarios SET activo = false WHERE id = $1',
        [paciente.usuario_id]
      );

      res.json({ message: 'Paciente desactivado exitosamente' });

    } catch (error) {
      console.error('Error al desactivar paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Reactivar paciente - solo admin
  async reactivarPaciente(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Reactivar el usuario
      await require('../config/database').query(
        'UPDATE usuarios SET activo = true WHERE id = $1',
        [paciente.usuario_id]
      );

      res.json({ message: 'Paciente reactivado exitosamente' });

    } catch (error) {
      console.error('Error al reactivar paciente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener historial de citas/tratamientos del paciente
  async getHistorialPaciente(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el paciente existe
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Aquí iría la lógica para obtener citas/tratamientos
      // Como no tenemos esas tablas aún, devolvemos un placeholder
      
      res.json({
        paciente: `${paciente.nombres} ${paciente.apellidos}`,
        mensaje: 'Módulo de historial en desarrollo',
        // Esto se expandirá cuando agreguemos citas y tratamientos realizados
        historial: []
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = pacienteController;