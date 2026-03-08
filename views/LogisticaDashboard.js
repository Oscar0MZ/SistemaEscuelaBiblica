const { useState, useEffect } = React;

function LogisticaDashboard({ datosUsuarioActual, entregasLogistica, onActualizarEntrega, onGuardarAvanceEntrega }) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [cantidadesDetalle, setCantidadesDetalle] = useState({});
    
    // NUEVO ESTADO PARA EL COMENTARIO DE RECOMPENSAS
    const [comentariosRecompensas, setComentariosRecompensas] = useState({});
    
    const nombreDisplay = datosUsuarioActual ? datosUsuarioActual.nombre.split(' ')[0] : '';
    const miGrupo = datosUsuarioActual?.grupo; 
    
    const entregasPendientes = entregasLogistica.filter(e => e.estado === 'Pendiente' && e.grupo === miGrupo && !e.archivado);
    const entregasCompletadas = entregasLogistica.filter(e => e.estado === 'Entregado' && e.grupo === miGrupo && !e.archivado);

    const todasMisCompletadas = entregasLogistica.filter(e => e.estado === 'Entregado' && e.grupo === miGrupo);
    const entregasCompletadasOrdenadas = [...todasMisCompletadas].sort((a, b) => (b.fechaEntrega || 0) - (a.fechaEntrega || 0));
    const ultimaRutaCompletada = entregasCompletadasOrdenadas.length > 0 ? entregasCompletadasOrdenadas[0] : null;

    useEffect(() => {
        const inicial = {};
        const comentariosIni = {};
        entregasPendientes.forEach(e => {
            if (e.detalles) {
                inicial[e.id] = { ...e.detalles };
                // Si la ruta pendiente ya traía un comentario guardado en un avance anterior, lo rescatamos
                if (e.bloqueos && e.bloqueos['🏆 Recompensas Campos'] && e.bloqueos['🏆 Recompensas Campos'].comentario) {
                    comentariosIni[e.id] = e.bloqueos['🏆 Recompensas Campos'].comentario;
                }
            }
        });
        setCantidadesDetalle(inicial);
        setComentariosRecompensas(comentariosIni);
    }, [entregasLogistica]);

    const handleCantidadChange = (idEntrega, campoRuta, valor) => {
        setCantidadesDetalle(prev => ({
            ...prev,
            [idEntrega]: {
                ...(prev[idEntrega] || {}),
                [campoRuta]: valor
            }
        }));
    };

    const handleComentarioChange = (idEntrega, comentario) => {
        setComentariosRecompensas(prev => ({
            ...prev,
            [idEntrega]: comentario
        }));
    };

    const procesarCamposParaGuardar = (e) => {
        const misIngresos = cantidadesDetalle[e.id] || {};
        const nuevosDetalles = { ...(e.detalles || {}) };
        const nuevosBloqueos = { ...(e.bloqueos || {}) };
        let huboCambios = false;

        // Armamos la lista completa de campos incluyendo los dos nuevos obligatorios visualmente
        const camposOriginales = e.campos || [e.campo];
        const camposCompletos = [...camposOriginales, '📦 Víveres Equipo Logística', '🏆 Recompensas Campos'];

        camposCompletos.forEach(c => {
            const valorIngresado = misIngresos[c];
            const bloqueoActual = e.bloqueos?.[c];
            
            if (valorIngresado !== undefined && valorIngresado !== "") {
                if (!bloqueoActual || bloqueoActual.id === datosUsuarioActual.id) {
                    nuevosDetalles[c] = valorIngresado;
                    
                    // Si es Recompensas, le adjuntamos el comentario al bloqueo
                    if (c === '🏆 Recompensas Campos') {
                        nuevosBloqueos[c] = { 
                            id: datosUsuarioActual.id, 
                            nombre: datosUsuarioActual.nombre,
                            comentario: comentariosRecompensas[e.id] || 'Sin especificar'
                        };
                    } else {
                        nuevosBloqueos[c] = { id: datosUsuarioActual.id, nombre: datosUsuarioActual.nombre };
                    }
                    huboCambios = true;
                }
            }
        });

        return { huboCambios, nuevosDetalles, nuevosBloqueos };
    };

    const handleGuardarAvance = (e) => {
        const { huboCambios, nuevosDetalles, nuevosBloqueos } = procesarCamposParaGuardar(e);

        if (huboCambios) {
            onGuardarAvanceEntrega(e.id, nuevosDetalles, nuevosBloqueos);
        } else {
            alert("No hay datos nuevos para guardar, o los campos que editaste ya fueron registrados por otro compañero.");
        }
    };

    const handleFinalizar = (e) => {
        const misIngresos = cantidadesDetalle[e.id] || {};
        
        // VALIDACIÓN DE CAMPO OBLIGATORIO: Equipo Logística
        const viveresLogistica = misIngresos['📦 Víveres Equipo Logística'];
        if (viveresLogistica === undefined || viveresLogistica === "") {
            alert("⚠️ ALTO: Debes registrar cuántos víveres consumió el Equipo de Logística. Si no ocuparon nada, ingresa el número 0.");
            return;
        }

        const { nuevosDetalles, nuevosBloqueos } = procesarCamposParaGuardar(e);
        onActualizarEntrega(e.id, 'Entregado', nuevosDetalles, nuevosBloqueos);
    };

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
                <p className="text-slate-500 text-sm leading-relaxed">Tu cuenta ha sido aprobada, pero el Director aún no te ha asignado a un <b>Grupo de Reparto</b>.<br/><br/>Pídele que te asigne desde su panel para poder ver tus rutas.</p>
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
                    <div className="relative z-10"><p className="text-xs font-bold uppercase opacity-90 tracking-widest">Rutas Pendientes</p><p className="text-5xl font-black tracking-tighter mt-1">{entregasPendientes.length}</p></div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-route"></i></div>
                </div>

                <div className="w-full bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-200 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10"><p className="text-xs font-bold uppercase opacity-90 tracking-widest">Completadas Hoy</p><p className="text-5xl font-black tracking-tighter mt-1">{entregasCompletadas.length}</p></div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-check-circle"></i></div>
                </div>
            </div>
        );
    } else if (vistaActual === 'misiones') {
        contenidoLogistica = (
            <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                <div className="px-2 mb-6"><h2 className="text-2xl font-black text-slate-800">Rutas de Entrega</h2><p className="text-slate-400 text-xs">Destinos asignados a {miGrupo}</p></div>
                
                <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto space-y-6 pb-24 pr-2">
                        {entregasPendientes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                                <div className="text-center p-6 mt-4 mb-4">
                                    <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-inner"><i className="fas fa-hourglass-half"></i></div>
                                    <h3 className="font-bold text-slate-700 text-xl">¡Misión Cumplida!</h3>
                                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Esperando a que el Administrador asigne nuevas rutas para tu equipo...</p>
                                </div>
                                {ultimaRutaCompletada && (
                                    <div className="w-full mt-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-3"><i className="fas fa-history mr-1"></i> Tu Ruta Anterior:</p>
                                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 relative overflow-hidden shadow-sm opacity-70 grayscale">
                                            <div className="absolute top-0 right-0 bg-slate-400 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl">{ultimaRutaCompletada.grupo}</div>
                                            <h3 className="font-black text-slate-600 text-base mb-1 mt-1"><i className="fas fa-check-double text-slate-500 mr-2"></i>Ruta Finalizada</h3>
                                            <p className="text-xs font-bold text-slate-500 mb-4 pl-7">Total asignado: {ultimaRutaCompletada.cantidad} Paquetes</p>
                                            <div className="space-y-2">
                                                {/* Mostrar todos los campos reales más los extras que se hayan guardado */}
                                                {Object.entries(ultimaRutaCompletada.detalles || {}).map(([c, cant]) => (
                                                    <div key={c} className="flex flex-col bg-white/50 p-2 px-3 rounded-xl border border-slate-200">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500 w-1/2 truncate">{c}</span>
                                                            <span className="text-xs font-black text-slate-400">{cant} entregados</span>
                                                        </div>
                                                        {c === '🏆 Recompensas Campos' && ultimaRutaCompletada.bloqueos?.[c]?.comentario && (
                                                            <p className="text-[9px] font-bold text-slate-400 mt-1 italic w-full text-right border-t border-slate-200/50 pt-1">
                                                                Motivo: {ultimaRutaCompletada.bloqueos[c].comentario}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            entregasPendientes.map(e => {
                                const camposDeRuta = e.campos || [e.campo];
                                
                                // Calculamos total ingresado tomando en cuenta los campos adicionales si ya tienen datos
                                const totalIngresado = [...camposDeRuta, '📦 Víveres Equipo Logística', '🏆 Recompensas Campos'].reduce((sum, c) => {
                                    return sum + (Number(cantidadesDetalle[e.id]?.[c]) || Number(e.detalles?.[c]) || 0);
                                }, 0);
                                const enVehiculo = e.cantidad - totalIngresado;

                                return (
                                    <div key={e.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative overflow-hidden shadow-sm">
                                        <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">{e.grupo}</div>
                                        <h3 className="font-black text-slate-800 text-lg mb-4 mt-1"><i className="fas fa-truck-loading text-amber-500 mr-2"></i>Ruta Activa</h3>
                                        
                                        <div className="bg-white p-3 rounded-2xl mb-5 flex justify-between items-center shadow-sm border border-slate-100">
                                            <div className="text-center w-1/3">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Carga Inicial</p>
                                                <p className="text-lg font-black text-indigo-600">{e.cantidad}</p>
                                            </div>
                                            <div className="text-center w-1/3 border-l border-r border-slate-100">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Entregados</p>
                                                <p className="text-lg font-black text-emerald-500">{totalIngresado}</p>
                                            </div>
                                            <div className="text-center w-1/3">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">En Vehículo</p>
                                                <p className={`text-lg font-black ${enVehiculo < 0 ? 'text-rose-500' : 'text-amber-500'}`}>{enVehiculo}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 mb-5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Ingresa cantidad dejada por campo:</p>
                                            
                                            {/* RENDERIZADO DE CAMPOS DE LA RUTA */}
                                            {camposDeRuta.map(c => {
                                                const bloqueo = e.bloqueos?.[c];
                                                const bloqueadoPorOtro = bloqueo && bloqueo.id !== datosUsuarioActual.id;
                                                const bloqueadoPorMi = bloqueo && bloqueo.id === datosUsuarioActual.id;

                                                return (
                                                    <div key={c} className={`flex flex-col bg-white p-3 rounded-xl border shadow-sm ${bloqueadoPorOtro ? 'border-rose-100 bg-rose-50/40' : bloqueadoPorMi ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'}`}>
                                                        <div className="flex justify-between items-center">
                                                            <span className={`text-xs font-bold w-1/2 truncate ${bloqueadoPorOtro ? 'text-slate-400' : 'text-slate-700'}`}>{c}</span>
                                                            <div className="w-1/2 flex justify-end">
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="Cant." 
                                                                    disabled={bloqueadoPorOtro}
                                                                    className={`w-16 p-2 rounded-lg text-xs font-black text-center outline-none transition-colors ${bloqueadoPorOtro ? 'bg-transparent text-slate-400' : 'bg-slate-50 border border-slate-200 text-indigo-600 focus:border-indigo-400'}`}
                                                                    value={cantidadesDetalle[e.id]?.[c] !== undefined ? cantidadesDetalle[e.id]?.[c] : (e.detalles?.[c] || '')}
                                                                    onChange={(ev) => handleCantidadChange(e.id, c, ev.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        {bloqueadoPorOtro && (<p className="text-[9px] text-rose-500 font-bold mt-2"><i className="fas fa-lock mr-1"></i> Registrado por {bloqueo.nombre}</p>)}
                                                        {bloqueadoPorMi && (<p className="text-[9px] text-emerald-500 font-bold mt-2"><i className="fas fa-check mr-1"></i> Tú registraste este campo</p>)}
                                                    </div>
                                                );
                                            })}

                                            {/* SEPARADOR VISUAL PARA GASTOS DEL EQUIPO */}
                                            <div className="pt-2 mt-4 border-t-2 border-dashed border-slate-200">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-2 mt-2"><i className="fas fa-clipboard-list mr-1"></i> Control Interno:</p>
                                                
                                                {/* 1. CAMPO OBLIGATORIO: LOGÍSTICA */}
                                                <div className={`flex flex-col bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 shadow-sm mb-3`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-indigo-800 w-1/2 truncate">📦 Víveres Equipo Logística</span>
                                                        <div className="w-1/2 flex justify-end">
                                                            <input 
                                                                type="number" 
                                                                placeholder="Obligatorio" 
                                                                className="w-20 p-2 rounded-lg text-xs font-black text-center outline-none bg-white border border-indigo-200 text-indigo-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                                                value={cantidadesDetalle[e.id]?.['📦 Víveres Equipo Logística'] !== undefined ? cantidadesDetalle[e.id]?.['📦 Víveres Equipo Logística'] : (e.detalles?.['📦 Víveres Equipo Logística'] || '')}
                                                                onChange={(ev) => handleCantidadChange(e.id, '📦 Víveres Equipo Logística', ev.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. CAMPO OPCIONAL: RECOMPENSAS */}
                                                <div className={`flex flex-col bg-amber-50/30 p-3 rounded-xl border border-amber-100 shadow-sm`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-amber-800 w-1/2 truncate">🏆 Recompensas Campos</span>
                                                        <div className="w-1/2 flex justify-end">
                                                            <input 
                                                                type="number" 
                                                                placeholder="Opcional" 
                                                                className="w-16 p-2 rounded-lg text-xs font-black text-center outline-none bg-white border border-amber-200 text-amber-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                                                value={cantidadesDetalle[e.id]?.['🏆 Recompensas Campos'] !== undefined ? cantidadesDetalle[e.id]?.['🏆 Recompensas Campos'] : (e.detalles?.['🏆 Recompensas Campos'] || '')}
                                                                onChange={(ev) => handleCantidadChange(e.id, '🏆 Recompensas Campos', ev.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* SELECTOR DE MOTIVO DE RECOMPENSA (Solo aparece si ingresan un número mayor a 0) */}
                                                    {(Number(cantidadesDetalle[e.id]?.['🏆 Recompensas Campos']) > 0 || Number(e.detalles?.['🏆 Recompensas Campos']) > 0) && (
                                                        <div className="w-full mt-1 animate-in fade-in">
                                                            <select 
                                                                className="w-full p-2 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-slate-600 outline-none"
                                                                value={comentariosRecompensas[e.id] || ''}
                                                                onChange={(ev) => handleComentarioChange(e.id, ev.target.value)}
                                                            >
                                                                <option value="" disabled>Selecciona el motivo...</option>
                                                                <option value="Por textos aprendidos">Por textos aprendidos</option>
                                                                <option value="Por nuevo amiguito">Por nuevo amiguito</option>
                                                                <option value="Otra recompensa">Otra recompensa</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="flex space-x-2">
                                            <button onClick={() => handleGuardarAvance(e)} className="w-1/3 py-4 bg-white hover:bg-slate-100 text-indigo-500 border border-indigo-100 font-black rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center text-[10px] uppercase tracking-wide">
                                                <i className="fas fa-save mb-1 text-base"></i> Avance
                                            </button>
                                            <button onClick={() => handleFinalizar(e)} className="w-2/3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center text-sm">
                                                <i className="fas fa-check-circle mr-2"></i> Finalizar Ruta
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
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
