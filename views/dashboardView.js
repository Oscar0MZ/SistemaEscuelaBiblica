const { useState, useEffect } = React;

function DashboardView({ maestros, alumnos = [], asistenciaHoy, usuario, onEdit, onDelete, onApprove, onToggleModal, onOpenAlumnoModal, onSaveAsistencia }) {
    const esAdmin = usuario === 'ADMIN';
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    // ESTADO LOCAL PARA TOMAR ASISTENCIA (Temporal)
    const [listaAsistencia, setListaAsistencia] = useState({});

    // Inicializar lista de asistencia cuando entramos a la vista
    useEffect(() => {
        if (vistaActual === 'asistencia' && alumnos.length > 0) {
            const inicial = {};
            // Si ya había asistencia hoy, precargarla. Si no, todos 'Presente' por defecto o vacíos.
            if (asistenciaHoy && asistenciaHoy.registros) {
                asistenciaHoy.registros.forEach(r => inicial[r.idAlumno] = r.estado);
            } else {
                alumnos.forEach(a => inicial[a.id] = 'Presente');
            }
            setListaAsistencia(inicial);
        }
    }, [vistaActual, alumnos, asistenciaHoy]);

    // Función guardar asistencia
    const guardarLista = async () => {
        const registros = alumnos.map(a => ({
            idAlumno: a.id,
            nombre: a.nombre,
            estado: listaAsistencia[a.id] || 'Ausente'
        }));
        const exito = await onSaveAsistencia(registros);
        if (exito) setVistaActual('inicio');
    };

    // --- VISTA ADMIN (Sin cambios) ---
    if (esAdmin) {
        const pendientes = maestros.filter(m => m.estado === 'Pendiente');
        const activos = maestros.filter(m => m.estado === 'Activo');
        const listaAdminVisible = maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase())));
        return (
            <div className="space-y-6">
                {pendientes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]">
                        <h3 className="text-amber-800 font-bold text-sm mb-3"><i className="fas fa-user-clock mr-2"></i> Solicitudes ({pendientes.length})</h3>
                        <div className="space-y-3">{pendientes.map(p => (<div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100"><div><p className="font-bold text-slate-700 text-sm">{p.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</span></div><div className="flex space-x-2"><button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl"><i className="fas fa-check"></i></button><button onClick={() => onDelete(p.id)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl"><i className="fas fa-times"></i></button></div></div>))}</div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                        <p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p>
                        <div><p className="text-5xl font-black tracking-tighter">{activos.length}</p><p className="text-[10px] opacity-70 mt-1">Miembros</p></div>
                    </div>
                    <button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm group"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i className="fas fa-plus"></i></div><div><p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Personal</p><p className="text-[10px] text-slate-400 mt-1">Manual</p></div></button>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="flex items-center bg-slate-50 rounded-2xl px-4 py-3 mb-6"><i className="fas fa-search text-slate-300 mr-3"></i><input type="text" placeholder="Buscar..." className="bg-transparent w-full outline-none text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                    <div className="space-y-4">{listaAdminVisible.map(m => (<div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">{m.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700">{m.nombre}</p><span className="text-[9px] text-slate-400 font-bold uppercase">{m.clase} - {m.campo || 'N/A'}</span></div></div><div className="flex space-x-1"><button onClick={() => onEdit(m)} className="text-indigo-400 w-8 h-8"><i className="fas fa-edit"></i></button><button onClick={() => onDelete(m.id)} className="text-rose-400 w-8 h-8"><i className="fas fa-trash"></i></button></div></div>))}</div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VISTA MAESTRO / AUXILIAR
    // =========================================================================
    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        
        // --- 1. PANTALLA INICIO (RESUMEN) ---
        if (vistaActual === 'inicio') {
            return (
                <div className="flex flex-col h-full space-y-4 pt-4 animate-in fade-in duration-500">
                    <div className="px-2 mb-2">
                        <h2 className="text-2xl font-black text-slate-800">Hola, {usuario.toLowerCase()}</h2>
                        <p className="text-slate-400 text-xs">Resumen del día</p>
                    </div>

                    {/* TARJETA ASISTENCIA (NUEVA) */}
                    <button onClick={() => setVistaActual('asistencia')} className={`w-full p-6 rounded-[32px] text-left relative overflow-hidden group active:scale-95 transition-all shadow-lg ${asistenciaHoy ? 'bg-white border border-slate-100' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                        {asistenciaHoy ? (
                            // YA SE TOMÓ ASISTENCIA -> MOSTRAR RESUMEN
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700 flex items-center"><i className="fas fa-clipboard-check text-emerald-500 mr-2"></i> Asistencia Hoy</h3>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">COMPLETADA</span>
                                </div>
                                <div className="flex justify-around text-center">
                                    <div><p className="text-2xl font-black text-emerald-500">{asistenciaHoy.totales.presentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Presentes</p></div>
                                    <div><p className="text-2xl font-black text-rose-500">{asistenciaHoy.totales.ausentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Ausentes</p></div>
                                    <div><p className="text-2xl font-black text-amber-500">{asistenciaHoy.totales.permisos}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Permisos</p></div>
                                </div>
                                <div className="mt-4 text-center text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Toca para editar</div>
                            </>
                        ) : (
                            // NO SE HA TOMADO -> BOTÓN DE ACCIÓN
                            <>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm animate-pulse">
                                        <i className="fas fa-clipboard-list"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl">Tomar Asistencia</h3>
                                        <p className="text-rose-100 text-xs">Aún no registras el día de hoy</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </button>

                    {/* TARJETA TOTAL ALUMNOS */}
                    <button onClick={() => setVistaActual('gestion')} className="w-full bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 text-left relative overflow-hidden group active:scale-95 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform"></div>
                        <div className="flex justify-between items-start">
                            <div><p className="text-xs font-bold uppercase opacity-70 tracking-widest">Mis Alumnos</p><p className="text-5xl font-black tracking-tighter mt-1">{alumnos.length}</p></div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm"><i className="fas fa-users"></i></div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-bold text-indigo-200"><span>Gestionar lista</span><i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i></div>
                    </button>
                </div>
            );
        }

        // --- 2. PANTALLA ASISTENCIA (NUEVA) ---
        if (vistaActual === 'asistencia') {
            return (
                <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center space-x-4 mb-4 px-2">
                        <button onClick={() => setVistaActual('inicio')} className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                        <div><h2 className="text-xl font-black text-slate-800">Pasar Lista</h2><p className="text-slate-400 text-xs">{new Date().toLocaleDateString()}</p></div>
                    </div>

                    <div className="flex-1 bg-white rounded-t-[40px] shadow-lg border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto space-y-4 pb-24 pr-2">
                            {alumnos.map(a => (
                                <div key={a.id} className="flex items-center justify-between p-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center space-x-3 w-1/3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{a.nombre.charAt(0)}</div>
                                        <p className="font-bold text-slate-700 text-sm truncate">{a.nombre.split(' ')[0]}</p>
                                    </div>
                                    <div className="flex space-x-1 flex-1 justify-end">
                                        {/* BOTONES DE ESTADO */}
                                        <button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Presente'})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Presente' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>P</button>
                                        <button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Ausente'})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Ausente' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>A</button>
                                        <button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Permiso'})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Permiso' ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>Permiso</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* BOTÓN GUARDAR FLOTANTE */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <button onClick={guardarLista} className="w-full bg-indigo-600 p-4 rounded-2xl text-white font-black shadow-xl active:scale-95 transition-all">Guardar Asistencia</button>
                        </div>
                    </div>
                </div>
            );
        }

        // --- 3. PANTALLA GESTIÓN (LISTA + REGISTRO) ---
        return (
            <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                <div className="flex items-center space-x-4 mb-6 px-2">
                    <button onClick={() => setVistaActual('inicio')} className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                    <div><h2 className="text-xl font-black text-slate-800">Gestionar Alumnos</h2><p className="text-slate-400 text-xs">{alumnos.length} Registrados</p></div>
                </div>
                <button onClick={onOpenAlumnoModal} className="w-full bg-emerald-500 p-4 rounded-[24px] shadow-lg shadow-emerald-200 active:scale-95 transition-all text-white flex items-center justify-between mb-6"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm"><i className="fas fa-plus"></i></div><span className="font-bold">Nuevo Alumno</span></div><i className="fas fa-chevron-right opacity-50"></i></button>
                <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col"><div className="overflow-y-auto space-y-3 pb-20 pr-2">{alumnos.map(nino => (<div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center space-x-4"><div className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center text-sm font-bold border border-slate-100 shadow-sm">{nino.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{nino.nombre}</p><p className="text-[10px] text-slate-400"><i className="fas fa-birthday-cake mr-1 text-rose-300"></i>{nino.edad} Años</p></div></div></div>))}</div></div>
            </div>
        );
    }

    return <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60"><i className="fas fa-box-open text-6xl text-slate-300 mb-4"></i><h3 className="text-xl font-bold text-slate-700">Logística</h3><p className="text-slate-400 text-sm mt-2">Funciones próximamente.</p></div>;
}

window.DashboardView = DashboardView;
