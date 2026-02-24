import { db } from "../config/firebase.js";
import { collection, addDoc, getDocs } from "firebase/firestore";

const alumnosCollection = collection(db, "alumnos");

export const guardarAlumno = async (alumno) => {
  await addDoc(alumnosCollection, alumno);
};

export const obtenerAlumnos = async () => {
  const snapshot = await getDocs(alumnosCollection);

  const alumnos = [];

  snapshot.forEach(doc => {
    alumnos.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return alumnos;
};
