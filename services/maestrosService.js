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

    // 4. ELIMINAR EN CASCADA (CORREGIDO: BORRA TODA LA SEMANA)
    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            const batch = window.db.batch();

            if (campoMaestro) {
                // A) BORRAR ALUMNOS
                const snapshotAlumnos = await window.db.collection('alumnos')
                    .where('campo', '==', campoMaestro)
                    .get();
                snapshotAlumnos.docs.forEach(doc => batch.delete(doc.ref));

                // B) BORRAR ASISTENCIAS (DE LUNES A DOMINGO DE ESTA SEMANA)
                // Usamos la misma lógica que el dashboard para encontrar los días
                const hoy = new Date();
                const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun...
                
                // Calcular el Lunes de la semana actual
                const distanciaAlLunes = diaSemana === 0 ? 6 : diaSemana - 1;
                const lunes = new Date(hoy);
                lunes.setDate(hoy.getDate() - distanciaAlLunes);

                const campoId = campoMaestro.replace(/\s+/g, '');

                // Recorremos los 7 días de la semana y borramos la asistencia si existe
                for (let i = 0; i < 7; i++) {
                    const dia = new Date(lunes);
                    dia.setDate(lunes.getDate() + i);
                    const fechaStr = dia.toLocaleDateString('en-CA');
                    
                    const idAsistencia = `${fechaStr}_${campoId}`;
                    // Intentamos borrar el documento (si no existe, Firestore ignora la orden sin error)
                    batch.delete(window.db.collection('asistencias').doc(idAsistencia));
                }
            }

            // C) BORRAR MAESTRO
            const maestroRef = window.db.collection('maestros').doc(idMaestro);
            batch.delete(maestroRef);

            // EJECUTAR TODO
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error eliminando en cascada:", error);
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
