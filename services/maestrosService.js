// services/maestrosService.js

window.MaestrosService = {
    // 1. Escuchar lista
    suscribir: (callback) => {
        return window.db.collection('maestros').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    // 2. Vigilar usuario
    vigilarUsuario: (id, callback) => {
        return window.db.collection('maestros').doc(id).onSnapshot((doc) => {
            callback(doc.exists ? doc.data() : null);
        });
    },

    // 3. Guardar
    guardar: async (datos, id = null, usuarioActual) => {
        try {
            if (id) {
                await window.db.collection('maestros').doc(id).update(datos);
            } else {
                const nuevo = { 
                    ...datos, 
                    estado: usuarioActual === 'ADMIN' ? 'Activo' : 'Pendiente',
                    createdAt: Date.now(),
                    registradoPor: usuarioActual
                };
                await window.db.collection('maestros').add(nuevo);
                return nuevo;
            }
        } catch (error) {
            console.error("Error guardando:", error);
            throw error;
        }
    },

    // 4. ELIMINAR EN CASCADA (CORREGIDO: MAESTRO + ALUMNOS + ASISTENCIA)
    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            const batch = window.db.batch();

            if (campoMaestro) {
                // A) BORRAR ALUMNOS
                const snapshotAlumnos = await window.db.collection('alumnos')
                    .where('campo', '==', campoMaestro)
                    .get();
                snapshotAlumnos.docs.forEach(doc => batch.delete(doc.ref));

                // B) BORRAR ASISTENCIAS (Sábado y Domingo actual)
                // Calculamos las fechas igual que en el servicio de alumnos
                const hoy = new Date();
                const diaSemana = hoy.getDay(); 
                let fechaSabado = new Date(hoy);
                let fechaDomingo = new Date(hoy);

                if (diaSemana === 0) { // Domingo
                    fechaSabado.setDate(hoy.getDate() - 1);
                } else if (diaSemana === 6) { // Sábado
                    fechaDomingo.setDate(hoy.getDate() + 1);
                } else {
                    const distSabado = 6 - diaSemana;
                    fechaSabado.setDate(hoy.getDate() + distSabado);
                    fechaDomingo.setDate(hoy.getDate() + distSabado + 1);
                }

                const sabadoStr = fechaSabado.toLocaleDateString('en-CA');
                const domingoStr = fechaDomingo.toLocaleDateString('en-CA');
                
                // IDs de documentos de asistencia
                const campoId = campoMaestro.replace(/\s+/g, '');
                const idAsistenciaSab = `${sabadoStr}_${campoId}`;
                const idAsistenciaDom = `${domingoStr}_${campoId}`;

                // Agregamos al lote de borrado
                batch.delete(window.db.collection('asistencias').doc(idAsistenciaSab));
                batch.delete(window.db.collection('asistencias').doc(idAsistenciaDom));
            }

            // C) BORRAR MAESTRO
            const maestroRef = window.db.collection('maestros').doc(idMaestro);
            batch.delete(maestroRef);

            // EJECUTAR TODO
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error eliminando en cascada:", error);
            // Fallback: intentar borrar al menos al maestro si falla lo demás
            try {
                await window.db.collection('maestros').doc(idMaestro).delete();
                return true;
            } catch (e) { throw e; }
        }
    },

    // 5. Eliminar simple
    eliminar: async (id) => {
        await window.db.collection('maestros').doc(id).delete();
    },

    // 6. Aprobar
    aprobar: async (id) => {
        await window.db.collection('maestros').doc(id).update({ estado: 'Activo' });
    },

    // 7. Notificar
    notificar: (datos) => {
        if (window.emailjs) {
            window.emailjs.send("service_475d2ya", "template_516xc7k", {
                to_name: "Director",
                from_name: datos.registradoPor || "Usuario",
                new_member: datos.nombre,
                role: datos.clase
            });
        }
    }
};
