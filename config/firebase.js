const firebaseConfig = {
    apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc",
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

// Guardamos la base de datos en una variable global
window.db = firebase.firestore();
console.log("Firebase conectado.");
