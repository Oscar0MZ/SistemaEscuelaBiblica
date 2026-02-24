// views/alumnosView.js

// CAMPOS
const CAMPOS = [
  "La Isla",
  "Las Delicias",
  "El Amatal",
  "Buenos Aires",
  "Corozal 1",
  "El Porvenir",
  "El Cauloté",
  "Corozal 2",
  "Valle Encantado",
  "La Playa"
];

// CLAVES
const CLAVES = {
  ADMIN: "1234",
  MAESTRO: "2222",
  AUXILIAR: "3333",
  LOGISTICA: "4444"
};


// FUNCION PRINCIPAL
export function renderLogin(container) {

  container.innerHTML = `

  <div class="flex items-center justify-center h-screen bg-indigo-600">

    <div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">

      <h2 class="text-2xl font-bold text-center mb-6">
        Escuela Bíblica Dominical
      </h2>


      <form id="loginForm" class="space-y-4">


        <select id="rol" class="w-full p-3 border rounded-xl" required>

          <option value="">Seleccione rol</option>

          <option value="ADMIN">Administrador</option>

          <option value="MAESTRO">Maestro</option>

          <option value="AUXILIAR">Auxiliar</option>

          <option value="LOGISTICA">Logística</option>

        </select>



        <div id="extraCampos"></div>



        <input
          type="password"
          id="clave"
          placeholder="Clave"
          class="w-full p-3 border rounded-xl"
          required
        >



        <button
          type="submit"
          class="w-full bg-indigo-600 text-white p-3 rounded-xl"
        >
          Entrar
        </button>

      </form>


      <p id="error" class="text-red-500 text-sm mt-2"></p>


    </div>

  </div>

  `;


  const rolSelect = document.getElementById("rol");
  const extraCampos = document.getElementById("extraCampos");


  rolSelect.addEventListener("change", () => {

    const rol = rolSelect.value;

    if (rol === "MAESTRO" || rol === "AUXILIAR") {

      extraCampos.innerHTML = `

        <input
          type="text"
          id="nombre"
          placeholder="Ingrese su nombre"
          class="w-full p-3 border rounded-xl"
          required
        >

        <select
          id="campo"
          class="w-full p-3 border rounded-xl"
          required
        >

          <option value="">Seleccione campo</option>

          ${CAMPOS.map(c =>
            `<option value="${c}">${c}</option>`
          ).join("")}

        </select>

      `;

    } else {

      extraCampos.innerHTML = "";

    }

  });



  document
    .getElementById("loginForm")
    .addEventListener("submit", manejarLogin);

}



// LOGIN
function manejarLogin(e) {

  e.preventDefault();

  const rol = document.getElementById("rol").value;
  const clave = document.getElementById("clave").value;

  const nombre =
    document.getElementById("nombre")?.value || "";

  const campo =
    document.getElementById("campo")?.value || "";


  if (clave !== CLAVES[rol]) {

    document.getElementById("error").innerText =
      "Clave incorrecta";

    return;

  }


  const usuario = {

    rol,
    nombre,
    campo

  };


  // guardar sesion
  localStorage.setItem(
    "usuario",
    JSON.stringify(usuario)
  );


  // enviar correo si es maestro o auxiliar
  if (rol === "MAESTRO" || rol === "AUXILIAR") {

    enviarSolicitud(usuario);

    alert("Solicitud enviada al administrador");

  }


  location.reload();

}



// EMAIL
function enviarSolicitud(usuario) {

  if (!window.emailjs) return;

  emailjs.send(
    "service_475d2ya",
    "template_516xc7k",
    {
      nombre: usuario.nombre,
      campo: usuario.campo,
      rol: usuario.rol
    }
  )
  .then(() => {

    console.log("Correo enviado");

  })
  .catch(err => {

    console.log(err);

  });

}
