// services/maestrosService.js

window.MaestrosService = {
    suscribir: (callback) => {
        return window.db.collection('maestros').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },

    vigilarUsuario: (id, callback) => {
        return window.db.collection('maestros').doc(id).onSnapshot((doc) => {
            callback(doc.exists ? doc.data() : null);
        });
    },

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

    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            await window.db.collection('maestros').doc(idMaestro).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            throw error;
        }
    },

    eliminar: async (id) => {
        await window.db.collection('maestros').doc(id).delete();
    },

    aprobar: async (id) => {
        await window.db.collection('maestros').doc(id).update({ estado: 'Activo' });
    },

    notificar: (datos) => {
        if (window.emailjs) {
            window.emailjs.send("service_475d2ya", "template_516xc7k", {
                to_name: "Director",
                from_name: datos.registradoPor || "Usuario",
                new_member: datos.nombre,
                role: datos.clase
            });
        }
    },

    // NUEVO: CONTROL DE MANTENIMIENTO GLOBAL
    suscribirMantenimiento: (callback) => {
        return window.db.collection('sistema').doc('config').onSnapshot((doc) => {
            if (doc.exists) {
                callback(doc.data().mantenimiento || false);
            } else {
                callback(false); // Por defecto el sistema está abierto
            }
        });
    },

    toggleMantenimiento: async (estadoActual) => {
        await window.db.collection('sistema').doc('config').set({ 
            mantenimiento: !estadoActual 
        }, { merge: true });
    }
};
