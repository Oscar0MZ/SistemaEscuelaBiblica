import { db } from "../config/firebase.js";

import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export const loginUsuario = async (rol, password) => {

const q = query(
collection(db, "usuarios"),
where("rol", "==", rol),
where("password", "==", password)
);

const snapshot = await getDocs(q);

if (!snapshot.empty) {

return snapshot.docs[0].data();

}

return null;

};
