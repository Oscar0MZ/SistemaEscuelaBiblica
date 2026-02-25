// services/maestrosService.js

window.MaestrosService = {
    // 1. Escuchar la lista completa
    suscribir: (callback) => {
        return window.db.collection('maestros').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    // 2. Vigilar usuario (Seguridad)
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

    // 4. NUEVO: ELIMINACIÓN EN CASCADA (Maestro + Alumnos)
    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            // A) Preparamos el lote de borrado
            const batch = window.db.batch();

            // B) Buscamos todos los alumnos de ese campo
            const snapshotAlumnos = await window.db.collection('alumnos')
                .where('campo', '==', campoMaestro)
                .get();

            // C) Los agregamos a la lista de eliminación
            snapshotAlumnos.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // D) Agregamos al maestro a la lista de eliminación
            const maestroRef = window.db.collection('maestros').doc(idMaestro);
            batch.delete(maestroRef);

            // E) Ejecutamos todo junto (Atómico)
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error eliminando en cascada:", error);
            throw error;
        }
    },

    // 5. Eliminar simple (por si acaso)
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
