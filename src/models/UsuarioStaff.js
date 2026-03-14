// const db = require('../config/database');

// class UsuarioStaff {
//   static async create(staffData) {
//     const { usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios } = staffData;
    
//     const query = `
//       INSERT INTO usuarios_staff 
//       (usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       RETURNING *
//     `;
    
//     const values = [usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios];
//     const result = await db.query(query, values);
//     return result.rows[0];
//   }

//   static async findByUsuarioId(usuario_id) {
//     const query = 'SELECT * FROM usuarios_staff WHERE usuario_id = $1';
//     const result = await db.query(query, [usuario_id]);
//     return result.rows[0];
//   }

//   static async findByRol(rol) {
//     const query = 'SELECT * FROM usuarios_staff WHERE rol = $1';
//     const result = await db.query(query, [rol]);
//     return result.rows;
//   }

//   static async update(id, staffData) {
//     const { nombres, apellidos, telefono, numero_licencia, especialidad, comentarios } = staffData;
    
//     const query = `
//       UPDATE usuarios_staff 
//       SET nombres = $1, apellidos = $2, telefono = $3, 
//           numero_licencia = $4, especialidad = $5, comentarios = $6
//       WHERE id = $7
//       RETURNING *
//     `;
    
//     const values = [nombres, apellidos, telefono, numero_licencia, especialidad, comentarios, id];
//     const result = await db.query(query, values);
//     return result.rows[0];
//   }
// }

// module.exports = UsuarioStaff;

// src/models/UsuarioStaff.js
const db = require('../config/database');

class UsuarioStaff {
  static async create(staffData) {
    const { usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios } = staffData;
    
    const query = `
      INSERT INTO usuarios_staff 
      (usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [usuario_id, nombres, apellidos, rol, telefono, numero_licencia, especialidad, fecha_contratacion, comentarios];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // ✅ AGREGAR ESTE MÉTODO - Buscar por ID de usuarios_staff
  static async findById(id) {
    const query = 'SELECT * FROM usuarios_staff WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUsuarioId(usuario_id) {
    const query = 'SELECT * FROM usuarios_staff WHERE usuario_id = $1';
    const result = await db.query(query, [usuario_id]);
    return result.rows[0];
  }

  static async findByRol(rol) {
    const query = 'SELECT * FROM usuarios_staff WHERE rol = $1';
    const result = await db.query(query, [rol]);
    return result.rows;
  }

  // ✅ ACTUALIZAR ESTE MÉTODO - Asegurar que existe
  static async update(id, staffData) {
    const { nombres, apellidos, telefono, numero_licencia, especialidad, comentarios } = staffData;
    
    const query = `
      UPDATE usuarios_staff 
      SET nombres = $1, apellidos = $2, telefono = $3, 
          numero_licencia = $4, especialidad = $5, comentarios = $6
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [nombres, apellidos, telefono, numero_licencia, especialidad, comentarios, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // ✅ AGREGAR MÉTODO PARA ELIMINAR (si es necesario)
  static async delete(id) {
    const query = 'DELETE FROM usuarios_staff WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = UsuarioStaff;