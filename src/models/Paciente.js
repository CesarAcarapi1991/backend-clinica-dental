const db = require('../config/database');

class Paciente {
  static async create(pacienteData) {
    const { usuario_id, nombres, apellidos, fecha_nacimiento, telefono, alergias, direccion, contacto_emergencia, telefono_emergencia } = pacienteData;
    
    const query = `
      INSERT INTO pacientes 
      (usuario_id, nombres, apellidos, fecha_nacimiento, telefono, alergias, direccion, contacto_emergencia, telefono_emergencia)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [usuario_id, nombres, apellidos, fecha_nacimiento, telefono, alergias, direccion, contacto_emergencia, telefono_emergencia];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT p.*, u.email, u.activo 
      FROM pacientes p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE u.activo = true
      ORDER BY p.apellidos, p.nombres
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.email, u.activo 
      FROM pacientes p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUsuarioId(usuario_id) {
    const query = 'SELECT * FROM pacientes WHERE usuario_id = $1';
    const result = await db.query(query, [usuario_id]);
    return result.rows[0];
  }

  static async update(id, pacienteData) {
    const { nombres, apellidos, fecha_nacimiento, telefono, alergias, direccion, contacto_emergencia, telefono_emergencia } = pacienteData;
    
    const query = `
      UPDATE pacientes 
      SET nombres = $1, apellidos = $2, fecha_nacimiento = $3, 
          telefono = $4, alergias = $5, direccion = $6, 
          contacto_emergencia = $7, telefono_emergencia = $8
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [nombres, apellidos, fecha_nacimiento, telefono, alergias, direccion, contacto_emergencia, telefono_emergencia, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    // Soft delete - desactivar usuario
    const query = `
      UPDATE usuarios 
      SET activo = false 
      WHERE id = (SELECT usuario_id FROM pacientes WHERE id = $1)
    `;
    await db.query(query, [id]);
    return { message: 'Paciente desactivado correctamente' };
  }
}

module.exports = Paciente;