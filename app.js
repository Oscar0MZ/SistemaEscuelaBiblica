const { useState, useEffect } = React;
const { AuthService, MaestrosService, AlumnosService, LogisticaService, LoginView, DashboardView } = window;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [datosUsuarioActual, setDatosUsuarioActual] = useState(null);
    const [maestros, setMaestros] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [todosLosAlumnos, setTodosLosAlumnos] = useState([]);
    const [asistenciaHoy, setAsistenciaHoy] = useState(null);
    const [datosGlobalesAsistencia, setDatosGlobalesAsistencia] = useState({ registros: [], rango: null });
    const [historialAsistencias, setHistorialAsistencias] = useState([]);
    
    const [entregasLogistica, setEntregasLogistica] = useState([]);
    const [mantenimiento, setMantenimiento] = useState(false);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalAlumno, setModalAlumno] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [maestroABorrar, setMaestroABorrar] = useState(null);
    const [alumnoBorrar, setAlumnoBorrar] = useState(null); 
    const [alumnoEdicion, setAlumnoEdicion] = useState(null);
    const [campoABorrar, setCampoABorrar] = useState(null);
    const [edadCalculada, setEdadCalculada] = useState(null);

    const camposDisponibles = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        const datosGuardados = AuthService.obtenerDatosUsuario();
        if (sesion) { setUsuario(sesion); if (datosGuardados) setDatosUsuarioActual(datosGuardados); }
    }, []);

    useEffect(() => { 
        if (MaestrosService) {
            const unsubMaestros = MaestrosService.suscribir(setMaestros); 
            const unsubMantenimiento = MaestrosService.suscribirMantenimiento(setMantenimiento);
            return () => { unsubMaestros(); unsubMantenimiento(); };
        }
    }, []);

    useEffect(() => {
        if (usuario && usuario !== 'ADMIN' && datosUsuarioActual?.id) {
            const unsubscribe = MaestrosService.vigilarUsuario(datosUsuarioActual.id, (u) => {
                if (!u) { 
                    if (usuario === 'LOGISTICA') alert("Tu usuario ha sido eliminado y no puedes acceder al sistema hasta que te vuelvas a registrar.");
                    else alert("Tu usuario ha sido eliminado.");
                    handleLogout(); 
                }
                else { 
                    setDatosUsuarioActual(prev => {
                        if (!prev || prev.grupo !== u.grupo || prev.estado !== u.estado) {
                            const newData = { id: prev.id, ...u }; 
                            AuthService.guardarSesion(usuario, newData);
                            return newData;
                        }
                        return prev;
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [usuario, datosUsuarioActual?.id]);

    useEffect(() => {
        if (!usuario) return;
        const unsubs = [];

        if (usuario === 'ADMIN') {
            unsubs.push(AlumnosService.suscribirTodos(setTodosLosAlumnos));
            unsubs.push(AlumnosService.suscribirAsistenciaSemanal(setDatosGlobalesAsistencia));
            unsubs.push(AlumnosService.suscribirHistorialGlobal(setHistorialAsistencias));
            if(LogisticaService) unsubs.push(LogisticaService.suscribirTodas(setEntregasLogistica)); 
        } else if (usuario === 'LOGISTICA') {
            if(LogisticaService) unsubs.push(LogisticaService.suscribirTodas(setEntregasLogistica)); 
        } else if (datosUsuarioActual && datosUsuarioActual.campo) {
            unsubs.push(AlumnosService.suscribirPorCampo(datosUsuarioActual.campo, setAlumnos));
            unsubs.push(AlumnosService.suscribirAsistenciaHoy(datosUsuarioActual.campo, setAsistenciaHoy));
            unsubs.push(AlumnosService.suscribirHistorialPorCampo(datosUsuarioActual.campo, setHistorialAsistencias));
        }
        return () => { unsubs.forEach(unsub => unsub && unsub()); };
    }, [usuario, datosUsuarioActual?.campo]); 

    const handleLogin = async (rol, clave, nombre, campo) => {
        if (mantenimiento && rol !== 'ADMIN') return { exito: false, mensaje: "El sistema está en Mantenimiento." };
        if (!AuthService.verificar(rol, clave)) return { exito: false, mensaje: "Clave incorrecta." };
        if (rol === 'ADMIN') { setUsuario(rol); AuthService.guardarSesion(rol, null); return { exito: true }; }
        try {
            const snapshot = await window.db.collection('maestros').where('nombre', '==', nombre.trim()).where('clase', '==', rol).get();
            if (snapshot.empty) { await MaestrosService.guardar({ nombre: nombre.trim(), clase: rol, campo: campo || '', telefono: '', grupo: '' }, null, 'SISTEMA_AUTO'); return { exito: true, mensaje: "Solicitud enviada." }; } 
            else { const doc = snapshot.docs[0]; const d = doc.data(); if (d.estado === 'Activo') { setUsuario(rol); const datos = { ...d, id: doc.id }; setDatosUsuarioActual(datos); AuthService.guardarSesion(rol, datos); return { exito: true }; } else return { exito: true, mensaje: "Pendiente." }; }
        } catch (error) { return { exito: false, mensaje: "Error conexión." }; }
    };

    const handleLogout = () => { setUsuario(null); setDatosUsuarioActual(null); setAlumnos([]); setTodosLosAlumnos([]); setHistorialAsistencias([]); setEntregasLogistica([]); AuthService.cerrarSesion(); };
    const handleGuardar = async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); try { const n = await MaestrosService.guardar(d, maestroEdicion?.id, usuario); if (n && usuario !== 'ADMIN') MaestrosService.notificar(n); setModalAbierto(false); setMaestroEdicion(null); } catch (err) { alert("Error"); } };
    const calcularEdad = (f) => { if (!f) return null; const h = new Date(); const c = new Date(f); let e = h.getFullYear() - c.getFullYear(); if (h.getMonth() < c.getMonth() || (h.getMonth()===c.getMonth() && h.getDate()<c.getDate())) e--; return e; };

    const handleGuardarAlumno = async (e) => {
        e.preventDefault(); const fd = new FormData(e.target); const nombre = fd.get('nombre').trim(); const fecha = fd.get('fechaNacimiento'); const genero = fd.get('genero'); const edad = calcularEdad(fecha);
        if (!nombre || !fecha || !genero) { alert("Por favor completa todos los campos."); return; }
        const datos = { nombre: nombre, fechaNacimiento: fecha, edad: edad, genero: genero, maestroResponsable: datosUsuarioActual?.nombre, registradoPorId: datosUsuarioActual?.id, campo: datosUsuarioActual?.campo || 'Sin Campo', clase: 'General' };
        try {
            if (alumnoEdicion) { await AlumnosService.actualizar(alumnoEdicion.id, datos); alert("Alumno actualizado"); } 
            else { await AlumnosService.registrar(datos); alert("Registrado exitosamente"); }
            setModalAlumno(false); setAlumnoEdicion(null); setEdadCalculada(null);
        } catch (error) { if (error.message === "DUPLICADO") { alert("⛔ ¡Error! Este alumno ya existe."); } else { alert("Error al guardar alumno"); } }
    };

    const handleBorrarAlumno = async () => { if (!alumnoBorrar) return; try { await AlumnosService.eliminar(alumnoBorrar.id, alumnoBorrar.campo); setAlumnoBorrar(null); alert("Alumno eliminado y asistencia actualizada correctamente."); } catch (e) { alert("Error al eliminar alumno"); } };
    const handleBorrarMaestro = async () => { if (!maestroABorrar) return; try { const nombreUser = maestroABorrar.nombre; await MaestrosService.eliminarConAlumnos(maestroABorrar.id, null); setMaestroABorrar(null); alert(`El usuario ${nombreUser} ha sido eliminado del sistema.`); } catch (e) { alert("Error al eliminar usuario."); } };
    const handleBorrarCampo = async () => { if (!campoABorrar) return; try { await AlumnosService.eliminarCampoCompleto(campoABorrar); setCampoABorrar(null); alert("🧹 Limpieza completada."); } catch (e) { alert("Error."); } };
    const handleResetLecciones = async (campo, leccionBase) => { try { await AlumnosService.reiniciarLecciones(campo, leccionBase); alert(`✅ Material de ${campo} reiniciado a la Parte ${leccionBase === 0 ? '1' : '2'}.`); } catch (e) { alert("Error al reiniciar material."); } };
    const handleGuardarAsistencia = async (registros, leccion, leccionImpartida) => { const p = registros.filter(r=>r.estado==='Presente').length; const a = registros.filter(r=>r.estado==='Ausente').length; const per = registros.filter(r=>r.estado==='Permiso').length; try { await AlumnosService.guardarAsistencia({ fecha: new Date().toLocaleDateString('en-CA'), campo: datosUsuarioActual.campo, clase: 'General', maestro: datosUsuarioActual.nombre, registradoPorId: datosUsuarioActual.id, registros: registros, totales: { presentes: p, ausentes: a, permisos: per }, leccion: leccion, leccionImpartida: leccionImpartida, timestamp: Date.now() }); alert("Asistencia guardada con éxito"); return true; } catch (e) { return false; } };

    const handleCrearEntrega = async (datos) => { try { await LogisticaService.crear({ ...datos, asignadoPor: 'Director' }); alert("Ruta y víveres asignados correctamente al grupo."); } catch (error) { alert("Error al asignar la ruta."); } };
    
    // --- MAGIA: GUARDA AL DUEÑO DEL AVANCE ---
    const handleActualizarEntrega = async (id, estado, detalles = null) => { 
        try { 
            const payload = { estado: estado };
            if (estado === 'Entregado') payload.fechaEntrega = Date.now();
            if (detalles) {
                payload.detalles = detalles;
                payload.registradoPorId = datosUsuarioActual.id;
                payload.registradoPorNombre = datosUsuarioActual.nombre;
            }
            await window.db.collection('entregas').doc(id).update(payload);
        } catch (error) { alert("Error actualizando estado."); } 
    };

    const handleGuardarAvanceEntrega = async (id, detalles) => {
        try { 
            await window.db.collection('entregas').doc(id).update({ 
                detalles: detalles,
                registradoPorId: datosUsuarioActual.id,
                registradoPorNombre: datosUsuarioActual.nombre 
            }); 
            alert("Avance guardado correctamente.");
        } catch (error) { alert("Error guardando avance."); }
    };

    const handleBorrarEntrega = async (id) => { try { await LogisticaService.eliminar(id); } catch (error) { alert("Error al borrar entrega."); } };
    const handleToggleMantenimiento = () => { MaestrosService.toggleMantenimiento(mantenimiento); };
    const handleAssignGroup = async (idUsuario, nuevoGrupo) => { try { await window.db.collection('maestros').doc(idUsuario).update({ grupo: nuevoGrupo }); } catch (error) { alert("Error al asignar el grupo al usuario."); } };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    if (mantenimiento && usuario !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto bg-slate-900 p-8 text-center shadow-2xl animate-in zoom-in-95">
                <div className="w-32 h-32 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center text-6xl mb-8 animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.3)]"><i className="fas fa-tools"></i></div>
                <h1 className="text-3xl font-black text-white mb-4">Sistema en<br/>Mantenimiento</h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-10">El Director está realizando ajustes en la base de datos.<br/><br/>El acceso está temporalmente bloqueado para evitar conflictos. Por favor, espera a que finalice.</p>
                <button onClick={handleLogout} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-colors">Cerrar Sesión</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100 z-10 relative"><div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p><h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : usuario}</h1>{!usuario === 'ADMIN' && datosUsuarioActual && <p className="text-[9px] text-slate-400 font-bold uppercase">{datosUsuarioActual.campo || (datosUsuarioActual.grupo || 'Logística')}</p>}</div><button onClick={handleLogout} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-all"><i className="fas fa-sign-out-alt"></i></button></header>
            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50 scroll-smooth">
                <DashboardView 
                    maestros={maestros} alumnos={alumnos} todosLosAlumnos={todosLosAlumnos} 
                    asistenciaHoy={asistenciaHoy} datosGlobalesAsistencia={datosGlobalesAsistencia} 
                    historialAsistencias={historialAsistencias} 
                    entregasLogistica={entregasLogistica} 
                    usuario={usuario} datosUsuarioActual={datosUsuarioActual}
                    mantenimiento={mantenimiento} onToggleMantenimiento={handleToggleMantenimiento}
                    onApprove={MaestrosService.aprobar} onDelete={setMaestroABorrar} onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }} onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    onSaveAsistencia={handleGuardarAsistencia}
                    onOpenAlumnoModal={() => { setAlumnoEdicion(null); setEdadCalculada(null); setModalAlumno(true); }}
                    onEditAlumno={(a) => { setAlumnoEdicion(a); setEdadCalculada(a.edad); setModalAlumno(true); }}
                    onDeleteAlumno={setAlumnoBorrar} 
                    onDeleteCampo={setCampoABorrar}
                    onResetLecciones={handleResetLecciones} 
                    onCrearEntrega={handleCrearEntrega} 
                    onActualizarEntrega={handleActualizarEntrega}
                    onGuardarAvanceEntrega={handleGuardarAvanceEntrega}
                    onBorrarEntrega={handleBorrarEntrega}
                    onAssignGroup={handleAssignGroup}
                />
            </main>

            {/* MODALES */}
            {modalAbierto && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto"><h2 className="text-2xl font-black text-slate-800 mb-6">{maestroEdicion ? 'Editar' : 'Inscribir'}</h2><form onSubmit={handleGuardar} className="space-y-4"><input type="text" name="nombre" required defaultValue={maestroEdicion?.nombre || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nombre" /><select name="clase" defaultValue={maestroEdicion?.clase || 'MAESTRO'} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100">{['MAESTRO', 'AUXILIAR', 'LOGISTICA', 'Dirección'].map(c => <option key={c} value={c}>{c}</option>)}</select><select name="campo" defaultValue={maestroEdicion?.campo || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100"><option value="">-- Ninguno --</option>{camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="tel" name="telefono" defaultValue={maestroEdicion?.telefono || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="WhatsApp" /><div className="pt-4 flex flex-col space-y-3"><button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Guardar</button><button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase">Cancelar</button></div></form></div></div>)}
            {modalAlumno && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"><div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom"><div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-child"></i></div><h2 className="text-2xl font-black text-slate-800 mb-2 text-center">{alumnoEdicion ? 'Editar' : 'Registrar'}</h2><form onSubmit={handleGuardarAlumno} className="space-y-4"><input type="text" name="nombre" required defaultValue={alumnoEdicion?.nombre || ''} placeholder="Nombre Completo" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" /><input type="date" name="fechaNacimiento" required defaultValue={alumnoEdicion?.fechaNacimiento || ''} onChange={(e) => setEdadCalculada(calcularEdad(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" /><select name="genero" required defaultValue={alumnoEdicion?.genero || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100"><option value="">Seleccionar Género</option><option value="M">Masculino</option><option value="F">Femenino</option></select>{edadCalculada!==null && (<div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between"><span className="text-emerald-800 text-xs font-bold uppercase">Edad:</span><span className="text-2xl font-black text-emerald-600">{edadCalculada} Años</span></div>)}<div className="pt-2 flex flex-col space-y-3"><button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl">Guardar</button><button type="button" onClick={() => { setModalAlumno(false); setAlumnoEdicion(null); }} className="text-slate-400 font-bold text-xs uppercase">Cancelar</button></div></form></div></div>)}
            
            {maestroABorrar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 border-2 border-indigo-100">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            <i className="fas fa-user-minus"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Eliminar Usuario</h3>
                        <div className="text-slate-500 text-xs mb-4 leading-relaxed bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                            Estás a punto de eliminar a: <br/> <b className="text-slate-700 text-sm">{maestroABorrar.nombre}</b> <span className="text-[10px] uppercase">({maestroABorrar.clase})</span>.<br/><br/>
                            {maestroABorrar.clase === 'LOGISTICA' ? (
                                <span className="text-rose-600 font-bold"><i className="fas fa-exclamation-circle mr-1"></i> Sus datos se borrarán y será expulsado del sistema inmediatamente.</span>
                            ) : (
                                <span className="text-emerald-600 font-bold"><i className="fas fa-shield-alt mr-1"></i> SEGURO: Los alumnos y la asistencia de su campo se conservarán seguros.</span>
                            )}
                        </div>
                        <div className="space-y-3">
                            <button onClick={handleBorrarMaestro} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">Sí, eliminar usuario</button>
                            <button onClick={() => setMaestroABorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {alumnoBorrar && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in"><div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95"><div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-trash-alt"></i></div><h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Alumno?</h3><p className="text-xs text-slate-500 mb-4">Se borrará y se actualizarán las listas de asistencia recientes automáticamente.</p><div className="space-y-3"><button onClick={handleBorrarAlumno} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg">Sí, borrar</button><button onClick={() => setAlumnoBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button></div></div></div>)}
            {campoABorrar && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in"><div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 border-2 border-rose-100"><div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-bomb"></i></div><h3 className="text-xl font-black text-slate-800 mb-2">¡Limpieza de Campo!</h3><div className="text-slate-600 text-xs mb-4 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-100">Vas a limpiar la base de datos de:<br/> <b className="text-rose-600 text-sm">{campoABorrar}</b>.<br/><br/>Se borrarán <span className="font-bold">TODOS</span> sus alumnos y su asistencia de forma permanente.</div><div className="space-y-3"><button onClick={handleBorrarCampo} className="w-full py-3 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all">Destruir datos</button><button onClick={() => setCampoABorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button></div></div></div>)}
        </div>
    );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
