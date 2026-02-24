import { crearAlumno, listarAlumnos } from "./controllers/alumnosController.js";

// Crear alumno
await crearAlumno("Juan", 10, "Masculino");

// Listar alumnos
const alumnos = await listarAlumnos();

console.log(alumnos);
