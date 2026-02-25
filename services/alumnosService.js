// services/alumnosService.js

window.AlumnosService = {
    // 1. Registrar Alumno
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

    // 2. Actualizar
    actualizar: async (id, datosAlumno) => {
        await window.db.collection('alumnos').doc(id).update(datosAlumno);
        return true;
    },

    // 3. Eliminar
    eliminar: async (id) => {
        await window.db.collection('alumnos').doc(id).delete();
        return true;
    },

    // 4. Suscribir por Campo
    suscribirPorCampo: (campo, callback) => {
        return window.db.collection('alumnos')
            .where('campo', '==', campo)
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => a.nombre.localeCompare(b.nombre));
                callback(data);
            });
    },

    // 5. Suscribir TODOS
    suscribirTodos: (callback) => {
        return window.db.collection('alumnos')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            });
    },

    // 6. Guardar Asistencia (Fecha exacta)
    guardarAsistencia: async (datos) => {
        const idDoc = `${datos.fecha}_${datos.campo.replace(/\s+/g, '')}`; 
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    // 7. Suscribir Asistencia HOY (Para el Maestro - Solo ve su día actual)
    suscribirAsistenciaHoy: (campo, callback) => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const idDoc = `${hoy}_${campo.replace(/\s+/g, '')}`;
        return window.db.collection('asistencias').doc(idDoc).onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback(null); // Si no existe (es un nuevo domingo), devuelve null para empezar de cero
            }
        });
    },

    // 8. NUEVO: Suscribir Asistencia FIN DE SEMANA (Para el Admin - Suma Sábado y Domingo)
    suscribirAsistenciaFinDeSemana: (callback) => {
        // Calcular fechas de este fin de semana
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=Domingo, 6=Sábado
        
        // Ajustamos para obtener siempre el Sábado y Domingo de la semana actual
        // Si hoy es Domingo (0), Sábado fue ayer (-1).
        // Si hoy es Sábado (6), Domingo es mañana (+1).
        // Si es Lunes-Viernes, calculamos el fin de semana próximo o pasado según lógica (asumimos semana actual).
        
        let fechaSabado = new Date(hoy);
        let fechaDomingo = new Date(hoy);

        if (diaSemana === 0) { // Domingo
            fechaSabado.setDate(hoy.getDate() - 1);
        } else if (diaSemana === 6) { // Sábado
            fechaDomingo.setDate(hoy.getDate() + 1);
        } else {
            // Si entran un Miércoles, mostramos el finde que viene
            const distSabado = 6 - diaSemana;
            fechaSabado.setDate(hoy.getDate() + distSabado);
            fechaDomingo.setDate(hoy.getDate() + distSabado + 1);
        }

        const sabadoStr = fechaSabado.toLocaleDateString('en-CA');
        const domingoStr = fechaDomingo.toLocaleDateString('en-CA');

        // Buscamos documentos que sean del Sábado O del Domingo
        return window.db.collection('asistencias')
            .where('fecha', 'in', [sabadoStr, domingoStr])
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => doc.data());
                callback(data);
            });
    }
};
