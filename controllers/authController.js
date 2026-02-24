import { loginUsuario } from "../services/authService.js";

export const iniciarSesion = async () => {

const nombre = document.getElementById("nombre").value;
const rol = document.getElementById("rol").value;
const campo = document.getElementById("campo").value;
const password = document.getElementById("password").value;

const usuario = await loginUsuario(rol, password);

if (!usuario) {

alert("Datos incorrectos");
return;

}

localStorage.setItem("usuario", JSON.stringify(usuario));

window.location.href = "index.html";

};
