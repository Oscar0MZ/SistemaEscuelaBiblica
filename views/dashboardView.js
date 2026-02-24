const { useState } = React;

function DashboardView({ maestros, usuario, onEdit, onDelete, onApprove, onToggleModal, onOpenAlumnoModal }) {
    const esAdmin = usuario === 'ADMIN';
    // Filtros solo para el Admin
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const [busqueda, setBusqueda] = useState('');

    const listaVisible = (esAdmin ? maestros : []).filter(m => 
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // =========================================================================
    // VISTA DE ADMINISTRADOR (CONTROL TOTAL)
    // =========================================================================
    if (esAdmin) {
        return (
            <div className="space-y-6">
                {/* SOLICITUDES PENDIENTES */}
                {pendientes.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]">
                        <h3 className="text-amber-800 font-bold text-sm mb-3">
                            <i className="fas fa-user-clock mr-2"></i> Solicitudes ({pendientes.length})
                        </h3>
                        <div className="space-y-3">
                            {pendientes.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{p.nombre}</p>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</span>
                                            {p.campo && <span className="text-[9px] text-indigo-500 font-bold uppercase"><i className="fas fa-map-marker-alt mr-1"></i>{p.campo}</span>}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl shadow-md"><i className="fas fa-check"></i></button>
                                        <button onClick={() => onDelete(p.id)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200"><i className="fas fa-times"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ESTADÍSTICAS Y BOTÓN ADMIN */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                        <p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p>
                        <div>
                            <p className="text-5xl font-black tracking-tighter">{activos.length}</p>
                            <p className="text-[10px] opacity-70 mt-1">Miembros</p>
                        </div>
                    </div>

                    <button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm hover:shadow-md active:scale-95 transition-all group">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <i className="fas fa-plus"></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Personal</p>
                            <p className="text-[10px] text-slate-400 mt-1">Manual</p>
                        </div>
                    </button>
                </div>

                {/* LISTA COMPLETA (DIRECTORIO) */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="flex items-center bg-slate-50 rounded-2xl px-4 py-3 mb-6">
                        <i className="fas fa-search text-slate-300 mr-3"></i>
                        <input type="text" placeholder="Buscar personal..." className="bg-transparent w-full outline-none text-sm font-medium text-slate-600"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <div className="space-y-4">
                        {listaVisible.map(m => (
                            <div key={m.id} className="flex items-center justify-between group hover:bg-slate-50 p-2 rounded-xl transition-colors -mx-2">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${m.estado === 'Pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {m.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{m.nombre}</p>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md">{m.clase}</span>
                                            {m.campo && <span className="text-[9px] font-bold text-indigo-500 uppercase"><i className="fas fa-map-marker-alt mr-1"></i>{m.campo}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    {m.telefono && <a href={`https://wa.me/${m.telefono.replace(/\D/g,'')}`} target="_blank" className="w-8 h-8 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><i className="fab fa-whatsapp"></i></a>}
                                    <button onClick={() => onEdit(m)} className="w-8 h-8 flex items-center justify-center text-indigo-400 bg-indigo-50 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => onDelete(m.id)} className="w-8 h-8 flex items-center justify-center text-rose-400 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VISTA DE MAESTROS Y AUXILIARES (SOLO REGISTRO DE NIÑOS)
    // =========================================================================
    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-10 space-y-8 animate-in fade-in duration-500">
                
                {/* TARJETA DE BIENVENIDA SIMPLE */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
                        <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Panel de {usuario}</h2>
                    <p className="text-slate-400 text-sm">Gestiona tu clase</p>
                </div>

                {/* BOTÓN GIGANTE DE REGISTRO */}
                <div className="w-full">
                    <button onClick={onOpenAlumnoModal} className="w-full bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">
                                <i className="fas fa-child"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-700">Registrar Alumno</h3>
                                <p className="text-slate-400 text-xs mt-1 px-8">Agrega un nuevo niño a tu lista de asistencia.</p>
                            </div>
                            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                                Tocar aquí
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // VISTA DE LOGÍSTICA (SIN ACCESO A NIÑOS)
    // =========================================================================
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <i className="fas fa-box-open text-6xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-700">Logística</h3>
            <p className="text-slate-400 text-sm mt-2">Funciones de inventario y eventos próximamente.</p>
        </div>
    );
}

window.DashboardView = DashboardView;
