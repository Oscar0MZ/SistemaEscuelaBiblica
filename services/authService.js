// Definimos las claves dentro del archivo (no globales) para un poco más de seguridad
const CLAVES_SISTEMA = {
    ADMIN: "1234",
    MAESTRO: "2222",
    AUXILIAR: "3333",
    LOGISTICA: "4444"
};

// Asignamos el servicio a la ventana global (window)
window.AuthService = {
    
    // 1. Verificar si la contraseña coincide con el rol
    verificar: (rol, claveIngresada) => {
        // Verifica si el rol existe y si la clave es correcta
        if (CLAVES_SISTEMA[rol] && CLAVES_SISTEMA[rol] === claveIngresada) {
            return true;
        }
        return false;
    },

    // 2. Recuperar la sesión guardada (si existe)
    obtenerSesion: () => {
        return localStorage.getItem('rol_dominical');
    },

    // 3. Guardar la sesión actual en el navegador
    guardarSesion: (rol) => {
        localStorage.setItem('rol_dominical', rol);
    },

    // 4. Cerrar sesión (borrar datos del navegador)
    cerrarSesion: () => {
        localStorage.removeItem('rol_dominical');
    },

    // 5. (Opcional) Obtener un nombre bonito para mostrar en pantalla
    obtenerNombreLegible: (rol) => {
        const nombres = {
            'ADMIN': 'Director General',
            'MAESTRO': 'Maestro de Escuela',
            'AUXILIAR': 'Auxiliar de Clase',
            'LOGISTICA': 'Equipo Logística'
        };
        return nombres[rol] || rol;
    }
};

console.log("🔒 Servicio de Autenticación (AuthService) cargado correctamente.");
