// views/DashboardView.js
import React from 'react';

export default function DashboardView({ maestros, usuario, onEdit, onDelete, onApprove, onToggleModal }) {
    const esAdmin = usuario === 'ADMIN';
    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');

    return (
        <div className="space-y-6">
            {esAdmin && pendientes.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]">
                    <h3 className="text-amber-800 font-bold text-sm mb-3"><i className="fas fa-exclamation-circle mr-2"></i> Solicitudes Pendientes ({pendientes.length})</h3>
                    <div className="space-y-3">
                        {pendientes.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{p.nombre}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.clase}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => onApprove(p.id)} className="w-8 h-8 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 shadow-md"><i className="fas fa-check"></i></button>
                                    <button onClick={() => onDelete(p.id)} className="w-8 h-8 bg-rose-100 text-rose-500 rounded-lg text-xs hover:bg-rose-200"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-600 p-5 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                    <p className="text-[10px] font-bold uppercase opacity-60">Maestros Activos</p>
                    <p className="text-4xl font-black">{activos.length}</p>
                </div>
                <button onClick={onToggleModal} className="bg-white p-5 rounded-[32px] border border-slate-100 flex flex-col justify-between text-left shadow-sm active:scale-95 transition-all group">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <i className="fas fa-plus"></i>
                    </div>
                    <p className="font-bold text-slate-700 leading-tight">Nueva<br/>Inscripción</p>
                </button>
            </div>
            
            {/* Lista Resumida */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Directorio Rápido</h3>
                <div className="space-y-4">
                    {activos.slice(0, 4).map(m => (
                        <div key={m.id} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{m.nombre.charAt(0)}</div>
                            <div>
                                <p className="font-bold text-sm text-slate-700">{m.nombre}</p>
                                <p className="text-[10px] text-slate-400">{m.clase}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
