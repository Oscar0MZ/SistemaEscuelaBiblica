// Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
query,
where,
doc,
updateDoc

} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// CONFIGURACIÓN FIREBASE
const firebaseConfig = {

apiKey: "TU API KEY",
authDomain: "TU AUTH DOMAIN",
projectId: "TU PROJECT ID",
storageBucket: "TU STORAGE",
messagingSenderId: "TU SENDER ID",
appId: "TU APP ID"

};


// iniciar firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// REGISTRAR USUARIO
window.registrar = async function(){

const nombre = document.getElementById("registroNombre").value;

const rol = document.getElementById("registroRol").value;

const campo = document.getElementById("registroCampo").value;

const password = document.getElementById("registroPassword").value;


if(nombre=="" || rol=="" || password==""){

alert("Complete todos los campos");

return;

}


// administrador se aprueba solo
let aprobado = false;

if(rol=="Administrador"){

aprobado=true;

}


await addDoc(collection(db,"usuarios"),{

nombre,
rol,
campo,
password,
aprobado

});


alert("Usuario registrado, espere aprobación");

mostrarLogin();

};



// LOGIN
window.login = async function(){

const nombre = document.getElementById("loginNombre").value;

const rol = document.getElementById("loginRol").value;

const campo = document.getElementById("loginCampo").value;

const password = document.getElementById("loginPassword").value;


const q = query(

collection(db,"usuarios"),

where("nombre","==",nombre),

where("rol","==",rol),

where("password","==",password)

);


const querySnapshot = await getDocs(q);


if(querySnapshot.empty){

alert("Usuario no existe");

return;

}


querySnapshot.forEach((doc)=>{

const data = doc.data();

if(!data.aprobado){

alert("Usuario pendiente de aprobación");

return;

}


// guardar sesión
localStorage.setItem("usuario",JSON.stringify({

id:doc.id,
nombre:data.nombre,
rol:data.rol,
campo:data.campo

}));


// redirigir
window.location.href="/views/sistema.html";


});

};




// PANEL ADMIN APROBAR USUARIOS
window.cargarPendientes = async function(){

const q = query(

collection(db,"usuarios"),

where("aprobado","==",false)

);


const querySnapshot = await getDocs(q);


const div = document.getElementById("pendientes");


div.innerHTML="";


querySnapshot.forEach((documento)=>{

const data = documento.data();

div.innerHTML += `

<div>

${data.nombre} - ${data.rol}

<button onclick="aprobar('${documento.id}')">

Aprobar

</button>

</div>

`;

});

};




// aprobar usuario
window.aprobar = async function(id){

const ref = doc(db,"usuarios",id);

await updateDoc(ref,{

aprobado:true

});

alert("Usuario aprobado");

cargarPendientes();

};
