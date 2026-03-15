const db = require('../config/database');

class Atencion {
    // Registrar una atención realizada
    static async create(atencionData) {
        const {
            historial_id, diente_id, tratamiento_id,
            odontologo_id, estado_anterior, estado_nuevo,
            observaciones, costo, numero_sesion
        } = atencionData;
        
        const query = `
            INSERT INTO atenciones (
                historial_id, diente_id, tratamiento_id,
                odontologo_id, estado_anterior, estado_nuevo,
                observaciones, costo, numero_sesion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const values = [historial_id, diente_id, tratamiento_id,
                       odontologo_id, estado_anterior, estado_nuevo,
                       observaciones, costo, numero_sesion || 1];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Obtener atenciones de un historial
    static async getByHistorialId(historial_id) {
        const query = `
            SELECT a.*, 
                   d.numero_diente,
                   d.nombre as diente_nombre,
                   t.nombre as tratamiento_nombre,
                   u.nombres || ' ' || u.apellidos as odontologo_nombre
            FROM atenciones a
            JOIN dientes d ON a.diente_id = d.id
            JOIN tratamientos t ON a.tratamiento_id = t.id
            LEFT JOIN usuarios_staff u ON a.odontologo_id = u.id
            WHERE a.historial_id = $1
            ORDER BY a.fecha_atencion DESC
        `;
        
        const result = await db.query(query, [historial_id]);
        return result.rows;
    }

    // Obtener atenciones por diente
    static async getByDiente(historial_id, diente_id) {
        const query = `
            SELECT a.*, t.nombre as tratamiento
            FROM atenciones a
            JOIN tratamientos t ON a.tratamiento_id = t.id
            WHERE a.historial_id = $1 AND a.diente_id = $2
            ORDER BY a.fecha_atencion DESC
        `;
        
        const result = await db.query(query, [historial_id, diente_id]);
        return result.rows;
    }
}

module.exports = Atencion;