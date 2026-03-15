// src/controllers/historialController.js
const HistorialClinico = require('../models/HistorialClinico');
const EstadoDiente = require('../models/EstadoDiente');
const PlanTratamiento = require('../models/PlanTratamiento');
const Atencion = require('../models/Atencion');
const Paciente = require('../models/Paciente');
// const UsuarioStaff = require('../models/UsuarioStaff');
const Usuario = require('../models/Usuario');
const db = require('../config/database');

const historialController = {
    // Crear historial para un paciente (si no tiene)
    async crearHistorial(req, res) {
        try {
            
            const { paciente_id } = req.params;
            const {
                observaciones_generales, grupo_sanguineo, presion_arterial,
                enfermedades_base, medicamentos_habituales, habitos
            } = req.body;

            // Verificar que el paciente existe
            const paciente = await Paciente.findById(paciente_id);
            if (!paciente) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }

            // Verificar si ya tiene historial
            const tieneHistorial = await HistorialClinico.tieneHistorial(paciente_id);
            if (tieneHistorial) {
                return res.status(400).json({ 
                    error: 'El paciente ya tiene un historial clínico',
                    redirectTo: `/api/historial/paciente/${paciente_id}`
                });
            }

            // Obtener el ID del staff que crea (admin/odontólogo)
            // const staff = await UsuarioStaff.findByUsuarioId(req.user.id);
            // if (!staff) {
            //     return res.status(400).json({ error: 'Usuario no autorizado' });
            // }
            const staff = await Usuario.findById(req.user.id);
            if (!staff) {
                return res.status(400).json({ error: 'Usuario no autorizado' });
            }

            // Crear historial
            const nuevoHistorial = await HistorialClinico.create({
                paciente_id,
                creado_por: staff.id,
                observaciones_generales,
                grupo_sanguineo,
                presion_arterial,
                enfermedades_base,
                medicamentos_habituales,
                habitos
            });

            // Crear estado inicial para todos los dientes
            await EstadoDiente.crearEstadoInicial(nuevoHistorial.id);

            res.status(201).json({
                message: 'Historial clínico creado exitosamente',
                historial: nuevoHistorial,
                nota: 'Todos los dientes han sido inicializados como "sanos"'
            });

        } catch (error) {
            console.error('Error al crear historial:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener historial completo de un paciente
    async getHistorialPaciente(req, res) {
        try {
            const { paciente_id } = req.params;

            // Obtener historial
            const historial = await HistorialClinico.findByPacienteId(paciente_id);
            
            if (!historial) {
                return res.status(404).json({ 
                    error: 'El paciente no tiene historial clínico',
                    puedeCrear: true,
                    paciente_id
                });
            }

            // Obtener estado de todos los dientes
            const estadoDientes = await EstadoDiente.getByHistorialId(historial.id);

            // Obtener dientes no sanos
            const dientesNoSanos = estadoDientes.filter(d => d.estado !== 'sano');

            // Obtener planes de tratamiento
            const planesTratamiento = await PlanTratamiento.getByHistorialId(historial.id);

            // Obtener atenciones realizadas
            const atenciones = await Atencion.getByHistorialId(historial.id);

            // Organizar por cuadrantes para el odontograma
            const odontograma = {
                superiorDerecho: estadoDientes.filter(d => d.cuadrante === 1),
                superiorIzquierdo: estadoDientes.filter(d => d.cuadrante === 2),
                inferiorIzquierdo: estadoDientes.filter(d => d.cuadrante === 3),
                inferiorDerecho: estadoDientes.filter(d => d.cuadrante === 4)
            };

            res.json({
                historial,
                paciente: {
                    id: paciente_id,
                    nombres: historial.paciente_nombres,
                    apellidos: historial.paciente_apellidos
                },
                resumen: {
                    totalDientes: estadoDientes.length,
                    dientesSanos: estadoDientes.filter(d => d.estado === 'sano').length,
                    dientesConProblemas: dientesNoSanos.length,
                    tratamientosPendientes: planesTratamiento.filter(p => p.estado === 'pendiente').length,
                    tratamientosEnCurso: planesTratamiento.filter(p => p.estado === 'en_curso').length
                },
                odontograma,
                dientesNoSanos,
                planesTratamiento,
                atenciones: atenciones.slice(0, 10) // Últimas 10 atenciones
            });

        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar estado de un diente
    async actualizarEstadoDiente(req, res) {
        try {
            const { historial_id, diente_id } = req.params;
            const { nuevo_estado, observaciones } = req.body;

            const estadosValidos = ['sano', 'caries', 'obturado', 'endodoncia', 
                                   'ausente', 'implante', 'protesis', 'periodontal', 'fractura'];

            if (!estadosValidos.includes(nuevo_estado)) {
                return res.status(400).json({ error: 'Estado no válido' });
            }

            // Obtener estado anterior
            const estadoAnterior = await db.query(
                'SELECT estado FROM estado_diente WHERE historial_id = $1 AND diente_id = $2',
                [historial_id, diente_id]
            );

            // Actualizar estado
            const estadoActualizado = await EstadoDiente.updateEstado(
                historial_id, diente_id, nuevo_estado, observaciones
            );

            // Si el nuevo estado no es sano, sugerir tratamiento automáticamente
            if (nuevo_estado !== 'sano') {
                // const staff = await UsuarioStaff.findByUsuarioId(req.user.id);
                const staff = await Usuario.findById(req.user.id);
                await PlanTratamiento.programarParaDientesNoSanos(historial_id, staff.id);
            }

            res.json({
                message: 'Estado de diente actualizado',
                estadoAnterior: estadoAnterior.rows[0]?.estado,
                estadoActual: estadoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar estado:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Programar tratamiento para un diente
    async programarTratamiento(req, res) {
        try {
            const { historial_id, diente_id } = req.params;
            const { tratamiento_id, prioridad, fecha_programada, observaciones } = req.body;

            // Verificar que el diente existe en el historial
            const diente = await db.query(
                'SELECT * FROM estado_diente WHERE historial_id = $1 AND diente_id = $2',
                [historial_id, diente_id]
            );

            if (diente.rows.length === 0) {
                return res.status(404).json({ error: 'Diente no encontrado en el historial' });
            }

            // Verificar que el tratamiento existe
            const tratamiento = await db.query(
                'SELECT * FROM tratamientos WHERE id = $1 AND activo = true',
                [tratamiento_id]
            );

            if (tratamiento.rows.length === 0) {
                return res.status(404).json({ error: 'Tratamiento no encontrado' });
            }

            // const staff = await UsuarioStaff.findByUsuarioId(req.user.id);
            const staff = await Usuario.findById(req.user.id);

            const plan = await PlanTratamiento.create({
                historial_id,
                diente_id,
                tratamiento_id,
                prioridad,
                fecha_programada,
                observaciones,
                creado_por: staff.id
            });

            res.status(201).json({
                message: 'Tratamiento programado exitosamente',
                plan,
                diente: diente.rows[0],
                tratamiento: tratamiento.rows[0]
            });

        } catch (error) {
            console.error('Error al programar tratamiento:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Registrar atención realizada
    async registrarAtencion(req, res) {
        try {
            const { historial_id } = req.params;
            const { diente_id, tratamiento_id, observaciones, costo } = req.body;

            // Obtener estado actual del diente
            const estadoActual = await db.query(
                'SELECT estado FROM estado_diente WHERE historial_id = $1 AND diente_id = $2',
                [historial_id, diente_id]
            );

            if (estadoActual.rows.length === 0) {
                return res.status(404).json({ error: 'Diente no encontrado' });
            }

            // const staff = await UsuarioStaff.findByUsuarioId(req.user.id);
            const staff = await Usuario.findById(req.user.id);

            // Determinar nuevo estado según el tratamiento
            const tratamiento = await db.query(
                'SELECT * FROM tratamientos WHERE id = $1',
                [tratamiento_id]
            );

            let nuevoEstado = estadoActual.rows[0].estado;
            
            // Mapeo de tratamientos a nuevos estados
            if (tratamiento.rows[0].codigo.startsWith('OBT')) {
                nuevoEstado = 'obturado';
            } else if (tratamiento.rows[0].codigo.startsWith('END')) {
                nuevoEstado = 'endodoncia';
            } else if (tratamiento.rows[0].codigo.startsWith('IMP')) {
                nuevoEstado = 'implante';
            }

            // Registrar atención
            const atencion = await Atencion.create({
                historial_id,
                diente_id,
                tratamiento_id,
                odontologo_id: staff.id,
                estado_anterior: estadoActual.rows[0].estado,
                estado_nuevo: nuevoEstado,
                observaciones,
                costo
            });

            // Actualizar estado del diente
            await EstadoDiente.updateEstado(historial_id, diente_id, nuevoEstado);

            // Actualizar plan de tratamiento si existe
            await db.query(
                `UPDATE plan_tratamiento 
                 SET estado = 'completado', fecha_realizado = CURRENT_DATE
                 WHERE historial_id = $1 AND diente_id = $2 AND tratamiento_id = $3 
                 AND estado = 'en_curso'`,
                [historial_id, diente_id, tratamiento_id]
            );

            res.status(201).json({
                message: 'Atención registrada exitosamente',
                atencion,
                nuevoEstadoDiente: nuevoEstado
            });

        } catch (error) {
            console.error('Error al registrar atención:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Programar automáticamente tratamientos para dientes no sanos
    async programarAutomatico(req, res) {
        try {
            const { historial_id } = req.params;

            // const staff = await UsuarioStaff.findByUsuarioId(req.user.id);
            const staff = await Usuario.findById(req.user.id);

            const planes = await PlanTratamiento.programarParaDientesNoSanos(historial_id, staff.id);

            res.json({
                message: 'Tratamientos programados automáticamente',
                total: planes.length,
                planes
            });

        } catch (error) {
            console.error('Error en programación automática:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = historialController;