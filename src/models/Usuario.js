const db = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
  static async create({ email, password_hash, tipo_usuario }) {
    const query = `
      INSERT INTO usuarios (email, password_hash, tipo_usuario, cambiar_password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, tipo_usuario, fecha_registro
    `;
    const values = [email, password_hash, tipo_usuario, true];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND activo = true';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, tipo_usuario, cambiar_password, intentos_fallidos, bloqueado_hasta, activo FROM usuarios WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateLastAccess(id) {
    const query = 'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
  }

  static async incrementarIntentosFallidos(email) {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = intentos_fallidos + 1,
          bloqueado_hasta = CASE 
            WHEN intentos_fallidos + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
            ELSE bloqueado_hasta
          END
      WHERE email = $1
      RETURNING *
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

    static async resetearIntentosFallidos(email) {
        const query = 'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE email = $1';
        await db.query(query, [email]);
    }

  static async cambiarPassword(id, newPasswordHash) {
    const query = `
        UPDATE usuarios 
        SET password_hash = $1, 
            cambiar_password = false,
            ultimo_cambio_password = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `;
    const result = await db.query(query, [newPasswordHash, id]);
    return result.rows[0];
    }

    static async forzarCambioPassword(id) {
    const query = 'UPDATE usuarios SET cambiar_password = true WHERE id = $1';
    await db.query(query, [id]);
    }

    static async obtenerEstadisticasPassword(id) {
    const query = `
        SELECT 
        cambiar_password,
        ultimo_cambio_password,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - ultimo_cambio_password)) as dias_desde_cambio
        FROM usuarios 
        WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
    }

  static async debeCambiarPassword(id) {
    const query = 'SELECT cambiar_password FROM usuarios WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0]?.cambiar_password || false;
  }
}

module.exports = Usuario;