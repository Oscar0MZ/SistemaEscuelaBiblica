const { useState } = React;

function SecretariaDashboard({
    todosLosAlumnos, datosGlobalesAsistencia, historialAsistencias, datosUsuarioActual, maestros
}) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [campoExpandido, setCampoExpandido] = useState(null); 

    const historialVisible = historialAsistencias.filter(h => !h.esReset);
    const todasAsistencias = datosGlobalesAsistencia?.registros || [];

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };

    const textoFechas = datosGlobalesAsistencia?.rango ? `${formatoFecha(datosGlobalesAsistencia.rango.inicio).substring(0,5)} - ${formatoFecha(datosGlobalesAsistencia.rango.fin).substring(0,5)}` : 'Calculando...';
    const nombreDisplay = datosUsuarioActual ? datosUsuarioActual.nombre.split(' ')[0] : '';
    const camposActivos = [...new Set([...maestros.filter(m => m.clase !== 'LOGISTICA' && m.campo).map(m => m.campo), ...todosLosAlumnos.map(a => a.campo), ...historialVisible.map(h => h.campo)].filter(Boolean))].sort();

    // Cálculos globales de la semana actual
    let tp = 0, ta = 0, tperm = 0, totalOfrendaSemana = 0; 
    todasAsistencias.forEach(r => { 
        if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } 
        if(r.ofrenda) totalOfrendaSemana += Number(r.ofrenda);
    });

    // Lógica para agrupar TODOS los domingos históricos
    const historialPorDomingo = {};
    historialVisible.forEach(h => {
        if (!historialPorDomingo[h.fecha]) {
            historialPorDomingo[h.fecha] = { presentes: 0, ausentes: 0, ofrenda: 0, campos: 0 };
        }
        if (h.totales) {
            historialPorDomingo[h.fecha].presentes += h.totales.presentes || 0;
            historialPorDomingo[h.fecha].ausentes += h.totales.ausentes || 0;
        }
        historialPorDomingo[h.fecha].ofrenda += Number(h.ofrenda || 0);
        historialPorDomingo[h.fecha].campos += 1;
    });
    // Ordenamos de más reciente a más antiguo
    const domingosOrdenados = Object.keys(historialPorDomingo).sort((a,b) => new Date(b) - new Date(a));

    const NavButton = ({ id, icon, label }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center w-[90px] h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-pink-600 bg-pink-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[10px] tracking-wide">{label}</span>
        </button>
    );

    let contenido;

    if (vistaActual === 'inicio') {
        contenido = (
            <div className="space-y-4 animate-in fade-in duration-300 pt-2 pb-24">
                <div className="px-2 mb-2">
                    <h2 className="text-3xl font-black text-slate-800">Hola, Secretaria {nombreDisplay}</h2>
                    <p className="text-slate-400 text-sm mt-1">Panel de Control de Asistencia y Ofrendas</p>
                </div>

                {/* OFRENDA GLOBAL */}
                <div className="bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-200 flex justify-between items-center relative overflow-hidden mx-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase opacity-90 tracking-widest mb-1">Ofrenda Total (Semana)</p>
                        <p className="text-5xl font-black tracking-tighter">${totalOfrendaSemana.toFixed(2)}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10">
                        <i className="fas fa-hand-holding-usd"></i>
                    </div>
                </div>

                {/* ASISTENCIA GLOBAL */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm mx-1">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-slate-700 text-sm flex items-center"><i className="fas fa-globe text-pink-500 mr-2"></i> Asistencia Global</h3>
                            <p className="text-[10px] text-slate-400 pl-6">Todos los campos</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg border border-slate-200">{textoFechas}</span>
                    </div>
                    <div className="flex justify-around text-center divide-x divide-slate-50">
                        <div className="px-2"><p className="text-3xl font-black text-emerald-500">{tp}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Presentes</p></div>
                        <div className="px-2"><p className="text-3xl font-black text-rose-500">{ta}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Ausentes</p></div>
                        <div className="px-2"><p className="text-3xl font-black text-amber-500">{tperm}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">Permisos</p></div>
                    </div>
                </div>
            </div>
        );
    }

    if (vistaActual === 'historial') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-4">
                    <h2 className="text-2xl font-black text-slate-800">Análisis Histórico</h2>
                    <p className="text-slate-400 text-xs mt-1">Resumen global de todos los domingos pasados</p>
                </div>
                
                <div className="space-y-3 px-1">
                    {domingosOrdenados.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-[32px] mt-4 border-2 border-dashed border-slate-200">
                            <i className="fas fa-calendar-times text-3xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-bold text-slate-500">No hay historial aún</p>
                        </div>
                    ) : (
                        domingosOrdenados.map(fecha => {
                            const data = historialPorDomingo[fecha];
                            return (
                                <div key={fecha} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Domingo</p>
                                            <p className="font-black text-slate-700 text-lg">{formatoFecha(fecha)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Ofrenda Global</p>
                                            <p className="font-black text-emerald-600 text-xl">${data.ofrenda.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-2 text-[10px] font-bold">
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded shadow-sm"><i className="fas fa-check mr-1"></i>P: {data.presentes}</span>
                                            <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded shadow-sm"><i className="fas fa-times mr-1"></i>A: {data.ausentes}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400"><i className="fas fa-map-marker-alt mr-1"></i> {data.campos} campos reportaron</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        );
    }

    if (vistaActual === 'campos') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-4">
                    <h2 className="text-2xl font-black text-slate-800">Monitoreo en Vivo</h2>
                    <p className="text-slate-400 text-xs mt-1">Revisa el estado actual de cada campo</p>
                </div>
                
                <div className="space-y-3 px-1">
                    {camposActivos.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-[32px] mt-4 border-2 border-dashed border-slate-200">
                            <i className="fas fa-seedling text-3xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-bold text-slate-500">No hay campos activos aún</p>
                        </div>
                    ) : (
                        camposActivos.map(campo => {
                            const registrosCampoTodo = historialVisible.filter(h => h.campo === campo);
                            const registrosOrdenados = registrosCampoTodo.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const isExpanded = campoExpandido === campo;
                            
                            const hoyStr = new Date().toLocaleDateString('en-CA');
                            const registroHoy = registrosOrdenados.find(r => r.fecha === hoyStr);
                            const pasaronListaHoy = !!registroHoy;

                            return (
                                <div key={campo} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="w-1/2">
                                            <span className="font-black text-slate-700 text-lg truncate block">{campo}</span>
                                            {pasaronListaHoy ? (
                                                <p className="text-[10px] text-emerald-500 mt-1 font-bold tracking-wide uppercase flex items-center"><i className="fas fa-check-circle mr-1"></i> Lista Enviada</p>
                                            ) : (
                                                <p className="text-[10px] text-amber-500 mt-1 font-bold tracking-wide uppercase flex items-center animate-pulse"><i className="fas fa-clock mr-1"></i> Pendiente</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-3 w-1/2 justify-end">
                                            {/* MUESTRA EL DINERO SI PASARON LISTA HOY */}
                                            {pasaronListaHoy && (
                                                <span className="bg-emerald-50 text-emerald-600 font-black text-sm px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                                    ${Number(registroHoy.ofrenda||0).toFixed(2)}
                                                </span>
                                            )}
                                            <button onClick={() => setCampoExpandido(isExpanded ? null : campo)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shadow-sm ${isExpanded ? 'bg-pink-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i></button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                            <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest flex items-center"><i className="fas fa-history mr-2 text-pink-400"></i> Historial del Campo ({registrosOrdenados.length})</p>
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                {registrosOrdenados.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">Nadie ha pasado asistencia aquí.</p> : 
                                                registrosOrdenados.map((h, i) => (
                                                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <p className="font-black text-slate-700 text-xs">{formatoFecha(h.fecha)}</p>
                                                            <p className="text-[9px] text-slate-500 uppercase mt-0.5 truncate max-w-[120px]"><i className="fas fa-user-edit mr-1 text-slate-400"></i>{h.maestro}</p>
                                                            {h.leccion !== undefined && (<p className={`text-[9px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}>Lec. {h.leccion} {h.leccionImpartida ? '✅' : '❌'}</p>)}
                                                        </div>
                                                        <div className="flex flex-col items-end space-y-1.5 text-[10px] font-bold">
                                                            <span className="text-emerald-600 font-black">${Number(h.ofrenda||0).toFixed(2)}</span>
                                                            <div className="flex space-x-1">
                                                                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-1 rounded-md">P: {h.totales?.presentes || 0}</span>
                                                                <span className="bg-rose-100 text-rose-700 px-1.5 py-1 rounded-md">A: {h.totales?.ausentes || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {contenido}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <NavButton id="inicio" icon="fa-globe" label="Global Hoy" />
                <NavButton id="campos" icon="fa-map-marked-alt" label="Monitoreo" />
                <NavButton id="historial" icon="fa-calendar-alt" label="Domingos" />
            </div>
        </>
    );
}

window.SecretariaDashboard = SecretariaDashboard;
