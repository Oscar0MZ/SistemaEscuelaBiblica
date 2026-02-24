import {
    registrarAlumno,
    listarAlumnos
} from "../controllers/alumnosController.js";

export function iniciarVistaAlumnos() {

    document
        .getElementById("btnGuardarAlumno")
        .addEventListener("click", guardarAlumno);

    cargarAlumnos();

}

async function guardarAlumno() {

    const nombre = document.getElementById("nombreAlumno").value;
    const edad = document.getElementById("edadAlumno").value;
    const fechaNacimiento = document.getElementById("fechaAlumno").value;
    const campo = document.getElementById("campoAlumno").value;

    await registrarAlumno({

        nombre,
        edad,
        fechaNacimiento,
        campo

    });

    alert("Alumno guardado");

}

async function cargarAlumnos() {

    const alumnos = await listarAlumnos();

    console.log(alumnos);

}
