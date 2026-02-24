window.DashboardView = function({ maestros, usuario, onEdit, onDelete, onApprove, onToggleModal }) {
    const esAdmin = usuario === 'ADMIN';
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');

    return (
        <div className="space-y-6">
            {esAdmin && pendientes.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]">
                    <h3 className="text-amber-800 font-bold text-sm mb-3">Solicitudes Pendientes ({pendientes.length})</h3>
                    <div className="space-y-3">
                        {pendientes.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => onApprove(p.id)} className="w-8 h-8 bg-emerald-500 text-white rounded-lg"><i className="fas fa-check"></i></button>
                                    <button onClick={() => onDelete(p.id)} className="w-8 h-8 bg-rose-100 text-rose-500 rounded-lg"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* ... Resto de tu código del Dashboard, botones grandes, etc ... */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Directorio Rápido</h3>
                {activos.map(m => (
                    <div key={m.id} className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{m.nombre.charAt(0)}</div>
                             <div>
                                 <p className="font-bold text-sm text-slate-700">{m.nombre}</p>
                                 <p className="text-[10px] text-slate-400">{m.clase}</p>
                             </div>
                        </div>
                        {esAdmin && (
                             <button onClick={() => onEdit(m)} className="text-slate-300"><i className="fas fa-edit"></i></button>
                        )}
                    </div>
                ))}
            </div>
             <button onClick={onToggleModal} className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-xl z-50">
                <i className="fas fa-plus"></i>
            </button>
        </div>
    );
};
