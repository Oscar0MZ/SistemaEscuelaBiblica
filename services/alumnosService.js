// services/alumnosService.js

window.AlumnosService = {
    // Función única para guardar el niño
    registrar: async (datosAlumno) => {
        try {
            // Guardamos en la colección 'alumnos'
            await window.db.collection('alumnos').add({
                ...datosAlumno,
                createdAt: Date.now() // Guardamos cuándo se creó
            });
            return true;
        } catch (error) {
            console.error("Error guardando alumno:", error);
            throw error;
        }
    }
};
