const db = require('../config/database');

class EstadoDiente {
    // Crear estado inicial para todos los dientes de un paciente
    static async crearEstadoInicial(historial_id) {
        // Obtener todos los dientes
        const dientes = await db.query('SELECT id FROM dientes WHERE activo = true');
        
        // Crear estado 'sano' para cada diente
        const query = `
            INSERT INTO estado_diente (historial_id, diente_id, estado, fecha_diagnostico)
            VALUES ($1, $2, 'sano', CURRENT_DATE)
        `;
        
        for (const diente of dientes.rows) {
            await db.query(query, [historial_id, diente.id]);
        }
        
        return { message: 'Estado inicial creado' };
    }

    // Obtener estado de todos los dientes de un historial
    static async getByHistorialId(historial_id) {
        const query = `
            SELECT ed.*, 
                   d.numero_diente, 
                   d.nombre as diente_nombre,
                   d.cuadrante,
                   d.posicion
            FROM estado_diente ed
            JOIN dientes d ON ed.diente_id = d.id
            WHERE ed.historial_id = $1 AND ed.activo = true
            ORDER BY d.numero_diente
        `;
        
        const result = await db.query(query, [historial_id]);
        return result.rows;
    }

    // Actualizar estado de un diente
    static async updateEstado(historial_id, diente_id, nuevo_estado, observaciones = null) {
        const query = `
            UPDATE estado_diente 
            SET estado = $1, 
                observaciones = COALESCE($2, observaciones),
                fecha_diagnostico = CURRENT_DATE
            WHERE historial_id = $3 AND diente_id = $4
            RETURNING *
        `;
        
        const result = await db.query(query, [nuevo_estado, observaciones, historial_id, diente_id]);
        return result.rows[0];
    }

    // Obtener dientes por estado
    static async getByEstado(historial_id, estado) {
        const query = `
            SELECT ed.*, d.numero_diente, d.nombre
            FROM estado_diente ed
            JOIN dientes d ON ed.diente_id = d.id
            WHERE ed.historial_id = $1 AND ed.estado = $2 AND ed.activo = true
            ORDER BY d.numero_diente
        `;
        
        const result = await db.query(query, [historial_id, estado]);
        return result.rows;
    }

    // Obtener dientes no sanos
    static async getDientesNoSanos(historial_id) {
        const query = `
            SELECT ed.*, d.numero_diente, d.nombre, d.cuadrante
            FROM estado_diente ed
            JOIN dientes d ON ed.diente_id = d.id
            WHERE ed.historial_id = $1 
              AND ed.estado != 'sano' 
              AND ed.activo = true
            ORDER BY d.numero_diente
        `;
        
        const result = await db.query(query, [historial_id]);
        return result.rows;
    }
}

module.exports = EstadoDiente;