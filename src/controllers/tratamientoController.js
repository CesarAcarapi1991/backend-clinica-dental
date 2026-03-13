const Tratamiento = require('../models/Tratamiento');

const tratamientoController = {
  // Crear tratamiento (solo admin y odontólogo)
  async crear(req, res) {
    try {
      const { codigo, nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria } = req.body;

      // Validaciones
      if (!codigo || !nombre || costo_minimo === undefined || costo_maximo === undefined) {
        return res.status(400).json({ error: 'Código, nombre, costo mínimo y máximo son requeridos' });
      }

      // Verificar formato del código
      const codigoRegex = /^[A-Z0-9\-]{3,20}$/;
      if (!codigoRegex.test(codigo)) {
        return res.status(400).json({ 
          error: 'El código debe tener entre 3 y 20 caracteres, solo mayúsculas, números y guiones' 
        });
      }

      // Verificar que costo_maximo >= costo_minimo
      if (parseFloat(costo_maximo) < parseFloat(costo_minimo)) {
        return res.status(400).json({ error: 'El costo máximo debe ser mayor o igual al costo mínimo' });
      }

      // Verificar que el código no exista
      const existing = await Tratamiento.findByCodigo(codigo);
      if (existing) {
        return res.status(400).json({ error: 'Ya existe un tratamiento con ese código' });
      }

      // Obtener el ID del staff que crea (req.user.id es el usuario, necesitamos el staff_id)
      // Asumimos que el usuario actual es staff (admin u odontólogo)
      // Esto requeriría obtener el staff_id desde el usuario_id
      // Por simplicidad, usamos el usuario_id directamente
      const creado_por = req.user.id; // Nota: Esto debería ser el ID de usuarios_staff

      const newTratamiento = await Tratamiento.create({
        codigo,
        nombre,
        descripcion,
        costo_minimo,
        costo_maximo,
        duracion_estimada_minutos,
        categoria
      }, creado_por);

      res.status(201).json({
        message: 'Tratamiento creado exitosamente',
        tratamiento: newTratamiento
      });

    } catch (error) {
      console.error('Error al crear tratamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Listar todos los tratamientos (accesible para todos)
  async listar(req, res) {
    try {
      const { activo = true, solo_activos } = req.query;
      const mostrarActivos = solo_activos === 'false' ? false : true;
      
      const tratamientos = await Tratamiento.findAll(mostrarActivos);
      res.json(tratamientos);

    } catch (error) {
      console.error('Error al listar tratamientos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener un tratamiento por ID
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      
      const tratamiento = await Tratamiento.findById(id);
      if (!tratamiento) {
        return res.status(404).json({ error: 'Tratamiento no encontrado' });
      }

      res.json(tratamiento);

    } catch (error) {
      console.error('Error al obtener tratamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar tratamiento (solo admin y odontólogo)
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria } = req.body;

      // Verificar que el tratamiento existe
      const tratamiento = await Tratamiento.findById(id);
      if (!tratamiento) {
        return res.status(404).json({ error: 'Tratamiento no encontrado' });
      }

      // Validar costos si se proporcionan
      if (costo_minimo !== undefined && costo_maximo !== undefined) {
        if (parseFloat(costo_maximo) < parseFloat(costo_minimo)) {
          return res.status(400).json({ error: 'El costo máximo debe ser mayor o igual al costo mínimo' });
        }
      }

      const updatedTratamiento = await Tratamiento.update(id, {
        nombre,
        descripcion,
        costo_minimo,
        costo_maximo,
        duracion_estimada_minutos,
        categoria
      });

      res.json({
        message: 'Tratamiento actualizado exitosamente',
        tratamiento: updatedTratamiento
      });

    } catch (error) {
      console.error('Error al actualizar tratamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Desactivar tratamiento (soft delete)
  async desactivar(req, res) {
    try {
      const { id } = req.params;

      const tratamiento = await Tratamiento.findById(id);
      if (!tratamiento) {
        return res.status(404).json({ error: 'Tratamiento no encontrado' });
      }

      if (!tratamiento.activo) {
        return res.status(400).json({ error: 'El tratamiento ya está desactivado' });
      }

      const desactivado = await Tratamiento.delete(id);

      res.json({
        message: 'Tratamiento desactivado exitosamente',
        tratamiento: desactivado
      });

    } catch (error) {
      console.error('Error al desactivar tratamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Reactivar tratamiento
  async reactivar(req, res) {
    try {
      const { id } = req.params;

      const tratamiento = await Tratamiento.findById(id);
      if (!tratamiento) {
        return res.status(404).json({ error: 'Tratamiento no encontrado' });
      }

      if (tratamiento.activo) {
        return res.status(400).json({ error: 'El tratamiento ya está activo' });
      }

      const activado = await Tratamiento.activar(id);

      res.json({
        message: 'Tratamiento reactivado exitosamente',
        tratamiento: activado
      });

    } catch (error) {
      console.error('Error al reactivar tratamiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = tratamientoController;