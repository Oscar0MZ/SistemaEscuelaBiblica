// ===============================
// 🔥 IMPORTS FIREBASE
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ===============================
// 🔥 CONFIGURACIÓN REAL
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc",
  authDomain: "escuela-dominical-bcc99.firebaseapp.com",
  projectId: "escuela-dominical-bcc99",
  storageBucket: "escuela-dominical-bcc99.firebasestorage.app",
  messagingSenderId: "1039366920419",
  appId: "1:1039366920419:web:09f7c09e2370d3718b8dd6",
  measurementId: "G-0KCFGX6CMD"
};


// ===============================
// 🔥 INICIALIZAR FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ===============================
// 🔐 REGISTRAR USUARIO
// ===============================

window.registrar = async function () {

  const nombre = document.getElementById("registroNombre").value.trim();
  const rol = document.getElementById("registroRol").value;
  const campo = document.getElementById("registroCampo")?.value || "";
  const password = document.getElementById("registroPassword").value;

  if (!nombre || !rol || !password) {
    alert("Complete todos los campos");
    return;
  }

  try {

    // Verificar si ya existe
    const q = query(
      collection(db, "usuarios"),
      where("nombre", "==", nombre)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("Este usuario ya existe");
      return;
    }

    // Administrador entra activo, demás pendientes
    let estado = "Pendiente";

    if (rol === "Administrador") {
      estado = "Activo";
    }

    await addDoc(collection(db, "usuarios"), {

      nombre: nombre,
      rol: rol,
      campo: campo,
      password: password,
      estado: estado,
      fecha: new Date()

    });

    alert("Cuenta creada correctamente");

  } catch (error) {

    console.error(error);
    alert("Error al registrar");

  }

};


// ===============================
// 🔑 LOGIN
// ===============================

window.login = async function () {

  const nombre = document.getElementById("loginNombre").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!nombre || !password) {
    alert("Ingrese nombre y contraseña");
    return;
  }

  try {

    const q = query(
      collection(db, "usuarios"),
      where("nombre", "==", nombre),
      where("password", "==", password)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Usuario o contraseña incorrectos");
      return;
    }

    snapshot.forEach((documento) => {

      const data = documento.data();

      if (data.estado !== "Activo") {

        alert("Usuario pendiente de aprobación");
        return;

      }

      // Guardar sesión
      localStorage.setItem("usuarioActivo", JSON.stringify({

        id: documento.id,
        nombre: data.nombre,
        rol: data.rol,
        campo: data.campo

      }));

      alert("Bienvenido " + data.nombre);

      // Redirigir
      window.location.href = "views/sistema.html";

    });

  } catch (error) {

    console.error(error);
    alert("Error al iniciar sesión");

  }

};


// ===============================
// 👨‍💼 VER USUARIOS PENDIENTES (ADMIN)
// ===============================

window.cargarPendientes = async function () {

  const contenedor = document.getElementById("listaPendientes");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const q = query(
    collection(db, "usuarios"),
    where("estado", "==", "Pendiente")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docu) => {

    const data = docu.data();

    contenedor.innerHTML += `

      <div>

        ${data.nombre} - ${data.rol}

        <button onclick="aprobarUsuario('${docu.id}')">
        Aprobar
        </button>

      </div>

    `;

  });

};


// ===============================
// ✅ APROBAR USUARIO
// ===============================

window.aprobarUsuario = async function (id) {

  await updateDoc(doc(db, "usuarios", id), {

    estado: "Activo"

  });

  alert("Usuario aprobado");

  cargarPendientes();

};
