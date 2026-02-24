// Usamos window.db que definimos en firebase.js
window.MaestrosService = {
    suscribirMaestros: (callback) => {
        return window.db.collection('maestros').onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            callback(data);
        });
    },
    guardarMaestro: async (datos, id = null, usuarioActual) => {
        try {
            if (id) {
                await window.db.collection('maestros').doc(id).update(datos);
            } else {
                const nuevoRegistro = { 
                    ...datos, 
                    estado: usuarioActual === 'ADMIN' ? 'Activo' : 'Pendiente',
                    createdAt: Date.now(),
                    registradoPor: usuarioActual
                };
                await window.db.collection('maestros').add(nuevoRegistro);
                return nuevoRegistro;
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    },
    eliminarMaestro: async (id) => {
        await window.db.collection('maestros').doc(id).delete();
    },
    aprobarMaestro: async (id) => {
        await window.db.collection('maestros').doc(id).update({ estado: 'Activo' });
    },
    enviarNotificacion: (datos) => {
        if (window.emailjs) {
            window.emailjs.send("service_475d2ya", "template_516xc7k", {
                to_name: "Director",
                from_name: datos.registradoPor || "Usuario",
                new_member: datos.nombre,
                role: datos.clase
            }).then(() => console.log("Correo enviado"));
        }
    }
};
