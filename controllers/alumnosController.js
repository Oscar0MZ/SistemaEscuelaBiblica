import { guardarAlumno, obtenerAlumnos } from "../services/alumnosService.js";

export const crearAlumno = async (nombre, edad, genero) => {
  const alumno = {
    nombre,
    edad,
    genero
  };

  await guardarAlumno(alumno);
};

export const listarAlumnos = async () => {
  return await obtenerAlumnos();
};
