import { renderLogin } from "./views/loginView.js";
import { renderDashboard } from "./views/dashboardView.js";

const app = document.getElementById("app");

const usuario = localStorage.getItem("usuario");

if (!usuario) {

app.innerHTML = renderLogin();

} else {

app.innerHTML = renderDashboard();

}
