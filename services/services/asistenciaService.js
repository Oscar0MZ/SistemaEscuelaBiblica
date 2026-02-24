import { db } from "../config/firebase.js";

import {

collection,
addDoc,
getDocs,
query,
where

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function asistenciaYaExiste(fecha, campo) {

    const q = query(
        collection(db, "asistencias"),
        where("fecha", "==", fecha),
        where("campo", "==", campo)
    );

    const resultado = await getDocs(q);

    return !resultado.empty;

}

export async function guardarAsistencia(asistencia) {

    await addDoc(collection(db, "asistencias"), asistencia);

}
