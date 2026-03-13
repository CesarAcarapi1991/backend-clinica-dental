const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.tipo_usuario)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        required: rolesPermitidos,
        current: req.user.tipo_usuario
      });
    }

    next();
  };
};

const esAdmin = checkRole(['admin']);
const esOdontologo = checkRole(['admin', 'odontologo']);
const esAsistente = checkRole(['admin', 'odontologo', 'asistente']);
const esPaciente = checkRole(['admin', 'odontologo', 'asistente', 'paciente']);

module.exports = {
  checkRole,
  esAdmin,
  esOdontologo,
  esAsistente,
  esPaciente
};