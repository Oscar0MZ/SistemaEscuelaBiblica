import Alumno from "../models/alumno.js";

import {
  guardarAlumno,
  obtenerAlumnos
} from "../services/alumnosService.js";


export async function crearAlumno(nombre, edad, genero) {

  const alumno = new Alumno(nombre, edad, genero);

  await guardarAlumno(alumno);

}


export async function listarAlumnos() {

  return await obtenerAlumnos();

}
