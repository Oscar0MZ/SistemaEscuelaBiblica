export const renderDashboard = () => {

const usuario = JSON.parse(localStorage.getItem("usuario"));

return `

<h2>Bienvenido ${usuario.nombre}</h2>

<p>Rol: ${usuario.rol}</p>

<p>Campo: ${usuario.campo}</p>

<button onclick="cerrarSesion()">Cerrar sesión</button>

`;

};

window.cerrarSesion = () => {

localStorage.removeItem("usuario");
location.reload();

};
