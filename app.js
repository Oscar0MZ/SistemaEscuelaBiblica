const { useState, useEffect } = React;
const { AuthService, MaestrosService, AlumnosService, LoginView, DashboardView } = window;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [datosUsuarioActual, setDatosUsuarioActual] = useState(null);
    
    // Datos Generales
    const [maestros, setMaestros] = useState([]);
    
    // Datos Alumnos
    const [alumnos, setAlumnos] = useState([]); // Para maestros (su campo)
    const [todosLosAlumnos, setTodosLosAlumnos] = useState([]); // Para Admin (todos) <--- ESTO ES CLAVE
    
    const [asistenciaHoy, setAsistenciaHoy] = useState(null);
    
    // Modales y Edición
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalAlumno, setModalAlumno] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);
    
    // Alumnos Edición
    const [alumnoEdicion, setAlumnoEdicion] = useState(null);
    const [idAlumnoBorrar, setIdAlumnoBorrar] = useState(null);
    const [edadCalculada, setEdadCalculada] = useState(null);

    const camposDisponibles = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    // Cargar Maestros (Siempre)
    useEffect(() => { if (MaestrosService) MaestrosService.suscribir(setMaestros); }, []);

    // LÓGICA DE CARGA DE DATOS SEGÚN ROL
    useEffect(() => {
        if (!usuario || !AlumnosService) return;

        if (usuario === 'ADMIN') {
            // Si es ADMIN: Cargar TODOS los alumnos para estadísticas
            const unsub = AlumnosService.suscribirTodos(setTodosLosAlumnos);
            return () => unsub();
        } else if (datosUsuarioActual) {
            // Si es MAESTRO: Cargar solo SU campo
            const unsub1 = AlumnosService.suscribirPorCampo(datosUsuarioActual.campo, setAlumnos);
            const unsub2 = AlumnosService.suscribirAsistenciaHoy(datosUsuarioActual.campo, setAsistenciaHoy);
            return () => { unsub1(); unsub2(); };
        }
    }, [usuario, datosUsuarioActual]);

    const handleLogin = async (rol, clave, nombre, campo) => {
        if (!AuthService.verificar(rol, clave)) return { exito: false, mensaje: "Clave incorrecta." };
        if (rol === 'ADMIN') { setUsuario(rol); AuthService.guardarSesion(rol); return { exito: true }; }
        try {
            const snapshot = await window.db.collection('maestros').where('nombre', '==', nombre.trim()).where('clase', '==', rol).get();
            if (snapshot.empty) { await MaestrosService.guardar({ nombre: nombre.trim(), clase: rol, campo: campo || '', telefono: '' }, null, 'SISTEMA_AUTO'); return { exito: true, mensaje: "Solicitud enviada al Director." }; } 
            else { const doc = snapshot.docs[0]; const d = doc.data(); if (d.estado === 'Activo') { setUsuario(rol); setDatosUsuarioActual({ ...d, id: doc.id }); AuthService.guardarSesion(rol); return { exito: true }; } else return { exito: true, mensaje: "Pendiente de aprobación." }; }
        } catch (error) { return { exito: false, mensaje: "Error de conexión." }; }
    };

    const handleGuardar = async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); try { const n = await MaestrosService.guardar(d, maestroEdicion?.id, usuario); if (n && usuario !== 'ADMIN') MaestrosService.notificar(n); setModalAbierto(false); setMaestroEdicion(null); } catch (err) { alert("Error"); } };

    const calcularEdad = (fecha) => { if (!fecha) return null; const h = new Date(); const c = new Date(fecha); let e = h.getFullYear() - c.getFullYear(); const m = h.getMonth() - c.getMonth(); if (m < 0 || (m === 0 && h.getDate() < c.getDate())) e--; return e; };

    const handleGuardarAlumno = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const nombre = fd.get('nombre');
        const fecha = fd.get('fechaNacimiento');
        const edad = calcularEdad(fecha);
        if (!nombre || !fecha) return;

        const datos = {
            nombre: nombre, fechaNacimiento: fecha, edad: edad,
            maestroResponsable: datosUsuarioActual?.nombre, registradoPorId: datosUsuarioActual?.id,
            campo: datosUsuarioActual?.campo || 'Sin Campo', clase: 'General'
        };

        try {
            if (alumnoEdicion) { await AlumnosService.actualizar(alumnoEdicion.id, datos); alert("Alumno actualizado"); } 
            else { await AlumnosService.registrar(datos); alert("Alumno registrado"); }
            setModalAlumno(false); setAlumnoEdicion(null); setEdadCalculada(null);
        } catch (error) { alert("Error al guardar alumno"); }
    };

    const handleBorrarAlumno = async () => { if (!idAlumnoBorrar) return; try { await AlumnosService.eliminar(idAlumnoBorrar); setIdAlumnoBorrar(null); } catch (error) { alert("Error al eliminar alumno"); } };

    const handleGuardarAsistencia = async (registros) => { const p = registros.filter(r=>r.estado==='Presente').length; const a = registros.filter(r=>r.estado==='Ausente').length; const per = registros.filter(r=>r.estado==='Permiso').length; try { await AlumnosService.guardarAsistencia({ fecha: new Date().toLocaleDateString('en-CA'), campo: datosUsuarioActual.campo, clase: 'General', maestro: datosUsuarioActual.nombre, registros, totales: { presentes: p, ausentes: a, permisos: per }, timestamp: Date.now() }); alert("Asistencia guardada"); return true; } catch (e) { return false; } };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100 z-10 relative"><div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p><h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : usuario}</h1>{!usuario === 'ADMIN' && datosUsuarioActual && <p className="text-[9px] text-slate-400 font-bold uppercase">{datosUsuarioActual.campo}</p>}</div><button onClick={() => { setUsuario(null); AuthService.cerrarSesion(); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-all"><i className="fas fa-sign-out-alt"></i></button></header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50 scroll-smooth">
                <DashboardView 
                    maestros={maestros} alumnos={alumnos} 
                    todosLosAlumnos={todosLosAlumnos} // <--- AQUÍ SE PASA LA DATA AL DASHBOARD
                    asistenciaHoy={asistenciaHoy} usuario={usuario}
                    onApprove={MaestrosService.aprobar} onDelete={setIdBorrar} onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }} onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    onSaveAsistencia={handleGuardarAsistencia}
                    onOpenAlumnoModal={() => { setAlumnoEdicion(null); setEdadCalculada(null); setModalAlumno(true); }}
                    onEditAlumno={(a) => { setAlumnoEdicion(a); setEdadCalculada(a.edad); setModalAlumno(true); }}
                    onDeleteAlumno={setIdAlumnoBorrar}
                />
            </main>

            {/* MODALES */}
            {modalAbierto && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto"><h2 className="text-2xl font-black text-slate-800 mb-6">{maestroEdicion ? 'Editar' : 'Inscribir'}</h2><form onSubmit={handleGuardar} className="space-y-4"><input type="text" name="nombre" required defaultValue={maestroEdicion?.nombre || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nombre" /><select name="clase" defaultValue={maestroEdicion?.clase || 'MAESTRO'} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100">{['MAESTRO', 'AUXILIAR', 'LOGISTICA', 'Dirección'].map(c => <option key={c} value={c}>{c}</option>)}</select><select name="campo" defaultValue={maestroEdicion?.campo || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100"><option value="">-- Ninguno --</option>{camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="tel" name="telefono" defaultValue={maestroEdicion?.telefono || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="WhatsApp" /><div className="pt-4 flex flex-col space-y-3"><button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Guardar</button><button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase">Cancelar</button></div></form></div></div>)}
            {modalAlumno && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom"><div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-child"></i></div><h2 className="text-2xl font-black text-slate-800 mb-2 text-center">{alumnoEdicion ? 'Editar Alumno' : 'Registrar Niño'}</h2><form onSubmit={handleGuardarAlumno} className="space-y-4"><input type="text" name="nombre" required defaultValue={alumnoEdicion?.nombre || ''} placeholder="Nombre Completo" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-lg" /><input type="date" name="fechaNacimiento" required defaultValue={alumnoEdicion?.fechaNacimiento || ''} onChange={(e) => setEdadCalculada(calcularEdad(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 text-lg" />{edadCalculada !== null && (<div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between animate-in zoom-in"><span className="text-emerald-800 text-xs font-bold uppercase">Edad:</span><span className="text-2xl font-black text-emerald-600">{edadCalculada} Años</span></div>)}<div className="pt-2 flex flex-col space-y-3"><button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200">{alumnoEdicion ? 'Guardar Cambios' : 'Registrar Alumno'}</button><button type="button" onClick={() => { setModalAlumno(false); setAlumnoEdicion(null); }} className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button></div></form></div></div>)}
            {idBorrar && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in"><div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95"><h3 className="text-xl font-black text-slate-800 mb-4">¿Eliminar Personal?</h3><button onClick={async () => { await MaestrosService.eliminar(idBorrar); setIdBorrar(null); }} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl mb-2">Sí, borrar</button><button onClick={() => setIdBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button></div></div>)}
            {idAlumnoBorrar && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in"><div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95"><div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-trash-alt"></i></div><h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Alumno?</h3><div className="space-y-3"><button onClick={handleBorrarAlumno} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all">Sí, borrar</button><button onClick={() => setIdAlumnoBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button></div></div></div>)}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
