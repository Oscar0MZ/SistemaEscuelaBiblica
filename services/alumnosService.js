import { db } from "../config/firebase.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const alumnosCollection = collection(db, "alumnos");


export async function guardarAlumno(alumno) {

  await addDoc(alumnosCollection, alumno);

}


export async function obtenerAlumnos() {

  const snapshot = await getDocs(alumnosCollection);

  const lista = [];

  snapshot.forEach(doc => {

    lista.push({
      id: doc.id,
      ...doc.data()
    });

  });

  return lista;

}
