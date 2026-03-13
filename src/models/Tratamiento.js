const db = require('../config/database');

class Tratamiento {
  static async create(tratamientoData, creado_por) {
    const { codigo, nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria } = tratamientoData;
    
    const query = `
      INSERT INTO tratamientos 
      (codigo, nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [codigo, nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria, creado_por];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(activo = true) {
    const query = `
      SELECT t.*, u.nombres || ' ' || u.apellidos as creado_por_nombre
      FROM tratamientos t
      LEFT JOIN usuarios_staff u ON t.creado_por = u.id
      WHERE t.activo = $1
      ORDER BY t.codigo
    `;
    const result = await db.query(query, [activo]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT t.*, u.nombres || ' ' || u.apellidos as creado_por_nombre
      FROM tratamientos t
      LEFT JOIN usuarios_staff u ON t.creado_por = u.id
      WHERE t.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByCodigo(codigo) {
    const query = 'SELECT * FROM tratamientos WHERE codigo = $1';
    const result = await db.query(query, [codigo]);
    return result.rows[0];
  }

  static async update(id, tratamientoData) {
    const { nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria } = tratamientoData;
    
    const query = `
      UPDATE tratamientos 
      SET nombre = $1, descripcion = $2, costo_minimo = $3, 
          costo_maximo = $4, duracion_estimada_minutos = $5, 
          categoria = $6, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [nombre, descripcion, costo_minimo, costo_maximo, duracion_estimada_minutos, categoria, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE tratamientos SET activo = false WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async activar(id) {
    const query = 'UPDATE tratamientos SET activo = true WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Tratamiento;