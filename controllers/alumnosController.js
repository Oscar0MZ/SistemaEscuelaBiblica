import { crearAlumno, obtenerAlumnos } from "../services/alumnosService.js";

export async function registrarAlumno(datos) {

    await crearAlumno(datos);

}

export async function listarAlumnos() {

    return await obtenerAlumnos();

}
