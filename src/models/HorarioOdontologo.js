const db = require('../config/database');

class HorarioOdontologo {
    static async create(horarioData) {
        const { odontologo_id, dia_semana, hora_inicio, hora_fin } = horarioData;
        
        const query = `
            INSERT INTO horarios_odontologo (odontologo_id, dia_semana, hora_inicio, hora_fin)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const values = [odontologo_id, dia_semana, hora_inicio, hora_fin];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findByOdontologo(odontologo_id) {
        const query = `
            SELECT * FROM horarios_odontologo 
            WHERE odontologo_id = $1 AND activo = true
            ORDER BY dia_semana, hora_inicio
        `;
        const result = await db.query(query, [odontologo_id]);
        return result.rows;
    }

    static async delete(id) {
        const query = 'UPDATE horarios_odontologo SET activo = false WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = HorarioOdontologo;