const db = require('../config/database');

class PlanTratamiento {
    // Crear plan de tratamiento para un diente
    static async create(planData) {
        const {
            historial_id, diente_id, tratamiento_id,
            prioridad, fecha_programada, observaciones, creado_por
        } = planData;
        
        const query = `
            INSERT INTO plan_tratamiento (
                historial_id, diente_id, tratamiento_id, 
                prioridad, fecha_programada, observaciones, creado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [historial_id, diente_id, tratamiento_id, 
                       prioridad || 1, fecha_programada, observaciones, creado_por];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Obtener planes de tratamiento de un historial
    static async getByHistorialId(historial_id) {
        const query = `
            SELECT pt.*, 
                   d.numero_diente,
                   d.nombre as diente_nombre,
                   t.nombre as tratamiento_nombre,
                   t.costo_minimo,
                   t.costo_maximo,
                   t.duracion_estimada_minutos
            FROM plan_tratamiento pt
            JOIN dientes d ON pt.diente_id = d.id
            JOIN tratamientos t ON pt.tratamiento_id = t.id
            WHERE pt.historial_id = $1
            ORDER BY pt.prioridad, d.numero_diente
        `;
        
        const result = await db.query(query, [historial_id]);
        return result.rows;
    }

    // Obtener planes pendientes
    static async getPendientes(historial_id) {
        const query = `
            SELECT pt.*, d.numero_diente, t.nombre as tratamiento
            FROM plan_tratamiento pt
            JOIN dientes d ON pt.diente_id = d.id
            JOIN tratamientos t ON pt.tratamiento_id = t.id
            WHERE pt.historial_id = $1 
              AND pt.estado = 'pendiente'
            ORDER BY pt.prioridad, pt.fecha_programada
        `;
        
        const result = await db.query(query, [historial_id]);
        return result.rows;
    }

    // Actualizar estado del plan
    static async updateEstado(id, estado, fecha_realizado = null) {
        const query = `
            UPDATE plan_tratamiento 
            SET estado = $1, 
                fecha_realizado = COALESCE($2, fecha_realizado)
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await db.query(query, [estado, fecha_realizado, id]);
        return result.rows[0];
    }

    // Programar tratamiento para dientes no sanos
    static async programarParaDientesNoSanos(historial_id, creado_por) {
        // Obtener dientes no sanos
        const dientesNoSanos = await db.query(`
            SELECT ed.*, d.numero_diente
            FROM estado_diente ed
            JOIN dientes d ON ed.diente_id = d.id
            WHERE ed.historial_id = $1 
              AND ed.estado != 'sano'
              AND NOT EXISTS (
                  SELECT 1 FROM plan_tratamiento pt 
                  WHERE pt.historial_id = ed.historial_id 
                    AND pt.diente_id = ed.diente_id
                    AND pt.estado IN ('pendiente', 'en_curso')
              )
        `, [historial_id]);

        const planes = [];
        
        for (const diente of dientesNoSanos.rows) {
            // Buscar tratamiento sugerido según el estado
            const tratamientoSugerido = await this.sugerirTratamiento(diente.estado);
            
            if (tratamientoSugerido) {
                const plan = await this.create({
                    historial_id,
                    diente_id: diente.diente_id,
                    tratamiento_id: tratamientoSugerido,
                    prioridad: 2,
                    observaciones: `Tratamiento sugerido por estado: ${diente.estado}`,
                    creado_por
                });
                planes.push(plan);
            }
        }
        
        return planes;
    }

    // Sugerir tratamiento según el estado del diente
    static async sugerirTratamiento(estado) {
        const sugerencias = {
            'caries': 'OBT-001', // Obturación
            'fractura': 'OBT-002', // Obturación compleja
            'endodoncia': 'END-001', // Endodoncia
            'periodontal': 'PER-001', // Periodoncia
            'ausente': 'IMP-001', // Implante
            'obturado': null, // Ya tratado
            'implante': null // Ya tratado
        };
        
        const codigoSugerido = sugerencias[estado];
        if (!codigoSugerido) return null;
        
        // Buscar el tratamiento por código
        const result = await db.query(
            'SELECT id FROM tratamientos WHERE codigo = $1 AND activo = true',
            [codigoSugerido]
        );
        
        return result.rows[0]?.id || null;
    }
}

module.exports = PlanTratamiento;