const { useState } = React;

function LoginView({ onLogin }) {
    const [rol, setRol] = useState('');
    const [nombre, setNombre] = useState('');
    const [campo, setCampo] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState('');
    const [estadoPendiente, setEstadoPendiente] = useState(false); // NUEVO ESTADO: Controla si está bloqueado
    const [loading, setLoading] = useState(false);

    const camposDisponibles = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (rol !== 'ADMIN' && rol !== 'LOGISTICA' && rol !== 'SECRETARIA' && !campo) {
            setError('Debes seleccionar un campo.');
            setLoading(false);
            return;
        }

        if (rol !== 'ADMIN' && !nombre.trim()) {
            setError('Debes ingresar tu nombre.');
            setLoading(false);
            return;
        }

        const res = await onLogin(rol, clave, nombre, campo);
        if (!res.exito) {
            setError(res.mensaje || 'Error al iniciar sesión');
            setEstadoPendiente(false); // Si pone mal la contraseña, se lo mostramos
        } else if (res.mensaje) {
            // Si la respuesta es "Solicitud enviada" o "Pendiente"
            setEstadoPendiente(true);
            setClave(''); // Solo borramos la contraseña por seguridad
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 bg-slate-100">
            <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-2xl animate-in zoom-in-95">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                    <i className="fas fa-church"></i>
                </div>
                <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Bienvenido</h1>
                <p className="text-sm text-slate-500 text-center mb-8">Ingresa tus datos para continuar</p>

                {/* MENSAJE DE ESPERA CUANDO ESTÁ PENDIENTE */}
                {estadoPendiente && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in">
                        <p className="text-xs font-bold text-amber-800 text-center leading-relaxed">
                            <i className="fas fa-clock mr-2 text-amber-500 text-lg"></i><br/>
                            Tu solicitud está en espera.<br/><br/>
                            <span className="font-normal text-amber-600">Cuando el Director te apruebe, vuelve a ingresar tu contraseña aquí abajo.</span>
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">¿Cuál es tu rol?</label>
                        <select 
                            className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${estadoPendiente ? 'bg-slate-200 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`}
                            value={rol} 
                            onChange={(e) => { setRol(e.target.value); setError(''); }}
                            required
                            disabled={estadoPendiente}
                        >
                            <option value="" disabled>Selecciona un rol...</option>
                            <option value="MAESTRO">Maestro</option>
                            <option value="AUXILIAR">Auxiliar</option>
                            <option value="LOGISTICA">Logística</option>
                            <option value="SECRETARIA">Secretaría</option>
                            <option value="ADMIN">Director (Admin)</option>
                        </select>
                    </div>

                    {rol && rol !== 'ADMIN' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tu Nombre Completo</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Ana Pérez" 
                                className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${estadoPendiente ? 'bg-slate-200 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`}
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                disabled={estadoPendiente}
                            />
                        </div>
                    )}

                    {rol && rol !== 'ADMIN' && rol !== 'LOGISTICA' && rol !== 'SECRETARIA' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tu Campo Asignado</label>
                            <select 
                                className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${estadoPendiente ? 'bg-slate-200 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`}
                                value={campo} 
                                onChange={(e) => setCampo(e.target.value)}
                                required
                                disabled={estadoPendiente}
                            >
                                <option value="" disabled>Selecciona tu campo...</option>
                                {camposDisponibles.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* LA CONTRASEÑA SIEMPRE QUEDA ACTIVA PARA QUE PUEDAN REVISAR */}
                    {rol && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Contraseña de Acceso</label>
                            <input 
                                type="password" 
                                placeholder="****" 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-indigo-400 font-black text-slate-700 tracking-widest transition-colors"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {error && <p className="text-xs font-bold text-rose-500 text-center animate-pulse"><i className="fas fa-exclamation-circle mr-1"></i>{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading || !rol}
                        className={`w-full mt-4 py-4 rounded-2xl font-black text-white shadow-xl transition-all ${!rol ? 'bg-slate-300 shadow-none' : estadoPendiente ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}
                    >
                        {loading ? 'Verificando...' : estadoPendiente ? 'Revisar Aprobación' : rol === 'ADMIN' ? 'Ingresar al Panel' : 'Solicitar Acceso'}
                    </button>

                    {/* BOTÓN PARA CORREGIR SI SE EQUIVOCARON DE NOMBRE O CAMPO */}
                    {estadoPendiente && (
                        <button 
                            type="button" 
                            onClick={() => { setEstadoPendiente(false); setClave(''); setError(''); }}
                            className="w-full mt-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Modificar mis datos
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

window.LoginView = LoginView;
