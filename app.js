import { iniciarVistaAlumnos } from "./views/alumnosView.js";
import { iniciarVistaAsistencia } from "./views/asistenciaView.js";

window.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("btnGuardarAlumno"))
        iniciarVistaAlumnos();

    if (document.getElementById("btnPasarAsistencia"))
        iniciarVistaAsistencia();

});
