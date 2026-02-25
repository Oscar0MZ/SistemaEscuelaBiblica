// services/alumnosService.js

window.AlumnosService = {
    // 1. Registrar
    registrar: async (datosAlumno) => {
        try {
            await window.db.collection('alumnos').add({ ...datosAlumno, createdAt: Date.now() });
            return true;
        } catch (error) { console.error(error); throw error; }
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
        return window.db.collection('alumnos').where('campo', '==', campo).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    // 5. Suscribir Todos
    suscribirTodos: (callback) => {
        return window.db.collection('alumnos').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(data);
        });
    },

    // 6. Guardar Asistencia
    guardarAsistencia: async (datos) => {
        const idDoc = `${datos.fecha}_${datos.campo.replace(/\s+/g, '')}`; 
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    // 7. Suscribir Asistencia HOY (Maestros)
    suscribirAsistenciaHoy: (campo, callback) => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const idDoc = `${hoy}_${campo.replace(/\s+/g, '')}`;
        return window.db.collection('asistencias').doc(idDoc).onSnapshot((doc) => {
            callback(doc.exists ? doc.data() : null);
        });
    },

    // 8. NUEVO: SEMANA ACUMULATIVA (Lunes a Domingo)
    suscribirAsistenciaSemanal: (callback) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun...
        
        // Calcular el LUNES de esta semana
        // Si hoy es domingo (0), el lunes fue hace 6 días. Si es lunes (1), es hoy (0 días atrás).
        const distanciaAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - distanciaAlLunes);

        // Generar array con las 7 fechas de la semana (Lun a Dom)
        const fechasSemana = [];
        for (let i = 0; i < 7; i++) {
            const dia = new Date(lunes);
            dia.setDate(lunes.getDate() + i);
            fechasSemana.push(dia.toLocaleDateString('en-CA'));
        }

        const inicioSemanaStr = fechasSemana[0]; // Lunes
        const finSemanaStr = fechasSemana[6];    // Domingo

        // Consultamos cualquier asistencia que coincida con CUALQUIER día de esta semana
        return window.db.collection('asistencias')
            .where('fecha', 'in', fechasSemana)
            .onSnapshot((snapshot) => {
                const registros = snapshot.docs.map(doc => doc.data());
                callback({
                    registros: registros,
                    rango: { inicio: inicioSemanaStr, fin: finSemanaStr }
                });
            });
    }
};
