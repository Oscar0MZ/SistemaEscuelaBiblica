import { iniciarSesion } from "../controllers/authController.js";

export const renderLogin = () => {

return `

<div class="login">

<h2>Escuela Bíblica Dominical</h2>

<input id="nombre" placeholder="Nombre completo">

<select id="rol">

<option value="">Seleccione rol</option>
<option value="ADMIN">Administrador</option>
<option value="MAESTRO">Maestro</option>
<option value="AUXILIAR">Auxiliar</option>
<option value="LOGISTICA">Logística</option>

</select>

<select id="campo">

<option value="">Seleccione campo</option>
<option>La Isla</option>
<option>Las Delicias</option>
<option>El Amatal</option>
<option>Buenos Aires</option>
<option>Corozal 1</option>
<option>El Porvenir</option>
<option>El Caulote</option>
<option>Corozal 2</option>
<option>Valle Encantado</option>
<option>La Playa</option>

</select>

<input id="password" type="password" placeholder="Contraseña">

<button onclick="iniciarSesion()">Entrar</button>

</div>

`;

};
