const { useState, useEffect } = React;
// Recuperamos las variables globales que cargamos en el HTML
const AuthService = window.AuthService;
const MaestrosService = window.MaestrosService;
const LoginView = window.LoginView;
const DashboardView = window.DashboardView;

function App() {
    const [usuario, setUsuario] = useState(null);
    const [maestros, setMaestros] = useState([]);
    const [tabActiva, setTabActiva] = useState('inicio');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [maestroEdicion, setMaestroEdicion] = useState(null);
    const [idBorrar, setIdBorrar] = useState(null);

    // Cargar Sesión
    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        if (sesion) setUsuario(sesion);
    }, []);

    // Conectar a Firebase
    useEffect(() => {
        const unsubscribe = MaestrosService.suscribirMaestros((data) => {
            setMaestros(data);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = (rol, clave) => {
        if (AuthService.verificarCredenciales(rol, clave)) {
            setUsuario(rol);
            AuthService.guardarSesion(rol);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setUsuario(null);
        AuthService.limpiarSesion();
        setTabActiva('inicio');
    };

    // ... Aquí iría el modal de Guardar (puedes pegarlo del código original)
    const handleGuardar = async (e) => {
         e.preventDefault();
         // ... logica de guardar usando MaestrosService.guardarMaestro(...)
    };

    if (!usuario) return <LoginView onLogin={handleLogin} />;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl">
            <header className="bg-white p-5 flex justify-between items-center border-b border-slate-100">
                <h1 className="text-xl font-black text-slate-800">{usuario === 'ADMIN' ? 'Director' : usuario}</h1>
                <button onClick={handleLogout} className="text-slate-400"><i className="fas fa-sign-out-alt"></i></button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 pb-24 bg-slate-50/50">
                {tabActiva === 'inicio' && (
                    <DashboardView 
                        maestros={maestros} 
                        usuario={usuario}
                        onApprove={MaestrosService.aprobarMaestro}
                        onDelete={MaestrosService.eliminarMaestro}
                        onEdit={(m) => { setMaestroEdicion(m); setModalAbierto(true); }}
                        onToggleModal={() => { setMaestroEdicion(null); setModalAbierto(true); }}
                    />
                )}
            </main>
            
            {/* NAVBAR (Menu inferior) */}
            <nav className="bg-white border-t border-slate-100 fixed bottom-0 w-full max-w-md h-20 flex justify-around items-center px-4 z-40">
                <button onClick={() => setTabActiva('inicio')} className="text-indigo-600"><i className="fas fa-home"></i></button>
                <button onClick={() => setTabActiva('lista')} className="text-slate-300"><i className="fas fa-users"></i></button>
            </nav>
            
            {/* Aquí pegarías el código de tu Modal Formulario del bloque original */}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
