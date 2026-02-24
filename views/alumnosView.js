import {
  crearAlumno,
  listarAlumnos
} from "../controllers/alumnosController.js";


const btnGuardar = document.getElementById("btnGuardar");

const btnListar = document.getElementById("btnListar");

const lista = document.getElementById("listaAlumnos");



btnGuardar.addEventListener("click", async () => {

  const nombre = document.getElementById("nombre").value;

  const edad = document.getElementById("edad").value;

  const genero = document.getElementById("genero").value;


  if (!nombre || !edad || !genero) {

    alert("Complete todos los campos");

    return;

  }


  await crearAlumno(nombre, edad, genero);

  alert("Alumno guardado correctamente");

});



btnListar.addEventListener("click", async () => {

  const alumnos = await listarAlumnos();

  lista.innerHTML = "";


  alumnos.forEach(alumno => {

    const li = document.createElement("li");

    li.textContent =
      alumno.nombre +
      " - " +
      alumno.edad +
      " años - " +
      alumno.genero;

    lista.appendChild(li);

  });

});
