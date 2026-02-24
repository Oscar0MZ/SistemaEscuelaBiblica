const { useState } = React;

function DashboardView({ maestros, alumnos = [], usuario, onEdit, onDelete, onApprove, onToggleModal, onOpenAlumnoModal }) {
    const esAdmin = usuario === 'ADMIN';
    
    // --- ESTADOS INTERNOS ---
    const [busqueda, setBusqueda] = useState('');
    // 'inicio' = Pantalla Resumen (Total + Cumpleaños)
    // 'gestion' = Pantalla Lista completa + Registro
    const [vistaActual, setVistaActual] = useState('inicio'); 

    // --- LÓGICA ADMIN (FILTROS) ---
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const listaAdminVisible = (esAdmin ? maestros : []).filter(m => 
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // --- LÓGICA MAESTROS (CUMPLEAÑOS) ---
    const obtenerCumpleanerosMes = () => {
        const mesActual = new Date().getMonth(); // 0 = Enero, 1 = Febrero...
        return alumnos.filter(alumno => {
            if (!alumno.fechaNacimiento) return false;
            // Usamos split para evitar problemas de zona horaria con Date
            const partes = alumno.fechaNacimiento.split('-'); 
            const mesAlumno = parseInt(partes[1]) - 1; // El mes viene 01-12, restamos 1
            return mesAlumno === mesActual;
        }).sort((a, b) => {
            // Ordenar por día del mes
            const diaA = parseInt(a.fechaNacimiento.split('-')[2]);
            const diaB = parseInt(b.fechaNacimiento.split('-')[2]);
            return diaA - diaB;
        });
    };

    const cumpleaneros = obtenerCumpleanerosMes();

    // =========================================================================
    // VISTA DE ADMINISTRADOR (SIN CAMBIOS)
    // =========================================================================
    if (esAdmin) {
        return (
            <div className="space-y-6">
                {pendientes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]">
                        <h3 className="text-amber-800 font-bold text-sm mb-3"><i className="fas fa-user-clock mr-2"></i> Solicitudes ({pendientes.length})</h3>
                        <div className="space-y-3">
                            {pendientes.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100">
                                    <div><p className="font-bold text-slate-700 text-sm">{p.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</span></div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl"><i className="fas fa-check"></i></button>
                                        <button onClick={() => onDelete(p.id)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl"><i className="fas fa-times"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                        <p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p>
                        <div><p className="text-5xl font-black tracking-tighter">{activos.length}</p><p className="text-[10px] opacity-70 mt-1">Miembros</p></div>
                    </div>
                    <button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm group">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i className="fas fa-plus"></i></div>
                        <div><p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Personal</p><p className="text-[10px] text-slate-400 mt-1">Manual</p></div>
                    </button>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="flex items-center bg-slate-50 rounded-2xl px-4 py-3 mb-6"><i className="fas fa-search text-slate-300 mr-3"></i><input type="text" placeholder="Buscar..." className="bg-transparent w-full outline-none text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                    <div className="space-y-4">
                        {listaAdminVisible.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">{m.nombre.charAt(0)}</div>
                                    <div><p className="font-bold text-slate-700">{m.nombre}</p><span className="text-[9px] text-slate-400 font-bold uppercase">{m.clase} - {m.campo || 'N/A'}</span></div>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={() => onEdit(m)} className="text-indigo-400 w-8 h-8"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => onDelete(m.id)} className="text-rose-400 w-8 h-8"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VISTA MAESTRO / AUXILIAR
    // =========================================================================
    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        
        // --- 1. PANTALLA DE INICIO (RESUMEN) ---
        if (vistaActual === 'inicio') {
            return (
                <div className="flex flex-col h-full space-y-6 pt-4 animate-in fade-in duration-500">
                    <div className="px-2">
                        <h2 className="text-2xl font-black text-slate-800">Hola, {usuario.toLowerCase()}</h2>
                        <p className="text-slate-400 text-xs">Resumen de tu clase</p>
                    </div>

                    {/* TARJETA TOTAL ALUMNOS (Clickeable para ir a gestión) */}
                    <button onClick={() => setVistaActual('gestion')} className="w-full bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 text-left relative overflow-hidden group active:scale-95 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform"></div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase opacity-70 tracking-widest">Mis Alumnos</p>
                                <p className="text-5xl font-black tracking-tighter mt-1">{alumnos.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
                                <i className="fas fa-users"></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-bold text-indigo-200">
                            <span>Ver lista completa y gestionar</span>
                            <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                        </div>
                    </button>

                    {/* TARJETA CUMPLEAÑEROS */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center">
                                <i className="fas fa-birthday-cake text-rose-400 mr-2"></i> Cumpleaños
                            </h3>
                            <span className="bg-rose-50 text-rose-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                                Mes Actual
                            </span>
                        </div>

                        {cumpleaneros.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
                                <i className="fas fa-calendar-times text-4xl mb-2 opacity-30"></i>
                                <p className="text-xs">No hay cumpleañeros este mes</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto">
                                {cumpleaneros.map(c => {
                                    const dia = c.fechaNacimiento.split('-')[2];
                                    return (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {dia}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{c.nombre}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold">{c.edad} Años</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // --- 2. PANTALLA DE GESTIÓN (LISTA + REGISTRO) ---
        return (
            <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                {/* CABECERA CON BOTÓN ATRÁS */}
                <div className="flex items-center space-x-4 mb-6 px-2">
                    <button onClick={() => setVistaActual('inicio')} className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-colors flex items-center justify-center shadow-sm">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Gestionar Alumnos</h2>
                        <p className="text-slate-400 text-xs">{alumnos.length} Registrados</p>
                    </div>
                </div>

                {/* BOTÓN REGISTRO */}
                <button onClick={onOpenAlumnoModal} className="w-full bg-emerald-500 p-4 rounded-[24px] shadow-lg shadow-emerald-200 active:scale-95 transition-all text-white flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm">
                            <i className="fas fa-plus"></i>
                        </div>
                        <span className="font-bold">Nuevo Alumno</span>
                    </div>
                    <i className="fas fa-chevron-right opacity-50"></i>
                </button>

                {/* LISTA DE ALUMNOS */}
                <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto space-y-3 pb-20 pr-2">
                        {alumnos.map(nino => (
                            <div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center text-sm font-bold border border-slate-100 shadow-sm">
                                        {nino.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{nino.nombre}</p>
                                        <p className="text-[10px] text-slate-400">
                                            <i className="fas fa-birthday-cake mr-1 text-rose-300"></i>
                                            {nino.edad} Años
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VISTA LOGÍSTICA
    // =========================================================================
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <i className="fas fa-box-open text-6xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-700">Logística</h3>
            <p className="text-slate-400 text-sm mt-2">Funciones próximamente.</p>
        </div>
    );
}

window.DashboardView = DashboardView;
