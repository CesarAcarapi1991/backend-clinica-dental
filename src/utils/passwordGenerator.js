// src/utils/passwordGenerator.js

const generarPasswordTemporal = (datosUsuario) => {
  const {
    documento,
    nombres,
    fechaNacimiento,
    telefono,
    email
  } = datosUsuario;

  // Prefijos posibles
  const prefijos = ['Temp', 'Pass', 'Clave', 'Odont', 'User'];
  const sufijos = ['$', '*', '#', '!', '?'];
  
  // Elegir prefijo aleatorio
  const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
  
  // Obtener parte del documento o teléfono
  let parteNumerica = '';
  if (documento) {
    parteNumerica = documento.slice(-6);
  } else if (telefono) {
    parteNumerica = telefono.slice(-6);
  } else if (fechaNacimiento) {
    parteNumerica = fechaNacimiento.split('-').join('').slice(-6);
  } else {
    // Generar números aleatorios si no hay datos
    parteNumerica = Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Elegir sufijo aleatorio
  const sufijo = sufijos[Math.floor(Math.random() * sufijos.length)];
  
  // Añadir un carácter especial extra
  const caracteresEspeciales = ['@', '_', '-', '.', '&'];
  const especial = caracteresEspeciales[Math.floor(Math.random() * caracteresEspeciales.length)];
  
  // Combinar todo
  return `${prefijo}${parteNumerica}${especial}${sufijo}`;
};

// Función para validar fortaleza de contraseña
const validarFortalezaPassword = (password) => {
  const errores = [];
  
  if (password.length < 8) {
    errores.push('Debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errores.push('Debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errores.push('Debe contener al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errores.push('Debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errores.push('Debe contener al menos un carácter especial');
  }
  
  return {
    valida: errores.length === 0,
    errores
  };
};

module.exports = {
  generarPasswordTemporal,
  validarFortalezaPassword
};