// services/alumnosService.js

window.AlumnosService = {
    // 1. Guardar Alumno (Registro)
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

    // 2. Escuchar lista de alumnos por clase
    suscribirPorClase: (clase, callback) => {
        return window.db.collection('alumnos')
            .where('clase', '==', clase)
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => a.nombre.localeCompare(b.nombre));
                callback(data);
            });
    },

    // 3. NUEVO: Guardar Asistencia
    guardarAsistencia: async (datos) => {
        // Creamos un ID único: FECHA + CLASE (Ej: "2023-10-27_Párvulos")
        // Así evitamos duplicados y podemos editarla si nos equivocamos.
        const idDoc = `${datos.fecha}_${datos.clase}`;
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    // 4. NUEVO: Escuchar Asistencia de HOY
    suscribirAsistenciaHoy: (clase, callback) => {
        const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        const idDoc = `${hoy}_${clase}`;
        
        return window.db.collection('asistencias').doc(idDoc).onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback(null); // No se ha tomado lista hoy
            }
        });
    }
};
