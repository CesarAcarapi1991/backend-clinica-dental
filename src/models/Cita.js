const db = require('../config/database');

class Cita {
    static async create(citaData) {
        const { 
            paciente_id, odontologo_id, tratamiento_id, 
            fecha_cita, hora_inicio, hora_fin, motivo, creado_por 
        } = citaData;
        
        // Verificar disponibilidad antes de crear
        const disponible = await this.verificarDisponibilidad(
            odontologo_id, fecha_cita, hora_inicio, hora_fin
        );
        
        if (!disponible) {
            throw new Error('El horario seleccionado no está disponible');
        }
        
        const query = `
            INSERT INTO citas (
                paciente_id, odontologo_id, tratamiento_id, 
                fecha_cita, hora_inicio, hora_fin, motivo, creado_por
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [paciente_id, odontologo_id, tratamiento_id, 
                       fecha_cita, hora_inicio, hora_fin, motivo, creado_por];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findByPaciente(paciente_id, fecha_inicio = null, fecha_fin = null) {
        let query = `
            SELECT c.*, 
                   o.nombres as odontologo_nombres, o.apellidos as odontologo_apellidos,
                   t.nombre as tratamiento_nombre,
                   p.nombres as paciente_nombres, p.apellidos as paciente_apellidos
            FROM citas c
            JOIN usuarios_staff o ON c.odontologo_id = o.id
            JOIN pacientes p ON c.paciente_id = p.id
            LEFT JOIN tratamientos t ON c.tratamiento_id = t.id
            WHERE c.paciente_id = $1
        `;
        
        const params = [paciente_id];
        
        if (fecha_inicio && fecha_fin) {
            query += ` AND c.fecha_cita BETWEEN $2 AND $3`;
            params.push(fecha_inicio, fecha_fin);
        }
        
        query += ` ORDER BY c.fecha_cita DESC, c.hora_inicio DESC`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async findByOdontologo(odontologo_id, fecha = null) {
        let query = `
            SELECT c.*, 
                   p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
                   t.nombre as tratamiento_nombre
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            LEFT JOIN tratamientos t ON c.tratamiento_id = t.id
            WHERE c.odontologo_id = $1
        `;
        
        const params = [odontologo_id];
        
        if (fecha) {
            query += ` AND c.fecha_cita = $2`;
            params.push(fecha);
        }
        
        query += ` ORDER BY c.fecha_cita, c.hora_inicio`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   o.nombres as odontologo_nombres, o.apellidos as odontologo_apellidos,
                   p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
                   t.nombre as tratamiento_nombre
            FROM citas c
            JOIN usuarios_staff o ON c.odontologo_id = o.id
            JOIN pacientes p ON c.paciente_id = p.id
            LEFT JOIN tratamientos t ON c.tratamiento_id = t.id
            WHERE c.id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async updateEstado(id, estado, motivo_cancelacion = null) {
        let query;
        let params;
        
        if (estado === 'cancelada') {
            query = `
                UPDATE citas 
                SET estado = $1, cancelada_en = CURRENT_TIMESTAMP, motivo_cancelacion = $2
                WHERE id = $3
                RETURNING *
            `;
            params = [estado, motivo_cancelacion, id];
        } else {
            query = `
                UPDATE citas 
                SET estado = $1, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;
            params = [estado, id];
        }
        
