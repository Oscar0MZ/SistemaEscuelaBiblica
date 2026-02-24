// services/maestrosService.js
import { db } from '../config/firebase.js';

// Escuchar cambios en tiempo real
export const suscribirMaestros = (callback) => {
    return db.collection('maestros').onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        callback(data);
    });
};

export const guardarMaestro = async (datos, id = null, usuarioActual) => {
    try {
        if (id) {
            // Actualizar existente
            await db.collection('maestros').doc(id).update(datos);
        } else {
            // Crear nuevo
            const nuevoRegistro = { 
                ...datos, 
                estado: usuarioActual === 'ADMIN' ? 'Activo' : 'Pendiente',
                createdAt: Date.now(),
                registradoPor: usuarioActual
            };
            await db.collection('maestros').add(nuevoRegistro);
            return nuevoRegistro; // Retornamos para poder enviar correo si es necesario
        }
    } catch (error) {
        console.error("Error en servicio maestros:", error);
        throw error;
    }
};

export const eliminarMaestro = async (id) => {
    await db.collection('maestros').doc(id).delete();
};

export const aprobarMaestro = async (id) => {
    await db.collection('maestros').doc(id).update({ estado: 'Activo' });
};

export const enviarNotificacion = (datos) => {
    // Asumiendo que emailjs está disponible globalmente o importado
    if (window.emailjs) {
        window.emailjs.send("service_475d2ya", "template_516xc7k", {
            to_name: "Director",
            from_name: datos.registradoPor || "Usuario",
            new_member: datos.nombre,
            role: datos.clase
        }).then(() => console.log("Correo enviado"));
    }
};
