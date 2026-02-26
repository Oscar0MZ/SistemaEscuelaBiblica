// services/alumnosService.js

window.AlumnosService = {
    registrar: async (datosAlumno) => {
        try {
            const busqueda = await window.db.collection('alumnos')
                .where('campo', '==', datosAlumno.campo)
                .where('nombre', '==', datosAlumno.nombre.trim())
                .get();

            if (!busqueda.empty) throw new Error("DUPLICADO");

            await window.db.collection('alumnos').add({ ...datosAlumno, createdAt: Date.now() });
            return true;
        } catch (error) { console.error(error); throw error; }
    },

    actualizar: async (id, datosAlumno) => {
        await window.db.collection('alumnos').doc(id).update(datosAlumno);
        return true;
    },

    eliminar: async (id) => {
        await window.db.collection('alumnos').doc(id).delete();
        return true;
    },

    suscribirPorCampo: (campo, callback) => {
        return window.db.collection('alumnos').where('campo', '==', campo).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    suscribirTodos: (callback) => {
        return window.db.collection('alumnos').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(data);
        });
    },

    guardarAsistencia: async (datos) => {
        const idDoc = `${datos.fecha}_${datos.campo.replace(/\s+/g, '')}`; 
        await window.db.collection('asistencias').doc(idDoc).set(datos);
    },

    suscribirAsistenciaHoy: (campo, callback) => {
        const hoy = new Date().toLocaleDateString('en-CA');
        const idDoc = `${hoy}_${campo.replace(/\s+/g, '')}`;
        return window.db.collection('asistencias').doc(idDoc).onSnapshot((doc) => {
            callback(doc.exists ? doc.data() : null);
        });
    },

    suscribirAsistenciaSemanal: (callback) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); 
        const distanciaAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - distanciaAlLunes);

        const fechasSemana = [];
        for (let i = 0; i < 7; i++) {
            const dia = new Date(lunes);
            dia.setDate(lunes.getDate() + i);
            fechasSemana.push(dia.toLocaleDateString('en-CA'));
        }

        const inicioSemanaStr = fechasSemana[0]; 
        const finSemanaStr = fechasSemana[6];    

        return window.db.collection('asistencias')
            .where('fecha', 'in', fechasSemana)
            .onSnapshot((snapshot) => {
                const registros = snapshot.docs.map(doc => doc.data());
                callback({
                    registros: registros,
                    rango: { inicio: inicioSemanaStr, fin: finSemanaStr }
                });
            });
    },

    // 9. NUEVO: HISTORIAL ANUAL POR CAMPO (Para Ranking del Maestro)
    suscribirHistorialPorCampo: (campo, callback) => {
        // Establece el "Reinicio" el 1 de Enero del año actual
        const inicioAnio = new Date(new Date().getFullYear(), 0, 1).getTime();
        
        return window.db.collection('asistencias')
            .where('campo', '==', campo)
            .onSnapshot((snapshot) => {
                let data = snapshot.docs.map(doc => doc.data());
                // Solo devuelve los de este año (El reinicio anual automático)
                data = data.filter(d => d.timestamp && d.timestamp >= inicioAnio);
                data.sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero
                callback(data);
            });
    },

    // 10. NUEVO: HISTORIAL ANUAL GLOBAL (Para el Administrador)
    suscribirHistorialGlobal: (callback) => {
        const inicioAnio = new Date(new Date().getFullYear(), 0, 1).getTime();
        
        return window.db.collection('asistencias')
            .onSnapshot((snapshot) => {
                let data = snapshot.docs.map(doc => doc.data());
                data = data.filter(d => d.timestamp && d.timestamp >= inicioAnio);
                data.sort((a, b) => b.timestamp - a.timestamp);
                callback(data);
            });
    }
};
