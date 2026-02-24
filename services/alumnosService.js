// services/alumnosService.js

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

    // 2. CORREGIDO: Escuchar lista filtrando SOLO POR CAMPO
    // Esto asegura que cada lugar sea independiente
    suscribirPorCampo: (campo, callback) => {
        return window.db.collection('alumnos')
            .where('campo', '==', campo) // <--- ÚNICO FILTRO
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Ordenar alfabéticamente
                data.sort((a, b) => a.nombre.localeCompare(b.nombre));
                callback(data);
            });
    },

    // 3. CORREGIDO: Asistencia por CAMPO (General del lugar)
    guardarAsistencia: async (datos) => {
        // ID Único: FECHA + CAMPO (Ej: "2023-10-27_LaIsla")
        // Quitamos espacios del nombre del campo para el ID
        const idDoc = `${datos.fecha}_${datos.campo.replace(/\s+/g, '')}`; 
        
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    // 4. CORREGIDO: Escuchar Asistencia de HOY por CAMPO
    suscribirAsistenciaHoy: (campo, callback) => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const idDoc = `${hoy}_${campo.replace(/\s+/g, '')}`;
        
        return window.db.collection('asistencias').doc(idDoc).onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    }
};
