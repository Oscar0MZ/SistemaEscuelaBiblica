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

    // 2. Actualizar Alumno
    actualizar: async (id, datosAlumno) => {
        try {
            await window.db.collection('alumnos').doc(id).update(datosAlumno);
            return true;
        } catch (error) {
            console.error("Error actualizando:", error);
            throw error;
        }
    },

    // 3. Eliminar Alumno
    eliminar: async (id) => {
        try {
            await window.db.collection('alumnos').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error eliminando:", error);
            throw error;
        }
    },

    // 4. Escuchar lista por CAMPO (Para Maestros)
    suscribirPorCampo: (campo, callback) => {
        return window.db.collection('alumnos')
            .where('campo', '==', campo)
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => a.nombre.localeCompare(b.nombre));
                callback(data);
            });
    },

    // 5. NUEVO: Escuchar TODOS los alumnos (Para el Director/Admin)
    suscribirTodos: (callback) => {
        return window.db.collection('alumnos')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            });
    },

    // 6. Asistencia
    guardarAsistencia: async (datos) => {
        const idDoc = `${datos.fecha}_${datos.campo.replace(/\s+/g, '')}`; 
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    // 7. Escuchar Asistencia Hoy
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
