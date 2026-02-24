import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHzlxpJNejD9_dsx6atUtfVo15ORsfGzc",
  authDomain: "escuela-dominical-bcc99.firebaseapp.com",
  projectId: "escuela-dominical-bcc99",
  storageBucket: "escuela-dominical-bcc99.firebasestorage.app",
  messagingSenderId: "1039366920419",
  appId: "1:1039366920419:web:09f7c09e2370d3718b8dd6"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
