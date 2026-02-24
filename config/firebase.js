// config/firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc", // RECUERDA CAMBIAR POR TUS KEYS REALES
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

const db = firebase.firestore();

export { db };
