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

    // MEJORADO: Elimina al alumno Y actualiza las asistencias recientes
    eliminar: async (idAlumno, campo) => {
        try {
            const batch = window.db.batch();
            
            // 1. Borrar al alumno
            const alumnoRef = window.db.collection('alumnos').doc(idAlumno);
            batch.delete(alumnoRef);

            // 2. Buscar asistencias de este campo y quitar al alumno
            if (campo) {
                const asistenciasSnap = await window.db.collection('asistencias')
                    .where('campo', '==', campo)
                    .get();

                asistenciasSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.registros && !data.esReset) {
                        // Filtramos para quitar al niño eliminado
                        const nuevosRegistros = data.registros.filter(r => r.idAlumno !== idAlumno);
                        
                        // Si el niño estaba en esta lista, la actualizamos y recalculamos
                        if (nuevosRegistros.length !== data.registros.length) {
                            const p = nuevosRegistros.filter(r => r.estado === 'Presente').length;
                            const a = nuevosRegistros.filter(r => r.estado === 'Ausente').length;
                            const per = nuevosRegistros.filter(r => r.estado === 'Permiso').length;
                            batch.update(doc.ref, { 
                                registros: nuevosRegistros, 
                                totales: { presentes: p, ausentes: a, permisos: per } 
                            });
                        }
                    }
                });
            }

            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error al eliminar alumno en cascada:", error);
            throw error;
        }
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

    suscribirHistorialPorCampo: (campo, callback) => {
        const inicioAnio = new Date(new Date().getFullYear(), 0, 1).getTime();
        return window.db.collection('asistencias')
            .where('campo', '==', campo)
            .onSnapshot((snapshot) => {
                let data = snapshot.docs.map(doc => doc.data());
                data = data.filter(d => d.timestamp && d.timestamp >= inicioAnio);
                data.sort((a, b) => b.timestamp - a.timestamp); 
                callback(data);
            });
    },

    suscribirHistorialGlobal: (callback) => {
        const inicioAnio = new Date(new Date().getFullYear(), 0, 1).getTime();
        return window.db.collection('asistencias')
            .onSnapshot((snapshot) => {
                let data = snapshot.docs.map(doc => doc.data());
                data = data.filter(d => d.timestamp && d.timestamp >= inicioAnio);
                data.sort((a, b) => b.timestamp - a.timestamp);
                callback(data);
            });
    },

    eliminarCampoCompleto: async (campo) => {
        try {
            const batch = window.db.batch();
            const alumnosSnap = await window.db.collection('alumnos').where('campo', '==', campo).get();
            alumnosSnap.docs.forEach(doc => batch.delete(doc.ref));
            const asistenciasSnap = await window.db.collection('asistencias').where('campo', '==', campo).get();
            asistenciasSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return true;
        } catch (error) { console.error(error); throw error; }
    },

    // NUEVO: REINICIO DE MATERIAL (Ciclo 1 o 2) POR EL ADMINISTRADOR
    reiniciarLecciones: async (campo, leccionBase) => {
        const idDoc = `RESET_${Date.now()}_${campo.replace(/\s+/g, '')}`;
        await window.db.collection('asistencias').doc(idDoc).set({
            campo: campo,
            fecha: new Date().toLocaleDateString('en-CA'),
            maestro: 'Administrador (Reinicio)',
            leccion: leccionBase, // Será 0 (para empezar en 1) o 25 (para empezar en 26)
            leccionImpartida: true,
            esReset: true, // Marca oculta para que no ensucie la asistencia
            registros: [],
            totales: { presentes: 0, ausentes: 0, permisos: 0 },
            timestamp: Date.now()
        });
    }
};
