const CLAVES = {
    ADMIN: "1234",
    MAESTRO: "2222",
    AUXILIAR: "3333",
    LOGISTICA: "4444"
};

window.AuthService = {
    verificarCredenciales: (rol, clave) => CLAVES[rol] === clave,
    obtenerSesion: () => localStorage.getItem('rol_dominical'),
    guardarSesion: (rol) => localStorage.setItem('rol_dominical', rol),
    limpiarSesion: () => localStorage.removeItem('rol_dominical')
};
