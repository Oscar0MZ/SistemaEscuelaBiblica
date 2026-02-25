// services/authService.js

const CLAVES = {
    ADMIN: "1234",
    MAESTRO: "2222",
    AUXILIAR: "3333",
    LOGISTICA: "4444"
};

window.AuthService = {
    // Verificar clave
    verificar: (rol, clave) => {
        return CLAVES[rol] === clave;
    },

    // 1. Recuperar ROL
    obtenerSesion: () => {
        return localStorage.getItem('rol_dominical');
    },

    // 2. Recuperar DATOS DEL USUARIO (Campo, Nombre, ID)
    obtenerDatosUsuario: () => {
        const datos = localStorage.getItem('datos_usuario_dominical');
        return datos ? JSON.parse(datos) : null;
    },

    // 3. Guardar SESIÓN COMPLETA
    guardarSesion: (rol, datosUsuario) => {
        localStorage.setItem('rol_dominical', rol);
        // Guardamos el objeto con el campo para que no se pierda al refrescar
        if (datosUsuario) {
            localStorage.setItem('datos_usuario_dominical', JSON.stringify(datosUsuario));
        }
    },

    // 4. Cerrar Sesión (Borrar todo)
    cerrarSesion: () => {
        localStorage.removeItem('rol_dominical');
        localStorage.removeItem('datos_usuario_dominical');
    }
};
