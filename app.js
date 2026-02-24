import { db } from "./config/firebase.js";

import {
collection,
addDoc,
getDocs,
query,
where,
doc,
getDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// botones

const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const btnGuardarAlumno = document.getElementById("btnGuardarAlumno");
const btnPasarAsistencia = document.getElementById("btnPasarAsistencia");


// =========================
// LOGIN
// =========================

btnLogin.onclick = async () => {

const nombre = document.getElementById("nombreCompleto").value.trim();
const rol = document.getElementById("rol").value;
const campo = document.getElementById("campo").value;
const password = document.getElementById("password").value;

if(!nombre || !rol || !password){

alert("Complete todos los campos");
return;

}

try{

const q = query(
collection(db,"usuarios"),
where("nombre","==",nombre),
where("rol","==",rol),
where("password","==",password)
);

const snap = await getDocs(q);

if(snap.empty){

alert("Usuario no encontrado");
return;

}

const user = snap.docs[0].data();

if(user.aprobado !== true){

alert("Aún no ha sido aprobado por el administrador");
return;

}

// guardar sesión

localStorage.setItem("usuario", JSON.stringify(user));


// mostrar sistema

document.getElementById("loginContainer").classList.add("hidden");

document.getElementById("menuContainer").classList.remove("hidden");

cargarResumen();

}
catch(error){

alert("Error login: "+error.message);

}

};



// =========================
// REGISTRO
// =========================

btnRegistro.onclick = async () => {

const nombre = document.getElementById("nombreCompleto").value.trim();
const rol = document.getElementById("rol").value;
const campo = document.getElementById("campo").value;
const password = document.getElementById("password").value;

if(!nombre || !rol || !password){

alert("Complete todos los campos");
return;

}

try{

await addDoc(collection(db,"usuarios"),{

nombre,
rol,
campo,
password,
aprobado:false,
fecha:new Date().toISOString()

});

alert("Registro enviado. Espere aprobación del administrador.");

}
catch(error){

alert("Error registro: "+error.message);

}

};



// =========================
// AGREGAR ALUMNO
// =========================

btnGuardarAlumno.onclick = async () => {

const nombre = document.getElementById("nombreAlumno").value;
const edad = document.getElementById("edadAlumno").value;
const fecha = document.getElementById("fechaAlumno").value;
const campo = document.getElementById("campoAlumno").value;

if(!nombre || !edad || !fecha || !campo){

alert("Complete todos los campos");
return;

}

await addDoc(collection(db,"alumnos"),{

nombre,
edad,
fechaNacimiento:fecha,
campo

});

alert("Alumno agregado");

};



// =========================
// PASAR ASISTENCIA
// =========================

btnPasarAsistencia.onclick = async () => {

const usuario = JSON.parse(localStorage.getItem("usuario"));

const campo = usuario.campo;

const fechaHoy = new Date().toISOString().split("T")[0];

const q = query(
collection(db,"asistencia"),
where("fecha","==",fechaHoy),
where("campo","==",campo)
);

const snap = await getDocs(q);

if(!snap.empty){

alert("La asistencia ya fue registrada hoy");
return;

}


// obtener alumnos del campo

const alumnosQ = query(
collection(db,"alumnos"),
where("campo","==",campo)
);

const alumnosSnap = await getDocs(alumnosQ);

let presentes = alumnosSnap.size;
let ausentes = 0;
let permiso = 0;

await addDoc(collection(db,"asistencia"),{

fecha:fechaHoy,
campo,
presentes,
ausentes,
permiso,
registradoPor:usuario.nombre

});

alert("Asistencia registrada");

cargarResumen();

};



// =========================
// RESUMEN
// =========================

async function cargarResumen(){

const usuario = JSON.parse(localStorage.getItem("usuario"));

const campo = usuario.campo;

const q = query(
collection(db,"asistencia"),
where("campo","==",campo)
);

const snap = await getDocs(q);

let presentes = 0;
let ausentes = 0;
let permiso = 0;

snap.forEach(doc=>{

const data = doc.data();

presentes += data.presentes;
ausentes += data.ausentes;
permiso += data.permiso;

});

document.getElementById("presentes").innerText = presentes;
document.getElementById("ausentes").innerText = ausentes;
document.getElementById("permiso").innerText = permiso;

}



// =========================
// SESION AUTOMATICA
// =========================

window.onload = () => {

const user = localStorage.getItem("usuario");

if(user){

document.getElementById("loginContainer").classList.add("hidden");

document.getElementById("menuContainer").classList.remove("hidden");

cargarResumen();

}

};
