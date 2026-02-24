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
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// ===============================
// 🔥 CONFIGURACIÓN FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ===============================
// 🔐 REGISTRAR USUARIO
// ===============================

window.registrar = async function () {

  const nombre = document.getElementById("registroNombre").value.trim();
  const rol = document.getElementById("registroRol").value;
  const campo = document.getElementById("registroCampo").value;
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

    // Estado por defecto
    let estado = "Pendiente";

    if (rol === "Administrador") {
      estado = "Activo";
    }

    await addDoc(collection(db, "usuarios"), {
      nombre: nombre,
      rol: rol,
      campo: campo || "",
      password: password,
      estado: estado,
      fecha: new Date()
    });

    alert("Cuenta creada correctamente");

  } catch (error) {

    console.error(error);
    alert("Error al registrar usuario");

  }

};


// ===============================
// 🔑 LOGIN
// ===============================

window.login = async function () {

  const nombre = document.getElementById("loginNombre").value.trim();
  const password = document.getElementById("loginPassword").value;

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

    snapshot.forEach((doc) => {

      const data = doc.data();

      if (data.estado !== "Activo") {
        alert("Usuario pendiente de aprobación");
        return;
      }

      // Guardar sesión
      localStorage.setItem("usuarioActivo", JSON.stringify({
        id: doc.id,
        nombre: data.nombre,
        rol: data.rol,
        campo: data.campo
      }));

      alert("Bienvenido " + data.nombre);

      // Redirigir al sistema
      window.location.href = "views/sistema.html";

    });

  } catch (error) {

    console.error(error);
    alert("Error al iniciar sesión");

  }

};