        const result = await db.query(query, params);
        return result.rows[0];
    }

    static async verificarDisponibilidad(odontologo_id, fecha, hora_inicio, hora_fin) {
        // Verificar que el horario esté dentro del horario de atención del odontólogo
        const diaSemana = new Date(fecha).getDay();
        
        const horarioQuery = `
            SELECT * FROM horarios_odontologo 
            WHERE odontologo_id = $1 
            AND dia_semana = $2 
            AND hora_inicio <= $3::time 
            AND hora_fin >= $4::time
            AND activo = true
        `;
        
        const horarioResult = await db.query(horarioQuery, [odontologo_id, diaSemana, hora_inicio, hora_fin]);
        
        if (horarioResult.rows.length === 0) {
            return { disponible: false, motivo: 'Fuera de horario de atención' };
        }
        
        // Verificar que no haya otra cita en el mismo horario
        const citaQuery = `
            SELECT * FROM citas 
            WHERE odontologo_id = $1 
            AND fecha_cita = $2
            AND estado NOT IN ('cancelada', 'no_asistio')
            AND (
                ($3::time BETWEEN hora_inicio AND hora_fin) OR
                ($4::time BETWEEN hora_inicio AND hora_fin) OR
                (hora_inicio BETWEEN $3::time AND $4::time)
            )
        `;
        
        const citaResult = await db.query(citaQuery, [odontologo_id, fecha, hora_inicio, hora_fin]);
        
        if (citaResult.rows.length > 0) {
            return { disponible: false, motivo: 'Horario ocupado' };
        }
        
        // Verificar bloqueos de agenda
        const bloqueoQuery = `
            SELECT * FROM bloqueos_agenda 
            WHERE odontologo_id = $1 
            AND fecha_inicio <= $2 
            AND fecha_fin >= $2
            AND activo = true
        `;
        
        const bloqueoResult = await db.query(bloqueoQuery, [odontologo_id, fecha]);
        
        if (bloqueoResult.rows.length > 0) {
            return { 
                disponible: false, 
                motivo: `Agenda bloqueada: ${bloqueoResult.rows[0].motivo}` 
            };
        }
        
        return { disponible: true };
    }

    static async getHorariosDisponibles(odontologo_id, fecha) {
        const diaSemana = new Date(fecha).getDay();
        
        // Obtener horarios de atención del odontólogo
        const horariosQuery = `
            SELECT * FROM horarios_odontologo 
            WHERE odontologo_id = $1 AND dia_semana = $2 AND activo = true
        `;
        
        const horarios = await db.query(horariosQuery, [odontologo_id, diaSemana]);
        
        if (horarios.rows.length === 0) {
            return [];
        }
        
        // Obtener citas ya programadas
        const citasQuery = `
            SELECT hora_inicio, hora_fin FROM citas 
            WHERE odontologo_id = $1 
            AND fecha_cita = $2
            AND estado NOT IN ('cancelada', 'no_asistio')
            ORDER BY hora_inicio
        `;
        
        const citas = await db.query(citasQuery, [odontologo_id, fecha]);
        
        // Generar slots de 30 minutos disponibles
        const slotsDisponibles = [];
        const duracionSlot = 30; // minutos
        
        for (const horario of horarios.rows) {
            let horaActual = this.minutosDesdeMedianoche(horario.hora_inicio);
            const horaFin = this.minutosDesdeMedianoche(horario.hora_fin);
            
            while (horaActual + duracionSlot <= horaFin) {
                const horaInicioSlot = this.horaDesdeMinutos(horaActual);
                const horaFinSlot = this.horaDesdeMinutos(horaActual + duracionSlot);
                
                // Verificar si el slot está ocupado
                let ocupado = false;
                for (const cita of citas.rows) {
                    const citaInicio = this.minutosDesdeMedianoche(cita.hora_inicio);
                    const citaFin = this.minutosDesdeMedianoche(cita.hora_fin);
                    
                    if ((horaActual >= citaInicio && horaActual < citaFin) ||
                        (horaActual + duracionSlot > citaInicio && horaActual + duracionSlot <= citaFin) ||
                        (horaActual <= citaInicio && horaActual + duracionSlot >= citaFin)) {
                        ocupado = true;
                        break;
                    }
                }
                
                if (!ocupado) {
                    slotsDisponibles.push({
                        hora_inicio: horaInicioSlot,
                        hora_fin: horaFinSlot
                    });
                }
                
                horaActual += duracionSlot;
            }
        }
        
        return slotsDisponibles;
    }

    static minutosDesdeMedianoche(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    static horaDesdeMinutos(minutos) {
        const hours = Math.floor(minutos / 60).toString().padStart(2, '0');
        const mins = (minutos % 60).toString().padStart(2, '0');
        return `${hours}:${mins}`;
    }
}

module.exports = Cita;  