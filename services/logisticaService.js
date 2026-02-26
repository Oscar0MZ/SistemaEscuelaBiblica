// services/logisticaService.js

window.LogisticaService = {
    // Escuchar todas las entregas en tiempo real
    suscribirTodas: (callback) => {
        return window.db.collection('entregas')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            });
    },

    // Crear una nueva asignación de víveres
    crear: async (datos) => {
        try {
            await window.db.collection('entregas').add({
                ...datos,
                estado: 'Pendiente',
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error("Error al asignar entrega:", error);
            throw error;
        }
    },

    // Marcar como entregado (o revertir a pendiente)
    actualizarEstado: async (id, estado) => {
        try {
            await window.db.collection('entregas').doc(id).update({ 
                estado: estado,
                fechaEntrega: estado === 'Entregado' ? Date.now() : null
            });
            return true;
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            throw error;
        }
    },

    // Eliminar una asignación (solo Admin)
    eliminar: async (id) => {
        try {
            await window.db.collection('entregas').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar entrega:", error);
            throw error;
        }
    }
};
