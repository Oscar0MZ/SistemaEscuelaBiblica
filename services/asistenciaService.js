import { db } from "../config/firebase.js";

import {
collection,
addDoc,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const guardarAsistencia = async (campo, fecha, data) => {

const q = query(
collection(db, "asistencias"),
where("campo", "==", campo),
where("fecha", "==", fecha)
);

const snapshot = await getDocs(q);

if (!snapshot.empty) {

alert("La asistencia ya fue registrada");
return false;

}

await addDoc(collection(db, "asistencias"), {

campo,
fecha,
data

});

return true;

};
