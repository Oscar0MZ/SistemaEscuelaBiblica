window.AlumnosService = {
    // 1. Guardar Alumno
    registrar: async (datosAlumno) => {
        try {
            await window.db.collection('alumnos').add({
                ...datosAlumno,
                createdAt: Date.now()
            });
            return true;
        } catch (error) {
            console.error("Error guardando alumno:", error);
            throw error;
        }
    },

    // 2. NUEVO: Escuchar lista de alumnos por clase
    suscribirPorClase: (clase, callback) => {
        // Traemos solo los niños de la clase del maestro (ej. "Párvulos")
        return window.db.collection('alumnos')
            .where('clase', '==', clase)
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Ordenar por nombre
                data.sort((a, b) => a.nombre.localeCompare(b.nombre));
                callback(data);
            });
    }
};
