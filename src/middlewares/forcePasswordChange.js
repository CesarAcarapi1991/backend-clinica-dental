// src/middlewares/forcePasswordChange.js

const forcePasswordChange = async (req, res, next) => {
  // Si el usuario está autenticado y debe cambiar su contraseña
  if (req.user && req.user.cambiar_password) {
    // Permitir acceso solo a rutas relacionadas con cambio de contraseña
    const allowedPaths = [
      '/api/auth/cambiar-password',
      '/api/auth/logout'
    ];
    
    // También permitir métodos OPTIONS (para CORS)
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!allowedPaths.includes(req.path)) {
      return res.status(403).json({
        error: 'Debes cambiar tu contraseña temporal antes de continuar',
        code: 'PASSWORD_CHANGE_REQUIRED',
        redirectTo: '/api/auth/cambiar-password'
      });
    }
  }
  
  next();
};

module.exports = forcePasswordChange;