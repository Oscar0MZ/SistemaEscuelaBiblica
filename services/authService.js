// services/authService.js
const CLAVES = {
    ADMIN: "1234",
    MAESTRO: "2222",
    AUXILIAR: "3333",
    LOGISTICA: "4444"
};

export const verificarCredenciales = (rol, clave) => {
    return CLAVES[rol] === clave;
};

export const obtenerSesion = () => {
    return localStorage.getItem('rol_dominical');
};

export const guardarSesion = (rol) => {
    localStorage.setItem('rol_dominical', rol);
};

export const limpiarSesion = () => {
    localStorage.removeItem('rol_dominical');
};
