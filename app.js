// ===============================
// LOGIN SIMPLE CON ROLES FIJOS
// ===============================

window.login = function () {

  const nombre = document.getElementById("loginNombre").value.trim();
  const rol = document.getElementById("loginRol").value;
  const password = document.getElementById("loginPassword").value;

  if (!nombre || !rol || !password) {
    alert("Complete todos los campos");
    return;
  }

  // Credenciales fijas
  const usuarios = [
    { nombre: "admin", rol: "Administrador", password: "admin123" },
    { nombre: "maestro", rol: "Maestro", password: "maestro123" },
    { nombre: "auxiliar", rol: "Auxiliar", password: "auxiliar123" },
    { nombre: "logistica", rol: "Logistica", password: "logistica123" }
  ];

  const usuarioValido = usuarios.find(u =>
    u.nombre === nombre &&
    u.rol === rol &&
    u.password === password
  );

  if (!usuarioValido) {
    alert("Credenciales incorrectas");
    return;
  }

  // Guardar sesión
  localStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));

  alert("Bienvenido " + usuarioValido.rol);

  // Redirección
  window.location.href = "views/sistema.html";

};
