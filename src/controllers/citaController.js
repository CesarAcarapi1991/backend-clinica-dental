const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');
const UsuarioStaff = require('../models/UsuarioStaff');
const HorarioOdontologo = require('../models/HorarioOdontologo');
const BloqueoAgenda = require('../models/BloqueoAgenda');

const citaController = {
    // Crear una nueva cita (asignar paciente a odontólogo)
    async crearCita(req, res) {
        try {
            const { 
                paciente_id, 
                odontologo_id, 
                tratamiento_id,
                fecha_cita, 
                hora_inicio, 
                motivo 
            } = req.body;

            // Validaciones básicas
            if (!paciente_id || !odontologo_id || !fecha_cita || !hora_inicio) {
                return res.status(400).json({ 
                    error: 'Faltan campos requeridos: paciente, odontólogo, fecha y hora' 
                });
            }

            // Verificar que el odontólogo existe y es odontólogo
            const odontologo = await UsuarioStaff.findById(odontologo_id);
            if (!odontologo || odontologo.rol !== 'odontologo') {
                return res.status(400).json({ error: 'Odontólogo no válido' });
            }

            // Verificar que el paciente existe
            const paciente = await Paciente.findById(paciente_id);
            if (!paciente) {
                return res.status(400).json({ error: 'Paciente no encontrado' });
            }

            // Calcular hora_fin (asumimos 30 minutos por defecto)
            const hora_fin = calcularHoraFin(hora_inicio, 30);

            // Verificar disponibilidad
            const disponibilidad = await Cita.verificarDisponibilidad(
                odontologo_id, fecha_cita, hora_inicio, hora_fin
            );

            if (!disponibilidad.disponible) {
                return res.status(400).json({ 
                    error: 'Horario no disponible', 
                    motivo: disponibilidad.motivo 
                });
            }

            // Crear la cita
            const nuevaCita = await Cita.create({
                paciente_id,
                odontologo_id,
                tratamiento_id,
                fecha_cita,
                hora_inicio,
                hora_fin,
                motivo,
                creado_por: req.user.id
            });

            res.status(201).json({
                message: 'Cita creada exitosamente',
                cita: nuevaCita
            });

        } catch (error) {
            console.error('Error al crear cita:', error);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    // Obtener horarios disponibles de un odontólogo para una fecha
    async horariosDisponibles(req, res) {
        try {
            const { odontologo_id, fecha } = req.query;

            if (!odontologo_id || !fecha) {
                return res.status(400).json({ 
                    error: 'Se requiere odontólogo y fecha' 
                });
            }

            const slots = await Cita.getHorariosDisponibles(odontologo_id, fecha);

            res.json({
                odontologo_id,
                fecha,
                horarios_disponibles: slots
            });

        } catch (error) {
            console.error('Error al obtener horarios:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Listar citas de un paciente
    async citasPaciente(req, res) {
        try {
            const { paciente_id } = req.params;
            const { desde, hasta } = req.query;

            // Verificar permisos (el paciente solo puede ver sus citas)
            if (req.user.tipo_usuario === 'paciente') {
                const paciente = await Paciente.findByUsuarioId(req.user.id);
                if (paciente.id !== parseInt(paciente_id)) {
                    return res.status(403).json({ 
                        error: 'No puedes ver citas de otro paciente' 
                    });
                }
            }

            const citas = await Cita.findByPaciente(paciente_id, desde, hasta);

            res.json(citas);

        } catch (error) {
            console.error('Error al listar citas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Listar citas de un odontólogo
    async citasOdontologo(req, res) {
        try {
            const { odontologo_id } = req.params;
            const { fecha } = req.query;

            // Verificar permisos
            if (req.user.tipo_usuario === 'odontologo') {
                const odontologo = await UsuarioStaff.findByUsuarioId(req.user.id);
                if (odontologo.id !== parseInt(odontologo_id)) {
                    return res.status(403).json({ 
                        error: 'No puedes ver citas de otro odontólogo' 
                    });
                }
            }

            const citas = await Cita.findByOdontologo(odontologo_id, fecha);

            // Agrupar por estado para mejor visualización
            const agrupadas = {
                programadas: citas.filter(c => c.estado === 'programada'),
                confirmadas: citas.filter(c => c.estado === 'confirmada'),
                en_curso: citas.filter(c => c.estado === 'en_curso'),
                completadas: citas.filter(c => c.estado === 'completada'),
                canceladas: citas.filter(c => c.estado === 'cancelada')
            };

            res.json({
                total: citas.length,
                fecha: fecha || 'todas',
                citas: agrupadas
            });

        } catch (error) {
            console.error('Error al listar citas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar estado de una cita
    async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, motivo_cancelacion } = req.body;

            const estadosValidos = ['confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'];
            
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({ error: 'Estado no válido' });
            }

            const cita = await Cita.findById(id);
            if (!cita) {
                return res.status(404).json({ error: 'Cita no encontrada' });
            }

            // Verificar permisos según el estado
            if (estado === 'cancelada' && req.user.tipo_usuario === 'paciente') {
                // Paciente solo puede cancelar con anticipación
                const fechaCita = new Date(cita.fecha_cita);
                const hoy = new Date();
                const diffHoras = (fechaCita - hoy) / (1000 * 60 * 60);
                
                if (diffHoras < 24) {
                    return res.status(400).json({ 
                        error: 'Solo puedes cancelar citas con 24 horas de anticipación' 
                    });
                }
            }

            const citaActualizada = await Cita.updateEstado(id, estado, motivo_cancelacion);

            res.json({
                message: `Cita ${estado} exitosamente`,
                cita: citaActualizada
            });

        } catch (error) {
            console.error('Error al actualizar cita:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener detalles de una cita específica
    async detalleCita(req, res) {
        try {
            const { id } = req.params;

            const cita = await Cita.findById(id);
            if (!cita) {
                return res.status(404).json({ error: 'Cita no encontrada' });
            }

            // Verificar permisos
            if (req.user.tipo_usuario === 'paciente') {
                const paciente = await Paciente.findByUsuarioId(req.user.id);
                if (cita.paciente_id !== paciente.id) {
                    return res.status(403).json({ error: 'No autorizado' });
                }
            }

            if (req.user.tipo_usuario === 'odontologo') {
                const odontologo = await UsuarioStaff.findByUsuarioId(req.user.id);
                if (cita.odontologo_id !== odontologo.id) {
                    return res.status(403).json({ error: 'No autorizado' });
                }
            }

            res.json(cita);

        } catch (error) {
            console.error('Error al obtener cita:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Configurar horarios de atención de un odontólogo
    async configurarHorarios(req, res) {
        try {
            const { odontologo_id, horarios } = req.body;

            // horarios: array de { dia_semana, hora_inicio, hora_fin }

            if (!odontologo_id || !horarios || !Array.isArray(horarios)) {
                return res.status(400).json({ error: 'Datos inválidos' });
            }

            const horariosCreados = [];

            for (const horario of horarios) {
                const nuevoHorario = await HorarioOdontologo.create({
                    odontologo_id,
                    ...horario
                });
                horariosCreados.push(nuevoHorario);
            }

            res.status(201).json({
                message: 'Horarios configurados exitosamente',
                horarios: horariosCreados
            });

        } catch (error) {
            console.error('Error al configurar horarios:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Bloquear agenda (vacaciones, feriados)
    async bloquearAgenda(req, res) {
        try {
            const { odontologo_id, fecha_inicio, fecha_fin, motivo } = req.body;

            if (!odontologo_id || !fecha_inicio || !fecha_fin || !motivo) {
                return res.status(400).json({ error: 'Faltan campos requeridos' });
            }

            const bloqueo = await BloqueoAgenda.create({
                odontologo_id,
                fecha_inicio,
                fecha_fin,
                motivo
            });

            res.status(201).json({
                message: 'Agenda bloqueada exitosamente',
                bloqueo
            });

        } catch (error) {
            console.error('Error al bloquear agenda:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// Función auxiliar para calcular hora_fin
function calcularHoraFin(horaInicio, minutosDuracion) {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + minutosDuracion;
    const nuevasHoras = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
    const nuevosMinutos = (totalMinutos % 60).toString().padStart(2, '0');
    return `${nuevasHoras}:${nuevosMinutos}`;
}

module.exports = citaController;