const { useState } = React;

function TesoreroDashboard({
    fondoTotal, historialIngresos, onGuardarIngreso, onGuardarEgreso
}) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    // Estados para nuevo ingreso/retiro
    const [tipoTransaccion, setTipoTransaccion] = useState('ingreso'); 
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [cargando, setLoading] = useState(false);

    // Estados para el Acordeón Mensual y Filtros
    const [mesExpandido, setMesExpandido] = useState(null);
    const [repMesExpandido, setRepMesExpandido] = useState(null); // Acordeón para reportes
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let exito = false;
        if (tipoTransaccion === 'ingreso') exito = await onGuardarIngreso(monto, descripcion);
        else exito = await onGuardarEgreso(monto, descripcion);

        if (exito) {
            setMonto(''); setDescripcion(''); setVistaActual('historial'); 
            const hoy = new Date().toLocaleDateString('en-CA').substring(0, 7);
            setMesExpandido(hoy);
        }
        setLoading(false);
    };

    const formatoFecha = (f) => {
        if (!f) return ''; const p = f.split('-'); if (p.length !== 3) return f;
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };

    const nombreMes = (mesKey) => {
        if (mesKey === 'Desconocido') return 'Fecha Desconocida';
        const [y, m] = mesKey.split('-');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${meses[parseInt(m, 10) - 1]} ${y}`;
    };

    // Acordeón Historial
    const historialPorMes = {};
    historialIngresos.forEach(mov => {
        const mesKey = mov.fecha ? mov.fecha.substring(0, 7) : 'Desconocido';
        if (!historialPorMes[mesKey]) historialPorMes[mesKey] = { ingresos: 0, egresos: 0, movimientos: [] };
        if (mov.tipo === 'egreso') historialPorMes[mesKey].egresos += Number(mov.monto);
        else historialPorMes[mesKey].ingresos += Number(mov.monto);
        historialPorMes[mesKey].movimientos.push(mov);
    });
    const mesesOrdenados = Object.keys(historialPorMes).sort((a,b) => b.localeCompare(a));

    // Acordeón Reportes (Filtrados)
    const movsFiltrados = historialIngresos.filter(mov => {
        if (fechaDesde && mov.fecha < fechaDesde) return false;
        if (fechaHasta && mov.fecha > fechaHasta) return false;
        return true;
    });

    let repIngresos = 0; let repEgresos = 0;
    const repPorMes = {};
    movsFiltrados.forEach(mov => {
        if (mov.tipo === 'egreso') repEgresos += Number(mov.monto);
        else repIngresos += Number(mov.monto);

        const mKey = mov.fecha ? mov.fecha.substring(0, 7) : 'Desconocido';
        if (!repPorMes[mKey]) repPorMes[mKey] = { ingresos: 0, egresos: 0, movimientos: [] };
        if (mov.tipo === 'egreso') repPorMes[mKey].egresos += Number(mov.monto);
        else repPorMes[mKey].ingresos += Number(mov.monto);
        repPorMes[mKey].movimientos.push(mov);
    });
    const repBalance = repIngresos - repEgresos;
    const repMesesOrdenados = Object.keys(repPorMes).sort((a,b) => b.localeCompare(a));

    const NavButton = ({ id, icon, label }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center w-[90px] h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-amber-600 bg-amber-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[10px] tracking-wide">{label}</span>
        </button>
    );

    let contenido;

    if (vistaActual === 'inicio') {
        contenido = (
            <div className="space-y-6 animate-in fade-in duration-300 pt-2 pb-24">
                <div className="bg-slate-800 p-8 rounded-[32px] text-white shadow-2xl mx-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10 text-center">
                        <p className="text-xs font-bold uppercase opacity-70 tracking-widest mb-2 flex items-center justify-center"><i className="fas fa-vault mr-2 text-amber-400"></i> Fondo General Activo</p>
                        <p className="text-6xl font-black tracking-tighter text-amber-400">
                            ${Number(fondoTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mx-1">
                    <h3 className="font-black text-slate-700 text-lg mb-4 flex items-center"><i className="fas fa-cash-register text-slate-400 mr-2"></i>Registrar Movimiento</h3>
                    
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                        <button onClick={() => setTipoTransaccion('ingreso')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${tipoTransaccion === 'ingreso' ? 'bg-white text-emerald-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            <i className="fas fa-arrow-down mr-1"></i> + Ingreso
                        </button>
                        <button onClick={() => setTipoTransaccion('egreso')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${tipoTransaccion === 'egreso' ? 'bg-white text-rose-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            <i className="fas fa-arrow-up mr-1"></i> - Retiro
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Monto a {tipoTransaccion === 'ingreso' ? 'ingresar' : 'retirar'} ($)</label>
                            <div className="relative">
                                <span className={`absolute left-4 top-4 font-black text-lg ${tipoTransaccion === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>$</span>
                                <input type="number" step="0.01" min="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className={`w-full py-4 pl-9 pr-4 bg-slate-50 rounded-2xl outline-none border transition-all text-xl font-black text-slate-700 ${tipoTransaccion === 'ingreso' ? 'border-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100' : 'border-rose-100 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Descripción / Motivo</label>
                            <input type="text" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={tipoTransaccion === 'ingreso' ? "Ej: Ofrenda mensual" : "Ej: Compra de refrigerio"} className={`w-full p-4 bg-slate-50 rounded-2xl outline-none border transition-all font-bold text-slate-700 ${tipoTransaccion === 'ingreso' ? 'border-emerald-100 focus:border-emerald-400' : 'border-rose-100 focus:border-rose-400'}`} />
                        </div>

                        <button type="submit" disabled={cargando} className={`w-full py-4 mt-2 rounded-2xl font-black text-white shadow-xl transition-all ${cargando ? 'bg-slate-400' : tipoTransaccion === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'} active:scale-95`}>
                            {cargando ? 'Procesando...' : tipoTransaccion === 'ingreso' ? 'Guardar Ingreso' : 'Confirmar Retiro'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (vistaActual === 'historial') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-4">
                    <h2 className="text-2xl font-black text-slate-800">Libro Mayor</h2>
                    <p className="text-slate-400 text-xs mt-1">Historial organizado por meses</p>
                </div>
                
                <div className="space-y-3 px-1">
                    {mesesOrdenados.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-[32px] mt-4 border-2 border-dashed border-slate-200">
                            <i className="fas fa-book-open text-3xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-bold text-slate-500">El libro de registros está vacío.</p>
                        </div>
                    ) : (
                        mesesOrdenados.map(mesKey => {
                            const data = historialPorMes[mesKey];
                            const isExpanded = mesExpandido === mesKey;

                            return (
                                <div key={mesKey} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    <button onClick={() => setMesExpandido(isExpanded ? null : mesKey)} className="w-full p-5 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                                        <div className="text-left">
                                            <span className="font-black text-slate-700 text-lg uppercase tracking-wide">{nombreMes(mesKey)}</span>
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{data.movimientos.length} movimientos</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-right mr-2 hidden sm:block">
                                                <p className="text-[10px] font-bold text-emerald-500">+${data.ingresos.toFixed(2)}</p>
                                                <p className="text-[10px] font-bold text-rose-500">-${data.egresos.toFixed(2)}</p>
                                            </div>
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors shadow-sm ${isExpanded ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex justify-between p-3 bg-white rounded-xl shadow-sm mb-3 mt-4 border border-slate-100">
                                                <div className="text-center w-1/2 border-r border-slate-100">
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Ingresos</p>
                                                    <p className="font-black text-emerald-500">${data.ingresos.toFixed(2)}</p>
                                                </div>
                                                <div className="text-center w-1/2">
                                                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1">Retiros</p>
                                                    <p className="font-black text-rose-500">${data.egresos.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                                {data.movimientos.map(mov => {
                                                    const fechaObj = new Date(mov.timestamp);
                                                    const hora = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                    const esIngreso = mov.tipo !== 'egreso';

                                                    return (
                                                        <div key={mov.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${esIngreso ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                            <div className="pl-3 w-2/3">
                                                                <p className="font-bold text-slate-700 text-xs truncate">{mov.descripcion}</p>
                                                                <p className="text-[9px] text-slate-400 mt-1 font-bold">
                                                                    {formatoFecha(mov.fecha)} a las {hora}
                                                                </p>
                                                            </div>
                                                            <div className="text-right w-1/3">
                                                                <p className={`font-black text-sm ${esIngreso ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {esIngreso ? '+' : '-'} ${Number(mov.monto).toFixed(2)}
                                                                </p>
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

    if (vistaActual === 'reportes') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-4">
                    <h2 className="text-2xl font-black text-slate-800">Rendición de Cuentas</h2>
                    <p className="text-slate-400 text-xs mt-1">Filtra ingresos y egresos por fechas</p>
                </div>
                
                <div className="bg-white p-5 rounded-[24px] mx-1 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex space-x-3">
                        <div className="w-1/2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Desde</label>
                            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold text-slate-700 border border-slate-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Hasta</label>
                            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold text-slate-700 border border-slate-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-all" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} />
                        </div>
                    </div>
                </div>

                {(fechaDesde || fechaHasta) && (
                    <div className="bg-slate-800 p-6 rounded-[24px] text-white shadow-xl mx-1 relative overflow-hidden animate-in zoom-in-95">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-bl-[100px] pointer-events-none"></div>
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-4 flex items-center"><i className="fas fa-chart-pie mr-2 text-amber-400"></i> Resumen del Período</p>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest">Entró</p>
                                <p className="text-xl font-black">+${repIngresos.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-rose-400 uppercase font-bold tracking-widest">Salió</p>
                                <p className="text-xl font-black">-${repEgresos.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Balance del período</p>
                            <p className={`text-3xl font-black tracking-tighter ${repBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {repBalance >= 0 ? '+' : '-'}${Math.abs(repBalance).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}

                <h3 className="font-bold text-slate-700 text-sm mt-6 px-2 border-b border-slate-100 pb-2">
                    Detalle de Transacciones (Acordeón)
                </h3>
                <div className="space-y-3 px-1">
                    {repMesesOrdenados.length === 0 ? (
                        <div className="text-center p-6 bg-slate-50 rounded-2xl mt-2 border border-slate-100">
                            <p className="text-xs font-bold text-slate-400">Ajusta las fechas para ver resultados.</p>
                        </div>
                    ) : (
                        repMesesOrdenados.map(mesKey => {
                            const data = repPorMes[mesKey];
                            const isExpanded = repMesExpandido === mesKey;

                            return (
                                <div key={mesKey} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    <button onClick={() => setRepMesExpandido(isExpanded ? null : mesKey)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                                        <div className="text-left">
                                            <span className="font-bold text-slate-700 text-sm uppercase">{nombreMes(mesKey)}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors shadow-sm ${isExpanded ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 mt-4">
                                                {data.movimientos.map(mov => {
                                                    const esIngreso = mov.tipo !== 'egreso';
                                                    return (
                                                        <div key={mov.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${esIngreso ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                            <div className="pl-2 w-2/3 pr-2">
                                                                <p className="font-bold text-slate-700 text-xs truncate">{mov.descripcion}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{formatoFecha(mov.fecha)}</p>
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

    return (
        <>
            {contenido}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <NavButton id="inicio" icon="fa-vault" label="Transacción" />
                <NavButton id="historial" icon="fa-book" label="Historial" />
                <NavButton id="reportes" icon="fa-filter" label="Reportes" />
            </div>
        </>
    );
}

window.TesoreroDashboard = TesoreroDashboard;
