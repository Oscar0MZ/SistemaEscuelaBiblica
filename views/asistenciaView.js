import {
    registrarAsistencia
} from "../controllers/asistenciaController.js";

export function iniciarVistaAsistencia() {

    document
        .getElementById("btnPasarAsistencia")
        .addEventListener("click", pasarAsistencia);

}

async function pasarAsistencia() {

    const campo = document.getElementById("campoUsuario").value;

    const fecha = new Date().toISOString().split("T")[0];

    try {

        await registrarAsistencia({

            fecha,
            campo,
            creadoPor: "usuario"

        });

        alert("Asistencia guardada");

    } catch (error) {

        alert(error.message);

    }

}
