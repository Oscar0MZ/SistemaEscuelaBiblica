const { useState, useEffect } = React;

function LoginView({ onLogin }) {
    const [rol, setRol] = useState('');
    const [nombre, setNombre] = useState('');
    const [campo, setCampo] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState('');
    const [estadoPendiente, setEstadoPendiente] = useState(false); 
    const [loading, setLoading] = useState(false);
    
    // NUEVO: ESTADO PARA SABER SI ES UN USUARIO QUE REGRESA
    const [esRecordado, setEsRecordado] = useState(false);

    const [diaNac, setDiaNac] = useState('');
    const [mesNac, setMesNac] = useState('');
    const [anioNac, setAnioNac] = useState('');

    const camposDisponibles = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    useEffect(() => {
        const datosGuardados = localStorage.getItem('datos_recientes_login');
        if (datosGuardados) {
            try {
                const parsed = JSON.parse(datosGuardados);
                if (parsed.rol) {
                    setRol(parsed.rol);
                    setEsRecordado(true); // <--- Bloquea la edición
                }
                if (parsed.nombre) setNombre(parsed.nombre);
                if (parsed.campo) setCampo(parsed.campo);
                if (parsed.diaNac) setDiaNac(parsed.diaNac);
                if (parsed.mesNac) setMesNac(parsed.mesNac);
                if (parsed.anioNac) setAnioNac(parsed.anioNac);
            } catch (e) {
                console.error("Error leyendo datos guardados");
            }
        }
    }, []);

    const calcularEdad = (f) => { 
        if (!f) return null; const h = new Date(); const c = new Date(f); 
        let e = h.getFullYear() - c.getFullYear(); 
        if (h.getMonth() < c.getMonth() || (h.getMonth()===c.getMonth() && h.getDate()<c.getDate())) e--; 
        return e; 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (rol !== 'ADMIN' && rol !== 'LOGISTICA' && rol !== 'SECRETARIA' && rol !== 'TESORERO' && !campo) {
            setError('Debes seleccionar un campo.');
            setLoading(false); return;
        }

        if (rol !== 'ADMIN' && !nombre.trim()) {
            setError('Debes ingresar tu nombre.');
            setLoading(false); return;
        }

        if (rol !== 'ADMIN' && (!diaNac || !mesNac || !anioNac)) {
            setError('Debes ingresar tu fecha de nacimiento completa.');
            setLoading(false); return;
        }

        localStorage.setItem('datos_recientes_login', JSON.stringify({
            rol: rol, nombre: nombre, campo: campo, diaNac: diaNac, mesNac: mesNac, anioNac: anioNac
        }));

        const fechaNacimiento = rol !== 'ADMIN' ? `${anioNac}-${mesNac}-${diaNac}` : null;
        const edad = rol !== 'ADMIN' ? calcularEdad(fechaNacimiento) : null;

        const res = await onLogin(rol, clave, nombre, campo, fechaNacimiento, edad);
        
        if (!res.exito) {
            setError(res.mensaje || 'Error al iniciar sesión');
            setEstadoPendiente(false); 
        } else if (res.mensaje) {
            setEstadoPendiente(true);
            setClave(''); 
        }
        setLoading(false);
    };

    const limpiarFormulario = () => {
        setRol(''); setNombre(''); setCampo(''); setClave(''); 
        setDiaNac(''); setMesNac(''); setAnioNac('');
        setError(''); setEstadoPendiente(false); setEsRecordado(false);
        localStorage.removeItem('datos_recientes_login');
    };

    // Variable para saber si los campos deben estar en gris/bloqueados
    const bloqueado = estadoPendiente || esRecordado;

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 bg-slate-100 py-10">
            <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-2xl animate-in zoom-in-95 relative">
                
                {(rol || nombre) && !estadoPendiente && (
                    <button onClick={limpiarFormulario} className="absolute top-6 right-6 w-8 h-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors" title="Cambiar usuario">
                        <i className="fas fa-sync-alt"></i>
                    </button>
                )}

                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                    <i className="fas fa-church"></i>
                </div>
                <h1 className="text-2xl font-black text-slate-800 text-center mb-2">Bienvenido</h1>
                <p className="text-sm text-slate-500 text-center mb-8">
                    {esRecordado ? "Ingresa tu clave para continuar" : "Ingresa tus datos para registrarte"}
                </p>

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
                        <select className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={rol} onChange={(e) => { setRol(e.target.value); setError(''); }} required disabled={bloqueado}>
                            <option value="" disabled>Selecciona un rol...</option>
                            <option value="MAESTRO">Maestro</option>
                            <option value="AUXILIAR">Auxiliar</option>
                            <option value="LOGISTICA">Logística</option>
                            <option value="SECRETARIA">Secretaría</option>
                            <option value="TESORERO">Tesorero/a</option>
                            <option value="ADMIN">Director (Admin)</option>
                        </select>
                    </div>

                    {rol && rol !== 'ADMIN' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tu Nombre Completo</label>
                            <input type="text" placeholder="Ej: Ana Pérez" className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={bloqueado} />
                        </div>
                    )}

                    {rol && rol !== 'ADMIN' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Fecha de Nacimiento</label>
                            <div className="flex space-x-2">
                                <select className={`w-1/3 p-3 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={diaNac} onChange={e=>setDiaNac(e.target.value)} required disabled={bloqueado}>
                                    <option value="" disabled>Día</option>
                                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>)}
                                </select>
                                <select className={`w-1/3 p-3 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={mesNac} onChange={e=>setMesNac(e.target.value)} required disabled={bloqueado}>
                                    <option value="" disabled>Mes</option>
                                    {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => <option key={m} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
                                </select>
                                <select className={`w-1/3 p-3 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={anioNac} onChange={e=>setAnioNac(e.target.value)} required disabled={bloqueado}>
                                    <option value="" disabled>Año</option>
                                    {Array.from({length: 80}, (_, i) => new Date().getFullYear() - 10 - i).map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {rol && rol !== 'ADMIN' && rol !== 'LOGISTICA' && rol !== 'SECRETARIA' && rol !== 'TESORERO' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tu Campo Asignado</label>
                            <select className={`w-full p-4 rounded-2xl outline-none border transition-colors font-bold text-slate-700 ${bloqueado ? 'bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-indigo-400'}`} value={campo} onChange={(e) => setCampo(e.target.value)} required disabled={bloqueado}>
                                <option value="" disabled>Selecciona tu campo...</option>
                                {camposDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    {rol && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Contraseña de Acceso</label>
                            {/* LA CONTRASEÑA SIEMPRE ES EDITABLE PARA PODER ENTRAR */}
                            <input type="password" placeholder="****" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-indigo-400 font-black text-slate-700 tracking-widest transition-colors" value={clave} onChange={(e) => setClave(e.target.value)} required />
                        </div>
                    )}

                    {error && <p className="text-xs font-bold text-rose-500 text-center animate-pulse"><i className="fas fa-exclamation-circle mr-1"></i>{error}</p>}

                    <button type="submit" disabled={loading || !rol} className={`w-full mt-4 py-4 rounded-2xl font-black text-white shadow-xl transition-all ${!rol ? 'bg-slate-300 shadow-none' : estadoPendiente ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}>
                        {loading ? 'Verificando...' : estadoPendiente ? 'Revisar Aprobación' : esRecordado ? 'Iniciar Sesión' : rol === 'ADMIN' ? 'Ingresar al Panel' : 'Solicitar Acceso'}
                    </button>

                    {estadoPendiente && (
                        <button type="button" onClick={limpiarFormulario} className="w-full mt-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                            Modificar mis datos
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}

window.LoginView = LoginView;
