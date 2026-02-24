const { useState, useEffect } = React;

// IMPORTANTE: Ahora traemos también 'AlumnosService'
const { AuthService, MaestrosService, AlumnosService, LoginView, DashboardView } = window;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [datosUsuarioActual, setDatosUsuarioActual] = useState(null);
    
    const [maestros, setMaestros] = useState([]);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalAlumno, setModalAlumno] = useState(false);
    
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);

    const camposDisponibles = [
        "La Isla", "Las Delicias", "El Amatal", "El Manguito", 
        "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", 
        "Corozal #2", "Valle Encantado", "La Playa"
    ];

    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    useEffect(() => {
        if (MaestrosService) {
            const unsubscribe = MaestrosService.suscribir(setMaestros);
            return () => unsubscribe();
        }
    }, []);

    const handleLogin = async (rol, clave, nombre, campo) => {
        if (!AuthService.verificar(rol, clave)) {
            return { exito: false, mensaje: "Clave incorrecta." };
        }

        if (rol === 'ADMIN') {
            setUsuario(rol);
            AuthService.guardarSesion(rol);
            return { exito: true };
        }

        try {
            const snapshot = await window.db.collection('maestros')
                .where('nombre', '==', nombre.trim())
                .where('clase', '==', rol)
                .get();

            if (snapshot.empty) {
                await MaestrosService.guardar({
                    nombre: nombre.trim(),
                    clase: rol,
                    campo: campo || '',
                    telefono: ''
                }, null, 'SISTEMA_AUTO');

                return { 
                    exito: true, 
                    mensaje: "Solicitud enviada al Director. Espera aprobación." 
                };
            } else {
                const doc = snapshot.docs[0];
                const datosUsuario = doc.data();
                if (datosUsuario.estado === 'Activo') {
                    setUsuario(rol);
                    setDatosUsuarioActual({ ...datosUsuario, id: doc.id });
                    AuthService.guardarSesion(rol);
                    return { exito: true };
                } else {
                    return { 
                        exito: true, 
                        mensaje: "Tu cuenta aún está pendiente de aprobación." 
                    };
                }
            }
        } catch (error) {
            console.error(error);
            return { exito: false, mensaje: "Error de conexión." };
        }
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
        } catch (err) {
            alert("Error al guardar maestro");
        }
    };

    // --- AQUÍ USAMOS EL NUEVO ARCHIVO DE ALUMNOS ---
    const handleGuardarAlumno = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const nombreNino = formData.get('nombre');
        const fechaNacimiento = formData.get('fechaNacimiento');

        // Cálculo de edad preciso
        const hoy = new Date();
        const cumple = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - cumple.getFullYear();
        const m = hoy.getMonth() - cumple.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
            edad--;
        }

        try {
            // Usamos AlumnosService.registrar (del archivo nuevo)
            await AlumnosService.registrar({
                nombre: nombreNino,
                fechaNacimiento: fechaNacimiento,
                edad: edad, // Guardamos la edad calculada
                maestroResponsable: datosUsuarioActual?.nombre || 'Desconocido',
                clase: datosUsuarioActual?.clase || usuario,
                campo: datosUsuarioActual?.campo || '',
                registradoPorId: datosUsuarioActual?.id || 'auto'
            });
            alert("Alumno registrado correctamente");
            setModalAlumno(false);
        } catch (error) {
            alert("Error al registrar alumno");
        }
    };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100 z-10 relative">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p>
                    <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : `${usuario}`}</h1>
                </div>
                <button onClick={() => { setUsuario(null); AuthService.cerrarSesion(); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50 scroll-smooth">
                <DashboardView 
                    maestros={maestros}
                    usuario={usuario}
                    onApprove={MaestrosService.aprobar}
                    onDelete={setIdBorrar}
                    onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                    onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    onOpenAlumnoModal={() => setModalAlumno(true)}
                />
            </main>

            {/* MODAL ADMIN */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">
                            {maestroEdicion ? 'Editar Registro' : 'Inscribir Manualmente'}
                        </h2>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">Nombre</label>
                                <input type="text" name="nombre" required 
                                    defaultValue={maestroEdicion?.nombre || ''} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">Rol / Clase</label>
                                <select name="clase" defaultValue={maestroEdicion?.clase || 'Párvulos'} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white border border-slate-100">
                                    {['Cuna', 'Párvulos', 'Principiantes', 'Primarios', 'Intermedios', 'Jóvenes', 'Adultos', 'Logística', 'Dirección'].map(c => 
                                        <option key={c} value={c}>{c}</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">Campo Asignado</label>
                                <select name="campo" defaultValue={maestroEdicion?.campo || ''} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white border border-slate-100">
                                    <option value="">-- Ninguno / No aplica --</option>
                                    {camposDisponibles.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">WhatsApp</label>
                                <input type="tel" name="telefono" 
                                    defaultValue={maestroEdicion?.telefono || ''} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                            </div>

                            <div className="pt-4 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">Guardar Cambios</button>
                                <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ALUMNOS (Usando el nuevo servicio) */}
            {modalAlumno && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            <i className="fas fa-child"></i>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Nuevo Alumno</h2>
                        <p className="text-slate-400 text-xs text-center mb-6">Ingresa los datos del niño para tu lista.</p>
                        
                        <form onSubmit={handleGuardarAlumno} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">Nombre Completo</label>
                                <input type="text" name="nombre" required placeholder="Ej. Carlitos Pérez"
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">Fecha de Nacimiento</label>
                                <input type="date" name="fechaNacimiento" required 
                                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-600" />
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 text-xs font-medium border border-emerald-100 flex items-start">
                                <i className="fas fa-info-circle mt-0.5 mr-2"></i>
                                La edad se calculará automáticamente y se guardará en el expediente.
                            </div>

                            <div className="pt-2 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-all">Registrar Alumno</button>
                                <button type="button" onClick={() => setModalAlumno(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BORRAR */}
            {idBorrar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-800 mb-4">¿Eliminar?</h3>
                        <button onClick={async () => { await MaestrosService.eliminar(idBorrar); setIdBorrar(null); }} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl mb-2">Sí, borrar</button>
                        <button onClick={() => setIdBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
