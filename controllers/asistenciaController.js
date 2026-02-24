import {
    asistenciaYaExiste,
    guardarAsistencia
} from "../services/asistenciaService.js";

export async function registrarAsistencia(datos) {

    const existe = await asistenciaYaExiste(datos.fecha, datos.campo);

    if (existe) {

        throw new Error("La asistencia ya fue registrada");

    }

    await guardarAsistencia(datos);

}
