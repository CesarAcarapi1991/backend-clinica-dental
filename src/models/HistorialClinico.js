const db = require('../config/database');

class HistorialClinico {
    // Crear nuevo historial para un paciente
    static async create(historialData) {
        const { 
            paciente_id, creado_por, observaciones_generales,
            grupo_sanguineo, presion_arterial, enfermedades_base,
            medicamentos_habituales, habitos
        } = historialData;
        
        const query = `
            INSERT INTO historial_clinico (
                paciente_id, creado_por, observaciones_generales,
                grupo_sanguineo, presion_arterial, enfermedades_base,
                medicamentos_habituales, habitos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [paciente_id, creado_por, observaciones_generales,
                       grupo_sanguineo, presion_arterial, enfermedades_base,
                       medicamentos_habituales, habitos];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Obtener historial por paciente ID
    static async findByPacienteId(paciente_id) {
        const query = `
            SELECT h.*, 
                   p.nombres as paciente_nombres, 
                   p.apellidos as paciente_apellidos,
                   p.fecha_nacimiento,
                   p.telefono,
                   p.alergias
            FROM historial_clinico h
            JOIN pacientes p ON h.paciente_id = p.id
            WHERE h.paciente_id = $1 AND h.activo = true
        `;
        
        const result = await db.query(query, [paciente_id]);
        return result.rows[0];
    }

    // Obtener historial por ID
    static async findById(id) {
        const query = `
            SELECT h.*, 
                   p.nombres as paciente_nombres, 
                   p.apellidos as paciente_apellidos
            FROM historial_clinico h
            JOIN pacientes p ON h.paciente_id = p.id
            WHERE h.id = $1 AND h.activo = true
        `;
        
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    // Actualizar historial
    static async update(id, data) {
        const { 
            observaciones_generales, grupo_sanguineo, presion_arterial,
            enfermedades_base, medicamentos_habituales, habitos 
        } = data;
        
        const query = `
            UPDATE historial_clinico 
            SET observaciones_generales = COALESCE($1, observaciones_generales),
                grupo_sanguineo = COALESCE($2, grupo_sanguineo),
                presion_arterial = COALESCE($3, presion_arterial),
                enfermedades_base = COALESCE($4, enfermedades_base),
                medicamentos_habituales = COALESCE($5, medicamentos_habituales),
                habitos = COALESCE($6, habitos),
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;
        
        const values = [observaciones_generales, grupo_sanguineo, presion_arterial,
                       enfermedades_base, medicamentos_habituales, habitos, id];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Verificar si paciente tiene historial
    static async tieneHistorial(paciente_id) {
        const query = 'SELECT id FROM historial_clinico WHERE paciente_id = $1 AND activo = true';
        const result = await db.query(query, [paciente_id]);
        return result.rows.length > 0;
    }
}

module.exports = HistorialClinico;