const { useState } = React;

function DashboardView({ maestros, usuario, onEdit, onDelete, onApprove, onToggleModal }) {
    const esAdmin = usuario === 'ADMIN';
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const [busqueda, setBusqueda] = useState('');

    const listaVisible = (esAdmin ? maestros : activos).filter(m => 
        m.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* SECCIÓN PENDIENTES (SOLO ADMIN) */}
            {esAdmin && pendientes.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px] animate-in slide-in-from-top duration-500">
                    <h3 className="text-amber-800 font-bold text-sm mb-3">
                        <i className="fas fa-user-clock mr-2"></i> Solicitudes de Ingreso ({pendientes.length})
                    </h3>
                    <div className="space-y-3">
                        {pendientes.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl shadow-md active:scale-90 transition-transform"><i className="fas fa-check"></i></button>
                                    <button onClick={() => onDelete(p.id)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200 active:scale-90 transition-transform"><i className="fas fa-times"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TARJETAS SUPERIORES */}
            <div className={`grid ${esAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p>
                    <div>
                        <p className="text-5xl font-black tracking-tighter">{activos.length}</p>
                        <p className="text-[10px] opacity-70 mt-1">Miembros en sistema</p>
                    </div>
                </div>

                {/* BOTÓN GRANDE DE AGREGAR (SOLO ADMIN) */}
                {esAdmin && (
                    <button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm hover:shadow-md active:scale-95 transition-all group">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <i className="fas fa-plus"></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Nuevo</p>
                            <p className="text-[10px] text-slate-400 mt-1">Manual</p>
                        </div>
                    </button>
                )}
            </div>
            
            {/* BUSCADOR Y LISTA */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 min-h-[300px]">
                <div className="flex items-center bg-slate-50 rounded-2xl px-4 py-3 mb-6 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <i className="fas fa-search text-slate-300 mr-3"></i>
                    <input 
                        type="text" 
                        placeholder="Buscar miembro..." 
                        className="bg-transparent w-full outline-none text-sm font-medium text-slate-600 placeholder:text-slate-300"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-0.5">{m.clase}</p>
                                </div>
                            </div>
                            <div className="flex space-x-1">
                                {m.telefono && (
                                    <a href={`https://wa.me/${m.telefono.replace(/\D/g,'')}`} target="_blank" className="w-8 h-8 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><i className="fab fa-whatsapp"></i></a>
                                )}
                                {/* ACCIONES DE EDICIÓN SOLO PARA ADMIN */}
                                {esAdmin && (
                                    <>
                                        <button onClick={() => onEdit(m)} className="w-8 h-8 flex items-center justify-center text-indigo-400 bg-indigo-50 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => onDelete(m.id)} className="w-8 h-8 flex items-center justify-center text-rose-400 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {listaVisible.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <i className="fas fa-folder-open text-4xl mb-2 text-slate-300"></i>
                            <p className="text-xs text-slate-400">No se encontraron resultados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTÓN FLOTANTE (SOLO ADMIN) */}
            {esAdmin && (
                <button onClick={onToggleModal} className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-400/50 flex items-center justify-center text-2xl z-40 active:scale-90 transition-transform">
                    <i className="fas fa-plus"></i>
                </button>
            )}
        </div>
    );
}

window.DashboardView = DashboardView;
