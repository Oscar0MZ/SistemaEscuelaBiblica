const { useState } = React;

function LogisticaDashboard({ datosUsuarioActual, entregasLogistica, onActualizarEntrega }) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    const nombreDisplay = datosUsuarioActual ? datosUsuarioActual.nombre.split(' ')[0] : '';
    const miGrupo = datosUsuarioActual?.grupo; 
    
    const entregasPendientes = entregasLogistica.filter(e => e.estado === 'Pendiente' && e.grupo === miGrupo);
    const entregasCompletadas = entregasLogistica.filter(e => e.estado === 'Entregado' && e.grupo === miGrupo);

    const NavButton = ({ id, icon, label, width = 'w-[100px]' }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center ${width} h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[9px] tracking-wide">{label}</span>
        </button>
    );

    let contenidoLogistica;

    if (!miGrupo) {
        contenidoLogistica = (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner"><i className="fas fa-user-clock"></i></div>
                <h3 className="text-2xl font-black text-slate-700 mb-2">¡Hola, {nombreDisplay}!</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Tu cuenta ha sido aprobada, pero el Director aún no te ha asignado a un <b>Grupo de Reparto</b>.<br/><br/>Pídele que te asigne desde su panel para poder ver tus misiones.</p>
            </div>
        );
    } else if (vistaActual === 'inicio') {
        contenidoLogistica = (
            <div className="flex flex-col h-full space-y-6 pt-4 animate-in fade-in duration-300">
                <div className="px-2">
                    <h2 className="text-3xl font-black text-slate-800">Hola, {nombreDisplay}</h2>
                    <p className="text-slate-400 text-sm mt-1">Equipo de Reparto: <b className="text-amber-500">{miGrupo}</b></p>
                </div>
                <div className="w-full bg-amber-500 p-6 rounded-[32px] text-white shadow-xl shadow-amber-200 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10"><p className="text-xs font-bold uppercase opacity-90 tracking-widest">Misiones Pendientes</p><p className="text-5xl font-black tracking-tighter mt-1">{entregasPendientes.length}</p></div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-box-open"></i></div>
                </div>
                <div className="w-full bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-200 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10"><p className="text-xs font-bold uppercase opacity-90 tracking-widest">Entregados Hoy</p><p className="text-5xl font-black tracking-tighter mt-1">{entregasCompletadas.length}</p></div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-check-circle"></i></div>
                </div>
            </div>
        );
    } else if (vistaActual === 'misiones') {
        contenidoLogistica = (
            <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                <div className="px-2 mb-6"><h2 className="text-2xl font-black text-slate-800">Ruta de Entregas</h2><p className="text-slate-400 text-xs">Misiones activas para {miGrupo}</p></div>
                <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto space-y-4 pb-24 pr-2">
                        {entregasPendientes.length === 0 ? (
                            <div className="text-center p-8 mt-10"><div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-5xl mx-auto mb-4"><i className="fas fa-check-double"></i></div><h3 className="font-bold text-slate-700 text-lg">¡Ruta Limpia!</h3><p className="text-slate-400 text-sm mt-1">Tu grupo no tiene misiones pendientes.</p></div>
                        ) : (
                            entregasPendientes.map(e => (
                                <div key={e.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">{e.grupo}</div>
                                    <h3 className="font-black text-slate-800 text-xl mb-1 mt-2"><i className="fas fa-truck-loading text-amber-500 mr-2"></i>Misión de Reparto</h3>
                                    <p className="text-sm font-bold text-indigo-500 mb-5 pl-8">{e.cantidad} Paquetes a entregar</p>
                                    <button onClick={() => onActualizarEntrega(e.id, 'Entregado')} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center text-lg"><i className="fas fa-check-circle mr-2"></i> Marcar Entregado</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {contenidoLogistica}
            {miGrupo && (
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <NavButton id="inicio" icon="fa-home" label="Resumen" width="w-[100px]" />
                    <NavButton id="misiones" icon="fa-truck" label="Ruta" width="w-[100px]" />
                </div>
            )}
        </>
    );
}
window.LogisticaDashboard = LogisticaDashboard;
