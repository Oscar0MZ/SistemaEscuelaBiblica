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

    // 4. ELIMINAR USUARIO (AHORA ES 100% SEGURO)
    // Ya NO borra alumnos ni asistencias. Solo borra el acceso del personal.
    eliminarConAlumnos: async (idMaestro, campoMaestro) => {
        try {
            // Únicamente eliminamos el documento del usuario en la colección 'maestros'
            await window.db.collection('maestros').doc(idMaestro).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            throw error;
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
