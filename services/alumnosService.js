import { db } from "../config/firebase.js";

import {
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function crearAlumno(alumno) {

    await addDoc(collection(db, "alumnos"), {

        nombre: alumno.nombre,
        edad: alumno.edad,
        fechaNacimiento: alumno.fechaNacimiento,
        campo: alumno.campo

    });

}

export async function obtenerAlumnos() {

    const querySnapshot = await getDocs(collection(db, "alumnos"));

    const alumnos = [];

    querySnapshot.forEach(doc => {

        alumnos.push({

            id: doc.id,
            ...doc.data()

        });

    });

    return alumnos;

}
