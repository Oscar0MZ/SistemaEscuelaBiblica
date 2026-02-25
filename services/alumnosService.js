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

    // 6. Guardar Asistencia (Sobrescribe si ya existe para ese día -> Permite Editar)
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

    // 8. NUEVO: Suscribir FIN DE SEMANA INTELIGENTE (Admin)
    suscribirAsistenciaFinDeSemana: (callback) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun... 6=Sab
        
        let fechaSabado = new Date(hoy);
        let fechaDomingo = new Date(hoy);

        // REGLA: 
        // Viernes(5), Sábado(6), Domingo(0) -> Mostrar Finde ACTUAL
        // Lunes(1) a Jueves(4) -> Mostrar Finde PASADO (para revisar datos)
        
        if (diaSemana === 5) { // Viernes
            fechaSabado.setDate(hoy.getDate() + 1);
            fechaDomingo.setDate(hoy.getDate() + 2);
        } else if (diaSemana === 6) { // Sábado (Hoy)
            fechaDomingo.setDate(hoy.getDate() + 1);
        } else if (diaSemana === 0) { // Domingo (Hoy)
            fechaSabado.setDate(hoy.getDate() - 1);
        } else { // Lun-Jue (Retroceder)
            const diasParaDomingo = diaSemana; // Si es lunes(1), resto 1 para llegar a domingo pasado
            fechaDomingo.setDate(hoy.getDate() - diasParaDomingo);
            fechaSabado.setDate(hoy.getDate() - diasParaDomingo - 1);
        }

        const sabadoStr = fechaSabado.toLocaleDateString('en-CA');
        const domingoStr = fechaDomingo.toLocaleDateString('en-CA');

        // Escuchar datos de ambas fechas
        return window.db.collection('asistencias')
            .where('fecha', 'in', [sabadoStr, domingoStr])
            .onSnapshot((snapshot) => {
                const registros = snapshot.docs.map(doc => doc.data());
                // Devolvemos los datos Y las fechas que estamos viendo
                callback({
                    registros: registros,
                    fechas: { sabado: sabadoStr, domingo: domingoStr }
                });
            });
    }
};
