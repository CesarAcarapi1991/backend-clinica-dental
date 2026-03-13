// const app = require('./src/app');
// const { pool } = require('./src/config/database');

// const PORT = process.env.PORT || 3000;

// // Verificar conexión a la base de datos
// pool
// server.js
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    process.exit(1);
  }
  console.log('✅ Conectado a PostgreSQL exitosamente');
  release();
});

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Documentación API: http://localhost:${PORT}/api/health`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    pool.end(() => {
      console.log('Conexión a BD cerrada');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    pool.end(() => {
      console.log('Conexión a BD cerrada');
      process.exit(0);
    });
  });
});