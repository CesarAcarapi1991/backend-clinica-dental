const db = require('../config/database');

class BloqueoAgenda {
    static async create(bloqueoData) {
        const { odontologo_id, fecha_inicio, fecha_fin, motivo } = bloqueoData;
        
        const query = `
            INSERT INTO bloqueos_agenda (odontologo_id, fecha_inicio, fecha_fin, motivo)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const values = [odontologo_id, fecha_inicio, fecha_fin, motivo];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findByOdontologo(odontologo_id, fecha = null) {
        let query = `
            SELECT * FROM bloqueos_agenda 
            WHERE odontologo_id = $1 AND activo = true
        `;
        
        const params = [odontologo_id];
        
        if (fecha) {
            query += ` AND fecha_inicio <= $2 AND fecha_fin >= $2`;
            params.push(fecha);
        }
        
        query += ` ORDER BY fecha_inicio DESC`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async delete(id) {
        const query = 'UPDATE bloqueos_agenda SET activo = false WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = BloqueoAgenda;