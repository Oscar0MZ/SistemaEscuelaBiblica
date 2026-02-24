const { useState } = React;

function DashboardView({ maestros, alumnos = [], usuario, onEdit, onDelete, onApprove, onToggleModal, onOpenAlumnoModal }) {
    const esAdmin = usuario === 'ADMIN';
    // Filtros Admin
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const [busqueda, setBusqueda] = useState('');

    const listaVisible = (esAdmin ? maestros : []).filter(m => 
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // =========================================================================
    // VISTA ADMIN
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
                        {listaVisible.map(m => (
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
    // VISTA MAESTRO/AUXILIAR (REGISTRO Y LISTA DE NIÑOS)
    // =========================================================================
    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        return (
            <div className="flex flex-col h-full space-y-6 pt-4 animate-in fade-in duration-500">
                
                {/* ENCABEZADO */}
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Mis Alumnos</h2>
                        <p className="text-slate-400 text-xs">Lista de asistencia oficial</p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl font-black text-sm">
                        Total: {alumnos.length}
                    </div>
                </div>

                {/* BOTÓN REGISTRO */}
                <button onClick={onOpenAlumnoModal} className="w-full bg-emerald-500 p-6 rounded-[32px] shadow-lg shadow-emerald-200 active:scale-95 transition-all text-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-32 bg-white opacity-10 skew-x-12 -mr-8"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
                            <i className="fas fa-plus"></i>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">Nuevo Alumno</h3>
                            <p className="text-emerald-100 text-xs">Agregar a la base de datos</p>
                        </div>
                    </div>
                </button>

                {/* LISTA DE NIÑOS */}
                <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                    {alumnos.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <i className="fas fa-clipboard-list text-6xl opacity-20"></i>
                            <p className="text-sm font-medium">Aún no hay alumnos registrados.</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto space-y-3 pb-20 pr-2">
                            {alumnos.map(nino => (
                                <div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
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
                                    {/* Aquí podrías poner botón de borrar si quisieras en el futuro */}
                                </div>
                            ))}
                        </div>
                    )}
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
