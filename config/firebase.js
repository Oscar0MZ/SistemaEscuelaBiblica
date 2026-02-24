// config/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc", // REEMPLAZA CON TU API KEY REAL
    authDomain: "escuela-dominical-bcc99.firebaseapp.com",
    projectId: "escuela-dominical-bcc99",
    storageBucket: "escuela-dominical-bcc99.firebasestorage.app",
    messagingSenderId: "1039366920419",
    appId: "1:1039366920419:web:09f7c09e2370d3718b8dd6",
    measurementId: "G-0KCFGX6CMD"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Hacemos la base de datos disponible para todos los archivos
window.db = firebase.firestore();
