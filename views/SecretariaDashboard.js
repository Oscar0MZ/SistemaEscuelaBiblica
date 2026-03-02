const { useState } = React;

function SecretariaDashboard({
    todosLosAlumnos, datosGlobalesAsistencia, historialAsistencias, maestros,
    fondoTotal, fondoSecretariaTotal, historialSecretaria, 
    onGuardarIngresoSecretaria, onGuardarEgresoSecretaria
}) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [campoExpandido, setCampoExpandido] = useState(null); 
    
    // Estados para Control Cruzado
    const [tipoTransaccion, setTipoTransaccion] = useState('ingreso'); 
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [cargando, setLoading] = useState(false);
    const [mesExpandidoSec, setMesExpandidoSec] = useState(null);

    const historialVisible = historialAsistencias.filter(h => !h.esReset);
    const todasAsistencias = datosGlobalesAsistencia?.registros || [];

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        if (p.length !== 3) return f;
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };

    const textoFechas = datosGlobalesAsistencia?.rango ? `${formatoFecha(datosGlobalesAsistencia.rango.inicio).substring(0,5)} - ${formatoFecha(datosGlobalesAsistencia.rango.fin).substring(0,5)}` : 'Calculando...';
    const camposActivos = [...new Set([...maestros.filter(m => m.clase !== 'LOGISTICA' && m.campo).map(m => m.campo), ...todosLosAlumnos.map(a => a.campo), ...historialVisible.map(h => h.campo)].filter(Boolean))].sort();

    let tp = 0, ta = 0, tperm = 0, totalOfrendaSemana = 0; 
    todasAsistencias.forEach(r => { 
        if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } 
        if(r.ofrenda) totalOfrendaSemana += Number(r.ofrenda);
    });

    const handleSubmitAuditoria = async (e) => {
        e.preventDefault();
        setLoading(true);
        let exito = false;
        if (tipoTransaccion === 'ingreso') exito = await onGuardarIngresoSecretaria(monto, descripcion);
        else exito = await onGuardarEgresoSecretaria(monto, descripcion);

        if (exito) {
            setMonto(''); setDescripcion('');
            const hoy = new Date().toLocaleDateString('en-CA').substring(0, 7);
            setMesExpandidoSec(hoy);
        }
        setLoading(false);
    };

    // Acordeón para historial de Secretaría
    const historialPorMesSec = {};
    historialSecretaria.forEach(mov => {
        const mesKey = mov.fecha ? mov.fecha.substring(0, 7) : 'Desconocido';
        if (!historialPorMesSec[mesKey]) historialPorMesSec[mesKey] = { ingresos: 0, egresos: 0, movimientos: [] };
        if (mov.tipo === 'egreso') historialPorMesSec[mesKey].egresos += Number(mov.monto);
        else historialPorMesSec[mesKey].ingresos += Number(mov.monto);
        historialPorMesSec[mesKey].movimientos.push(mov);
    });
    const mesesOrdenadosSec = Object.keys(historialPorMesSec).sort((a,b) => b.localeCompare(a));

    const nombreMes = (mesKey) => {
        if (mesKey === 'Desconocido') return 'Fecha Desconocida';
        const [y, m] = mesKey.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${meses[parseInt(m, 10) - 1]} ${y}`;
    };

    // Lógica Matemática de Cuadre
    const diferencia = fondoTotal - fondoSecretariaTotal;

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

    if (vistaActual === 'auditoria') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-2">
                    <h2 className="text-2xl font-black text-slate-800">Control Cruzado</h2>
                    <p className="text-slate-400 text-xs mt-1">Compara tu registro interno vs Tesorería</p>
                </div>

                {/* TARJETA DE COMPARACIÓN (DOBLE CONTROL) */}
                <div className="bg-slate-800 p-6 rounded-[32px] text-white shadow-xl mx-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="border-r border-slate-700">
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Mi Control (Secretaría)</p>
                            <p className="text-2xl font-black text-pink-400">${fondoSecretariaTotal.toFixed(2)}</p>
                        </div>
                        <div className="pl-2">
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Reporte Tesorería</p>
                            <p className="text-2xl font-black text-sky-400">${fondoTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className={`mt-5 p-4 rounded-2xl flex items-center justify-between border ${diferencia === 0 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Estado de Cuentas</p>
                            <p className="text-sm font-black">{diferencia === 0 ? 'Cuadre Perfecto' : 'Descuadre Detectado'}</p>
                        </div>
                        {diferencia !== 0 && (
                            <div className="text-right">
                                <p className="text-xl font-black">
                                    {diferencia > 0 ? '+' : '-'}${Math.abs(diferencia).toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                    {diferencia !== 0 && (
                        <p className="text-[9px] text-slate-400 mt-2 text-center italic">
                            {diferencia > 0 ? "Tesorería reporta MÁS fondos de los que tú has registrado." : "Tesorería reporta MENOS fondos de los que tú has registrado."}
                        </p>
                    )}
                </div>

                {/* FORMULARIO DE INGRESO/RETIRO SECRETARÍA */}
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm mx-1 mt-4">
                    <h3 className="font-bold text-slate-700 text-sm mb-4">Añadir a mi Control Interno</h3>
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                        <button onClick={() => setTipoTransaccion('ingreso')} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${tipoTransaccion === 'ingreso' ? 'bg-white text-emerald-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            + Ingreso
                        </button>
                        <button onClick={() => setTipoTransaccion('egreso')} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${tipoTransaccion === 'egreso' ? 'bg-white text-rose-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            - Retiro
                        </button>
                    </div>

                    <form onSubmit={handleSubmitAuditoria} className="space-y-3">
                        <div className="flex space-x-2">
                            <div className="w-1/3 relative">
                                <span className={`absolute left-3 top-3 font-black text-sm ${tipoTransaccion === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>$</span>
                                <input type="number" step="0.01" min="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className="w-full py-3 pl-7 pr-2 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm font-black text-slate-700" />
                            </div>
                            <div className="w-2/3">
                                <input type="text" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Concepto..." className="w-full py-3 px-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-xs font-bold text-slate-700" />
                            </div>
                        </div>
                        <button type="submit" disabled={cargando} className={`w-full py-3 rounded-xl font-black text-white shadow-md transition-all active:scale-95 ${cargando ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-700'}`}>
                            {cargando ? 'Guardando...' : 'Guardar en mi registro'}
                        </button>
                    </form>
                </div>

                {/* HISTORIAL MODO ACORDEÓN (SECRETARÍA) */}
                <h3 className="font-bold text-slate-700 text-sm mt-6 px-2 border-b border-slate-100 pb-2">Mi Libro Mayor</h3>
                <div className="space-y-3 px-1">
                    {mesesOrdenadosSec.length === 0 ? (
                        <div className="text-center p-6 bg-slate-50 rounded-2xl mt-2 border border-slate-100">
                            <p className="text-xs font-bold text-slate-400">Aún no has registrado movimientos.</p>
                        </div>
                    ) : (
                        mesesOrdenadosSec.map(mesKey => {
                            const data = historialPorMesSec[mesKey];
                            const isExpanded = mesExpandidoSec === mesKey;

                            return (
                                <div key={mesKey} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    <button onClick={() => setMesExpandidoSec(isExpanded ? null : mesKey)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                                        <div className="text-left">
                                            <span className="font-bold text-slate-700 text-sm uppercase">{nombreMes(mesKey)}</span>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold">{data.movimientos.length} movimientos</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-bold text-emerald-500">+${data.ingresos.toFixed(2)}</p>
                                                <p className="text-[10px] font-bold text-rose-500">-${data.egresos.toFixed(2)}</p>
                                            </div>
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors shadow-sm ${isExpanded ? 'bg-pink-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 mt-4">
                                                {data.movimientos.map(mov => {
                                                    const esIngreso = mov.tipo !== 'egreso';
                                                    const fechaObj = new Date(mov.timestamp);
                                                    const hora = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                    return (
                                                        <div key={mov.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm relative overflow-hidden">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${esIngreso ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                            <div className="pl-2 w-2/3 pr-2">
                                                                <p className="font-bold text-slate-700 text-xs truncate">{mov.descripcion}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{formatoFecha(mov.fecha)} a las {hora}</p>
                                                            </div>
                                                            <div className="text-right w-1/3">
                                                                <span className={`text-xs font-black px-2 py-1 rounded-lg ${esIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                    {esIngreso ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
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
                <NavButton id="auditoria" icon="fa-balance-scale" label="Auditoría" />
            </div>
        </>
    );
}

window.SecretariaDashboard = SecretariaDashboard;
