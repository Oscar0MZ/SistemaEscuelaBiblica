const { useState } = React;

function SecretariaDashboard({
    todosLosAlumnos, datosGlobalesAsistencia, historialAsistencias, datosUsuarioActual, maestros
}) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [campoExpandido, setCampoExpandido] = useState(null); 
    
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroCampo, setFiltroCampo] = useState('TODOS');

    const historialVisible = historialAsistencias.filter(h => !h.esReset);
    const todasAsistencias = datosGlobalesAsistencia?.registros || [];

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };

    const textoFechas = datosGlobalesAsistencia?.rango ? `${formatoFecha(datosGlobalesAsistencia.rango.inicio).substring(0,5)} - ${formatoFecha(datosGlobalesAsistencia.rango.fin).substring(0,5)}` : 'Calculando...';
    const camposActivos = [...new Set([...maestros.filter(m => m.clase !== 'LOGISTICA' && m.campo).map(m => m.campo), ...todosLosAlumnos.map(a => a.campo), ...historialVisible.map(h => h.campo)].filter(Boolean))].sort();

    let tp = 0, ta = 0, tperm = 0, totalOfrendaSemana = 0; 
    todasAsistencias.forEach(r => { 
        if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } 
        if(r.ofrenda) totalOfrendaSemana += Number(r.ofrenda);
    });

    const registrosFiltrados = historialVisible.filter(h => {
        if (fechaDesde && h.fecha < fechaDesde) return false;
        if (fechaHasta && h.fecha > fechaHasta) return false;
        if (filtroCampo !== 'TODOS' && h.campo !== filtroCampo) return false;
        return true;
    });

    let ofrendaPeriodo = 0;
    let presentesPeriodo = 0;
    let ausentesPeriodo = 0;
    let permisosPeriodo = 0; // NUEVO: CONTADOR DE PERMISOS
    const resumenPorCampo = {};

    registrosFiltrados.forEach(h => {
        const ofr = Number(h.ofrenda || 0);
        const p = h.totales?.presentes || 0;
        const a = h.totales?.ausentes || 0;
        const per = h.totales?.permisos || 0;

        ofrendaPeriodo += ofr;
        presentesPeriodo += p;
        ausentesPeriodo += a;
        permisosPeriodo += per;

        if (!resumenPorCampo[h.campo]) {
            resumenPorCampo[h.campo] = { ofrenda: 0, presentes: 0, ausentes: 0, permisos: 0, clases: 0 };
        }
        resumenPorCampo[h.campo].ofrenda += ofr;
        resumenPorCampo[h.campo].presentes += p;
        resumenPorCampo[h.campo].ausentes += a;
        resumenPorCampo[h.campo].permisos += per;
        resumenPorCampo[h.campo].clases += 1;
    });

    const camposOrdenadosReporte = Object.keys(resumenPorCampo).sort((a,b) => resumenPorCampo[b].ofrenda - resumenPorCampo[a].ofrenda);

    const NavButton = ({ id, icon, label }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center w-[90px] h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-pink-600 bg-pink-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[10px] tracking-wide">{label}</span>
        </button>
    );

    let contenido;

    if (vistaActual === 'inicio') {
        contenido = (
            <div className="space-y-4 animate-in fade-in duration-300 pt-2 pb-24">
                <div className="bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-200 flex justify-between items-center relative overflow-hidden mx-1 mt-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase opacity-90 tracking-widest mb-1">Ofrenda Total (Semana)</p>
                        <p className="text-5xl font-black tracking-tighter">${totalOfrendaSemana.toFixed(2)}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10">
                        <i className="fas fa-hand-holding-usd"></i>
                    </div>
                </div>

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

    if (vistaActual === 'reportes') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-2">
                    <h2 className="text-2xl font-black text-slate-800">Reportes Financieros</h2>
                    <p className="text-slate-400 text-xs mt-1">Filtra ofrendas y asistencia histórica</p>
                </div>
                
                <div className="bg-white p-4 rounded-[24px] mx-1 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex space-x-3">
                        <div className="w-1/2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Desde la fecha</label>
                            <input type="date" className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none text-xs font-bold text-slate-700 border border-slate-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 transition-all" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hasta la fecha</label>
                            <input type="date" className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none text-xs font-bold text-slate-700 border border-slate-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 transition-all" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Filtrar por Campo</label>
                        <select className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none text-xs font-bold text-slate-700 border border-slate-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-100 transition-all" value={filtroCampo} onChange={e=>setFiltroCampo(e.target.value)}>
                            <option value="TODOS">Todos los campos (Global)</option>
                            {camposActivos.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-[24px] text-white shadow-xl mx-1 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-1">Recaudación del Período</p>
                        <p className="text-4xl font-black tracking-tighter text-emerald-400">${ofrendaPeriodo.toFixed(2)}</p>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-1">Asistencia</p>
                        <p className="text-sm font-black"><span className="text-emerald-400">P: {presentesPeriodo}</span> | <span className="text-rose-400">A: {ausentesPeriodo}</span> | <span className="text-amber-400">Pe: {permisosPeriodo}</span></p>
                    </div>
                </div>

                <h3 className="font-bold text-slate-700 text-sm mt-6 px-2 border-b border-slate-100 pb-2">
                    {filtroCampo === 'TODOS' ? 'Ranking de Aportes por Campo' : `Historial de Clases: ${filtroCampo}`}
                </h3>
                <div className="space-y-3 px-1">
                    {registrosFiltrados.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-3xl mt-2 border border-slate-100">
                            <i className="fas fa-search text-3xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-bold text-slate-500">No hay registros en estas fechas</p>
                        </div>
                    ) : filtroCampo === 'TODOS' ? (
                        camposOrdenadosReporte.map((campo, index) => {
                            const data = resumenPorCampo[campo];
                            return (
                                <div key={campo} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>#{index + 1}</div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{campo}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{data.clases} domingos reportados</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-emerald-600 text-base">${data.ofrenda.toFixed(2)}</p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        registrosFiltrados.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map((h, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-black text-slate-700 text-xs">{formatoFecha(h.fecha)}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Lec. {h.leccion || '-'} • Por: {h.maestro.split(' ')[0]}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-600 text-base">${Number(h.ofrenda||0).toFixed(2)}</p>
                                    <div className="flex space-x-1.5 mt-1 text-[9px] font-bold justify-end">
                                        <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">P: {h.totales?.presentes||0}</span>
                                        <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">A: {h.totales?.ausentes||0}</span>
                                        {/* AHORA SÍ APARECEN LOS PERMISOS EN EL HISTORIAL */}
                                        <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Pe: {h.totales?.permisos||0}</span>
                                    </div>
                                </div>
                            </div>
                        ))
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
                                                                {/* Y AQUÍ TAMBIÉN SE VEN LOS PERMISOS EN EL MONITOREO */}
                                                                <span className="bg-amber-100 text-amber-700 px-1.5 py-1 rounded-md">Pe: {h.totales?.permisos || 0}</span>
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
                <NavButton id="inicio" icon="fa-chart-pie" label="Resumen" />
                <NavButton id="campos" icon="fa-map-marked-alt" label="Monitoreo" />
                <NavButton id="reportes" icon="fa-file-invoice-dollar" label="Reportes" />
            </div>
        </>
    );
}

window.SecretariaDashboard = SecretariaDashboard;
