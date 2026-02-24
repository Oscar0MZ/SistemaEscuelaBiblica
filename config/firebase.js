// config/firebase.js

// 1. Tus credenciales (Copiadas tal cual me las pasaste)
const firebaseConfig = {
  apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc",
  authDomain: "escuela-dominical-bcc99.firebaseapp.com",
  projectId: "escuela-dominical-bcc99",
  storageBucket: "escuela-dominical-bcc99.firebasestorage.app",
  messagingSenderId: "1039366920419",
  appId: "1:1039366920419:web:09f7c09e2370d3718b8dd6",
  measurementId: "G-0KCFGX6CMD"
};

// 2. Inicializar Firebase (Usando la versión compatible con navegador directo)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Inicializar Analytics (Opcional, pero lo incluimos porque venía en tu código)
// Nota: Analytics a veces requiere cookies especiales, si da error se puede quitar.
const analytics = firebase.analytics();

// 4. Inicializar y Exportar la Base de Datos
// Guardamos 'db' en 'window' para que los otros archivos (services) puedan usarla.
window.db = firebase.firestore();

console.log("Firebase conectado exitosamente");
