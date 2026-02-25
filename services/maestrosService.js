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

    // 4. ELIMINAR EN CASCADA (CORREGIDO Y REFORZADO)
    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            const batch = window.db.batch();

            // Solo intentamos borrar alumnos si hay un campo definido
            if (campoMaestro) {
                const snapshotAlumnos = await window.db.collection('alumnos')
                    .where('campo', '==', campoMaestro)
                    .get();

                // Añadir cada alumno al lote de borrado
                snapshotAlumnos.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            // Añadir al maestro al lote de borrado
            const maestroRef = window.db.collection('maestros').doc(idMaestro);
            batch.delete(maestroRef);

            // Ejecutar todo junto
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error eliminando en cascada:", error);
            // Si falla el lote, intentamos borrar al menos al maestro
            try {
                await window.db.collection('maestros').doc(idMaestro).delete();
                return true;
            } catch (e) {
                throw e;
            }
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
