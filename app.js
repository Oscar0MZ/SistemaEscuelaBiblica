// app.js
import React, { useState, useEffect } from 'react';
import { verificarCredenciales, obtenerSesion, guardarSesion, limpiarSesion } from './services/authService.js';
import { suscribirMaestros, guardarMaestro, eliminarMaestro, aprobarMaestro, enviarNotificacion } from './services/maestrosService.js';

import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
// Importa aquí también tus modales si los separas en archivos propios

export default function App() {
    const [usuario, setUsuario] = useState(null);
    const [maestros, setMaestros] = useState([]);
    const [tabActiva, setTabActiva] = useState('inicio');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);

    // 1. Cargar Sesión
    useEffect(() => {
        const sesion = obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    // 2. Conectar a Firebase
    useEffect(() => {
        const unsubscribe = suscribirMaestros((data) => {
            setMaestros(data);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = (rol, clave) => {
        if (verificarCredenciales(rol, clave)) {
            setUsuario(rol);
            guardarSesion(rol);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setUsuario(null);
        limpiarSesion();
        setTabActiva('inicio');
    };

    const handleGuardar = async (datos) => {
        try {
            const nuevo = await guardarMaestro(datos, maestroEdicion?.id, usuario);
            if (nuevo && usuario !== 'ADMIN') {
                enviarNotificacion(nuevo);
            }
            setModalAbierto(false);
            setMaestroEdicion(null);
        } catch (e) {
            alert("Error al guardar");
        }
    };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl">
            {/* Header */}
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p>
                    <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : `Sesión: ${usuario.toLowerCase()}`}</h1>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500"><i className="fas fa-sign-out-alt"></i></button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50">
                {tabActiva === 'inicio' ? (
                    <DashboardView 
                        maestros={maestros} 
                        usuario={usuario}
                        onApprove={aprobarMaestro}
                        onDelete={setIdBorrar}
                        onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                        onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    />
                ) : (
                    <div>{/* Aquí iría el componente de Lista Completa (DirectoryView) */}</div>
                )}
            </main>
            
            {/* Aquí irían tus Modales y el Nav inferior (Footer) */}
            {/* ... */}
        </div>
    );
}
