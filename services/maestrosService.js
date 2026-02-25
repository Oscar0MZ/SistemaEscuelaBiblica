// services/maestrosService.js

window.MaestrosService = {
    // 1. Escuchar la lista completa (Para el Admin)
    suscribir: (callback) => {
        return window.db.collection('maestros').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    // 2. NUEVO: Vigilar estado de UN solo usuario (Para expulsarlo si lo borran)
    vigilarUsuario: (id, callback) => {
        return window.db.collection('maestros').doc(id).onSnapshot((doc) => {
            // Si el documento existe, devolvemos los datos. Si no existe (fue borrado), devolvemos null.
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

    // 4. Eliminar
    eliminar: async (id) => {
        await window.db.collection('maestros').doc(id).delete();
    },

    // 5. Aprobar
    aprobar: async (id) => {
        await window.db.collection('maestros').doc(id).update({ estado: 'Activo' });
    },

    // 6. Notificar
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
