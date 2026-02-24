const { useState, useEffect } = React;
const { AuthService, MaestrosService, LoginView, DashboardView } = window;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [maestros, setMaestros] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);

    // Cargar Sesión
    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    // Cargar Datos en tiempo real
    useEffect(() => {
        if (MaestrosService) {
            const unsubscribe = MaestrosService.suscribir(setMaestros);
            return () => unsubscribe();
        }
    }, []);

    // --- NUEVA LÓGICA DE LOGIN ---
    const handleLogin = async (rol, clave, nombre) => {
        // 1. Verificar la clave compartida (Seguridad básica)
        if (!AuthService.verificar(rol, clave)) {
            return { exito: false, mensaje: "Clave incorrecta." };
        }

        // 2. Si es ADMIN, entra directo
        if (rol === 'ADMIN') {
            setUsuario(rol);
            AuthService.guardarSesion(rol);
            return { exito: true };
        }

        // 3. Si es MAESTRO/AUXILIAR/LOGISTICA, verificamos la base de datos
        try {
            // Buscamos si ya existe alguien con ese nombre y rol
            // Nota: Usamos query a Firestore para asegurar datos frescos
            const snapshot = await window.db.collection('maestros')
                .where('nombre', '==', nombre.trim())
                .where('clase', '==', rol)
                .get();

            if (snapshot.empty) {
                // A) NO EXISTE: Lo registramos como PENDIENTE
                await MaestrosService.guardar({
                    nombre: nombre.trim(),
                    clase: rol,
                    telefono: '' // Opcional, vacío por ahora
                }, null, 'SISTEMA_AUTO'); // "SISTEMA_AUTO" indica registro automático

                return { 
                    exito: true, 
                    mensaje: "Solicitud enviada al Director. Espera aprobación para ingresar." 
                };
            } else {
                // B) YA EXISTE: Verificamos estado
                const datosUsuario = snapshot.docs[0].data();
                
                if (datosUsuario.estado === 'Activo') {
                    // Está aprobado -> ENTRA
                    setUsuario(rol);
                    AuthService.guardarSesion(rol);
                    return { exito: true };
                } else {
                    // Sigue pendiente -> RECHAZA INGRESO MOMENTÁNEO
                    return { 
                        exito: true, 
                        mensaje: "Tu cuenta aún no ha sido aprobada por el Director." 
                    };
                }
            }
        } catch (error) {
            console.error("Error login:", error);
            return { exito: false, mensaje: "Error de conexión. Intenta de nuevo." };
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
            alert("Error al guardar");
        }
    };

    // Renderizado Condicional
    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
            {/* HEADER */}
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100 z-10 relative">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestión Ministerial</p>
                    <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Panel Director' : `${usuario}`}</h1>
                </div>
                <button onClick={() => { setUsuario(null); AuthService.cerrarSesion(); }} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50 scroll-smooth">
                <DashboardView 
                    maestros={maestros}
                    usuario={usuario}
                    onApprove={MaestrosService.aprobar}
                    onDelete={setIdBorrar}
                    onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                    onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                />
            </main>

            {/* MODAL FORMULARIO (Solo visible si es Admin quien lo activa) */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
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
                                <label className="text-xs font-bold text-slate-400 ml-3 uppercase">WhatsApp</label>
                                <input type="tel" name="telefono" 
                                    defaultValue={maestroEdicion?.telefono || ''} 
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

                            <div className="pt-4 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">
                                    Guardar Cambios
                                </button>
                                <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BORRAR */}
            {idBorrar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-trash-alt"></i></div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar?</h3>
                        <p className="text-slate-400 text-xs mb-6">Esta acción no se puede deshacer.</p>
                        <div className="space-y-3">
                            <button onClick={async () => { await MaestrosService.eliminar(idBorrar); setIdBorrar(null); }} className="w-full py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-all">Sí, borrar</button>
                            <button onClick={() => setIdBorrar(null)} className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
