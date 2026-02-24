const { useState, useEffect } = React;

// IMPORTANTE: Ahora recuperamos 'MaestrosService'
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

    // Cargar Datos (Usando MaestrosService)
    useEffect(() => {
        if (MaestrosService) {
            const unsubscribe = MaestrosService.suscribir(setMaestros);
            return () => unsubscribe();
        }
    }, []);

    const handleLogin = (rol, clave) => {
        if (AuthService.verificar(rol, clave)) {
            setUsuario(rol);
            AuthService.guardarSesion(rol);
            return true;
        }
        return false;
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

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100">
                <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Director' : usuario}</h1>
                <button onClick={() => { setUsuario(null); AuthService.cerrarSesion(); }} className="text-slate-400">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50">
                <DashboardView 
                    maestros={maestros}
                    usuario={usuario}
                    onApprove={MaestrosService.aprobar}
                    onDelete={setIdBorrar}
                    onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                    onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                />
            </main>

            {/* MODAL FORMULARIO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">
                            {maestroEdicion ? 'Editar' : 'Nuevo Registro'}
                        </h2>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <input type="text" name="nombre" placeholder="Nombre Completo" required 
                                defaultValue={maestroEdicion?.nombre || ''} 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                            
                            <input type="tel" name="telefono" placeholder="WhatsApp (Opcional)" 
                                defaultValue={maestroEdicion?.telefono || ''} 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                            
                            <select name="clase" defaultValue={maestroEdicion?.clase || 'Párvulos'} 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500">
                                {['Cuna', 'Párvulos', 'Principiantes', 'Primarios', 'Intermedios', 'Jóvenes', 'Adultos', 'Logística', 'Dirección'].map(c => 
                                    <option key={c} value={c}>{c}</option>
                                )}
                            </select>

                            <div className="pt-2 flex flex-col space-y-3">
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">
                                    Guardar
                                </button>
                                <button type="button" onClick={() => setModalAbierto(false)} className="text-slate-400 font-bold text-xs uppercase">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BORRAR */}
            {idBorrar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl">
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
