// src/scripts/createAdmin.js
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
require('dotenv').config();

async function createAdminUser() {
  try {
    const email = 'admin@odontologia.com';
    const password = 'Admin123*';
    
    // Verificar si ya existe
    const checkQuery = 'SELECT id FROM usuarios WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️ El usuario admin ya existe');
      process.exit(0);
    }
    
    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Insertar admin
    const query = `
      INSERT INTO usuarios (email, password_hash, tipo_usuario, cambiar_password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, tipo_usuario
    `;
    
    const result = await pool.query(query, [email, password_hash, 'admin', false]);
    
    console.log('✅ Usuario admin creado exitosamente:');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña:', password);
    console.log('⚠️  Cambia esta contraseña en producción!');
    
  } catch (error) {
    console.error('❌ Error creando admin:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();