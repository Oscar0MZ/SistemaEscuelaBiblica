const { useState, useEffect } = React;
const { AuthService, MaestrosService, AlumnosService, LoginView, DashboardView } = window;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [datosUsuarioActual, setDatosUsuarioActual] = useState(null);
    
    // Datos
    const [maestros, setMaestros] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [asistenciaHoy, setAsistenciaHoy] = useState(null);
    
    // Modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalAlumno, setModalAlumno] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);
    
    const [edadCalculada, setEdadCalculada] = useState(null);

    const camposDisponibles = [
        "La Isla", "Las Delicias", "El Amatal", "El Manguito", 
        "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", 
        "Corozal #2", "Valle Encantado", "La Playa"
    ];

    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    // Cargar Maestros (Admin)
    useEffect(() => {
        if (MaestrosService) {
            const unsubscribe = MaestrosService.suscribir(setMaestros);
            return () => unsubscribe();
        }
    }, []);

    // --- CORRECCIÓN CLAVE: CARGAR ALUMNOS SOLO POR CAMPO ---
    useEffect(() => {
        if (usuario && usuario !== 'ADMIN' && datosUsuarioActual && AlumnosService) {
            
            // 1. Alumnos: Filtramos SOLO por el campo del maestro (Ej: La Isla)
            const unsubAlumnos = AlumnosService.suscribirPorCampo(
                datosUsuarioActual.campo, 
                setAlumnos
            );
            
            // 2. Asistencia: Filtramos SOLO por el campo
            const unsubAsistencia = AlumnosService.suscribirAsistenciaHoy(
                datosUsuarioActual.campo, 
                setAsistenciaHoy
            );

            return () => {
                unsubAlumnos();
                unsubAsistencia();
            };
        }
    }, [usuario, datosUsuarioActual]);

    // Login
    const handleLogin = async (rol, clave, nombre, campo) => {
        if (!AuthService.verificar(rol, clave)) return { exito: false, mensaje: "Clave incorrecta." };
        if (rol === 'ADMIN') {
            setUsuario(rol);
            AuthService.guardarSesion(rol);
            return { exito: true };
        }
        try {
            // Buscamos al maestro
            const snapshot = await window.db.collection('maestros')
                .where('nombre', '==', nombre.trim())
                .where('clase', '==', rol)
                .get();

            if (snapshot.empty) {
                // Registro nuevo
                await MaestrosService.guardar({ 
                    nombre: nombre.trim(), 
                    clase: rol, 
                    campo: campo || '', // El campo es vital ahora
                    telefono: '' 
                }, null, 'SISTEMA_AUTO');
                return { exito: true, mensaje: "Solicitud enviada al Director." };
            } else {
                const doc = snapshot.docs[0];
                const datos = doc.data();
                if (datos.estado === 'Activo') {
                    setUsuario(rol);
                    // Guardamos los datos completos (IMPORTANTE: Aquí va el campo)
                    setDatosUsuarioActual({ ...datos, id: doc.id });
                    AuthService.guardarSesion(rol);
                    return { exito: true };
                } else {
                    return { exito: true, mensaje: "Cuenta pendiente de aprobación." };
                }
            }
        } catch (error) { return { exito: false, mensaje: "Error de conexión." }; }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const datos = Object.fromEntries(formData.entries());
        try {
            const nuevo = await MaestrosService.guardar(datos, maestroEdicion?.id, usuario);
            if (nuevo && usuario !== 'ADMIN') MaestrosService.notificar(nuevo);
            setModalAbierto(false);
            setMaestroEdicion(null);
        } catch (err) { alert("Error al guardar"); }
    };

    const calcularEdad = (fecha) => {
        if (!fecha) return null;
        const hoy = new Date();
        const cumple = new Date(fecha);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
        return edad;
    };

    // --- REGISTRAR ALUMNO (Vinculado solo al CAMPO) ---
    const handleGuardarAlumno = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const nombreNino = formData.get('nombre');
        const fechaNacimiento = formData.get('fechaNacimiento');
        if (!nombreNino || !fechaNacimiento) return;

        try {
            await AlumnosService.registrar({
                nombre: nombreNino,
                fechaNacimiento: fechaNacimiento,
                edad: calcularEdad(fechaNacimiento),
                
                // Datos de referencia
                maestroResponsable: datosUsuarioActual?.nombre,
                registradoPorId: datosUsuarioActual?.id,
                
                // EL DATO CRÍTICO: CAMPO
                campo: datosUsuarioActual?.campo || 'Sin Campo', 
                
                // Ponemos "General" en clase para no dejar vacío, ya que no usamos párvulos
                clase: 'General' 
            });
            alert("Alumno registrado en " + datosUsuarioActual?.campo);
            setModalAlumno(false);
            setEdadCalculada(null);
        } catch (error) { alert("Error al registrar"); }
    };

    // --- GUARDAR ASISTENCIA (Vinculada solo al CAMPO) ---
    const handleGuardarAsistencia = async (registros) => {
        const presentes = registros.filter(r => r.estado === 'Presente').length;
        const ausentes = registros.filter(r => r.estado === 'Ausente').length;
        const permisos = registros.filter(r => r.estado === 'Permiso').length;
        const fechaHoy = new Date().toLocaleDateString('en-CA');

        try {
            await AlumnosService.guardarAsistencia({
                fecha: fechaHoy,
                
                // EL DATO CRÍTICO: CAMPO
                campo: datosUsuarioActual.campo,
                
                clase: 'General', // No usamos clase específica
                maestro: datosUsuarioActual.nombre,
                registros: registros,
                totales: { presentes, ausentes, permisos },
                timestamp: Date.now()
            });
            alert("¡Asistencia del campo " + datosUsuarioActual.campo + " guardada!");
            return true;
        } catch (error) {
            alert("Error al guardar asistencia");
            console.error(error);
            return false;
        }
    };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100 z-10 relative">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p>
                    <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : usuario}</h1>
                    {!usuario === 'ADMIN' && datosUsuarioActual && <p className="text-[9px] text-slate-400 font-bold uppercase">{datosUsuarioActual.campo}</p>}
                </div>
                <button onClick={() => { setUsuario(null); AuthService.cerrarSesion(); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-all"><i className="fas fa-sign-out-alt"></i></button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50 scroll-smooth">
                <DashboardView 
                    maestros={maestros}
                    alumnos={alumnos}
                    asistenciaHoy={asistenciaHoy}
                    usuario={usuario}
                    onApprove={MaestrosService.aprobar}
                    onDelete={setIdBorrar}
                    onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                    onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    onOpenAlumnoModal={() => { setEdadCalculada(null); setModalAlumno(true); }}
                    onSaveAsistencia={handleGuardarAsistencia}
                />
            </main>

            {/* MODALES */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">{maestroEdicion ? 'Editar' : 'Inscribir'}</h2>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <input type="text" name="nombre" required defaultValue={maestroEdicion?.nombre || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Nombre" />
                            <select name="clase" defaultValue={maestroEdicion?.clase || 'MAESTRO'} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100">
                                {/* Mantenemos estos roles para el PERSONAL, pero no afectan a los alumnos */}
                                {['MAESTRO', 'AUXILIAR', 'LOGISTICA', 'Dirección'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select name="campo" defaultValue={maestroEdicion?.campo || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none bg-white border border-slate-100">
                                <option value="">-- Ninguno --</option>
                                {camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="tel" name="telefono" defaultValue={maestroEdicion?.telefono || ''} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" placeholder="WhatsApp" />
                            <div className="pt-4 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Guardar</button>
                                <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {modalAlumno && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-child"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Registrar Niño</h2>
                        <p className="text-center text-xs text-slate-400 mb-4">Se agregará al campo: <b>{datosUsuarioActual?.campo}</b></p>
                        <form onSubmit={handleGuardarAlumno} className="space-y-4">
                            <input type="text" name="nombre" required placeholder="Nombre Completo" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-lg" />
                            <input type="date" name="fechaNacimiento" required onChange={(e) => setEdadCalculada(calcularEdad(e.target.value))} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 text-lg" />
                            {edadCalculada !== null && (
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between animate-in zoom-in">
                                    <span className="text-emerald-800 text-xs font-bold uppercase">Edad:</span>
                                    <span className="text-2xl font-black text-emerald-600">{edadCalculada} Años</span>
                                </div>
                            )}
                            <div className="pt-2 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200">Registrar Alumno</button>
                                <button type="button" onClick={() => setModalAlumno(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {idBorrar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-slate-800 mb-4">¿Eliminar?</h3>
                        <button onClick={async () => { await MaestrosService.eliminar(idBorrar); setIdBorrar(null); }} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl mb-2">Sí, borrar</button>
                        <button onClick={() => setIdBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
