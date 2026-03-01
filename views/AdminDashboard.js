const { useState } = React;

function AdminDashboard({
    maestros, todosLosAlumnos, datosGlobalesAsistencia, historialAsistencias, entregasLogistica,
    mantenimiento, onToggleMantenimiento, onApprove, onDelete, onToggleModal, 
    onDeleteCampo, onResetLecciones, onCrearEntrega, onBorrarEntrega, onAssignGroup,
    inventarioDatos, onActualizarInventario, onCerrarJornada
}) {
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    // ESTADOS ADMIN
    const [expandirFiltroAdmin, setExpandirFiltroAdmin] = useState(false);
    const [campoExpandido, setCampoExpandido] = useState(null); 
    const [campoResetUI, setCampoResetUI] = useState(null); 
    
    const [subVistaAdminLogistica, setSubVistaAdminLogistica] = useState('bodega'); 
    const [edadMin, setEdadMin] = useState('');
    const [edadMax, setEdadMax] = useState('');
    const [camposRuta, setCamposRuta] = useState([]);
    
    const [grupoCompletadoExp, setGrupoCompletadoExp] = useState(null);

    const historialVisible = historialAsistencias.filter(h => !h.esReset);
    const todasAsistencias = datosGlobalesAsistencia?.registros || [];

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };
    const textoFechas = datosGlobalesAsistencia?.rango ? `${formatoFecha(datosGlobalesAsistencia.rango.inicio).substring(0,5)} - ${formatoFecha(datosGlobalesAsistencia.rango.fin).substring(0,5)}` : 'Calculando...';

    // --- MAGIA CORREGIDA: Matemática exacta sin restas invisibles ---
    const calcProgreso = (lec) => {
        const l = parseInt(lec) || 1;
        if (l <= 25) return { parte: 1, leccion: l, porc: Math.round((l/25)*100) };
        if (l <= 54) return { parte: 2, leccion: l - 25, porc: Math.round(((l-25)/29)*100) };
        return { parte: 'Extra', leccion: l, porc: 100 };
    };

    const NavButton = ({ id, icon, label, width = 'w-[75px]' }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center ${width} h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[9px] tracking-wide">{label}</span>
        </button>
    );

    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const listaAdminVisible = maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase())));
    
    const camposActivos = [...new Set([...maestros.filter(m => m.clase !== 'LOGISTICA' && m.campo).map(m => m.campo), ...todosLosAlumnos.map(a => a.campo), ...historialVisible.map(h => h.campo)].filter(Boolean))].sort();
    const camposFijos = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    const toggleCampoRuta = (c) => {
        if(camposRuta.includes(c)) setCamposRuta(camposRuta.filter(x => x !== c));
        else setCamposRuta([...camposRuta, c]);
    };

    const submitMision = (e) => {
        e.preventDefault();
        if(camposRuta.length === 0) { alert("⚠️ Debes seleccionar al menos un campo para armar la ruta."); return; }
        const fd = new FormData(e.target);
        onCrearEntrega({ campos: camposRuta, cantidad: parseInt(fd.get('cantidad')), grupo: fd.get('grupo') });
        setCamposRuta([]); 
        e.target.reset();
    };

    let contenidoAdmin;

    if (vistaActual === 'inicio') {
        let tp = 0, ta = 0, tperm = 0; todasAsistencias.forEach(r => { if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } });
        contenidoAdmin = (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className={`p-5 rounded-3xl border shadow-sm transition-colors duration-500 flex justify-between items-center ${mantenimiento ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                    <div><h3 className={`font-black flex items-center ${mantenimiento ? 'text-rose-600' : 'text-slate-700'}`}><i className={`fas fa-tools mr-2 ${mantenimiento ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}></i> Mantenimiento</h3><p className="text-[10px] text-slate-500 mt-1 leading-tight">{mantenimiento ? 'App bloqueada. Nadie puede entrar.' : 'Sistema activo. Maestros operando.'}</p></div>
                    <button onClick={onToggleMantenimiento} className={`w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner ${mantenimiento ? 'bg-rose-500' : 'bg-slate-200'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${mantenimiento ? 'right-1' : 'left-1'}`}></div></button>
                </div>

                {pendientes.length > 0 && (<div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]"><h3 className="text-amber-800 font-bold text-sm mb-3"><i className="fas fa-user-clock mr-2"></i> Solicitudes ({pendientes.length})</h3><div className="space-y-3">{pendientes.map(p => (<div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100"><div><p className="font-bold text-slate-700 text-sm">{p.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{p.clase} - {p.campo}</span></div><div className="flex space-x-2"><button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl"><i className="fas fa-check"></i></button><button onClick={() => onDelete(p)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl"><i className="fas fa-times"></i></button></div></div>))}</div></div>)}
                
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm"><div className="flex justify-between items-center mb-4"><div><h3 className="font-bold text-slate-700 text-sm flex items-center"><i className="fas fa-clipboard-check text-emerald-500 mr-2"></i> Asistencia Global</h3><p className="text-[10px] text-slate-400 pl-6">Acumulado Semanal</p></div><span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg border border-slate-200">{textoFechas}</span></div><div className="flex justify-around text-center divide-x divide-slate-50"><div className="px-2"><p className="text-3xl font-black text-emerald-500">{tp}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Presentes</p></div><div className="px-2"><p className="text-3xl font-black text-rose-500">{ta}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ausentes</p></div><div className="px-2"><p className="text-3xl font-black text-amber-500">{tperm}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Permisos</p></div></div></div>
                
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                    <button onClick={() => setExpandirFiltroAdmin(!expandirFiltroAdmin)} className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center"><div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mr-3"><i className="fas fa-filter"></i></div><div className="text-left"><h3 className="font-bold text-slate-700 text-sm">Filtro Demográfico</h3><p className="text-[10px] text-slate-400">Analizar edades globales</p></div></div>
                        <i className={`fas fa-chevron-down text-slate-300 transition-transform duration-300 ${expandirFiltroAdmin ? 'rotate-180' : ''}`}></i>
                    </button>
                    {expandirFiltroAdmin && (
                        <div className="p-6 pt-0 animate-in slide-in-from-top-2 duration-200 border-t border-slate-50">
                            <div className="flex space-x-3 mb-4 mt-4"><div className="w-1/2"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mínima (Años)</label><input type="number" className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none border border-slate-100" value={edadMin} onChange={e=>setEdadMin(e.target.value)} /></div><div className="w-1/2"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Máxima (Años)</label><input type="number" className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none border border-slate-100" value={edadMax} onChange={e=>setEdadMax(e.target.value)} /></div></div>
                            {(edadMin !== '' || edadMax !== '') && (() => {
                                const filtrados = todosLosAlumnos.filter(a => { if (edadMin !== '' && a.edad < parseInt(edadMin)) return false; if (edadMax !== '' && a.edad > parseInt(edadMax)) return false; return true; });
                                const m = filtrados.filter(a => a.genero === 'M').length; const f = filtrados.filter(a => a.genero === 'F').length;
                                return (
                                    <div className="flex justify-around items-center bg-sky-50 p-4 rounded-2xl mb-4"><div className="text-center"><p className="text-2xl font-black text-sky-600">{filtrados.length}</p><p className="text-[9px] font-bold text-sky-500 uppercase">Total</p></div><div className="text-center"><p className="text-2xl font-black text-indigo-500">{m}</p><p className="text-[9px] font-bold text-indigo-400 uppercase">Niños</p></div><div className="text-center"><p className="text-2xl font-black text-pink-500">{f}</p><p className="text-[9px] font-bold text-pink-400 uppercase">Niñas</p></div></div>
                                );
                            })()}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p><div><p className="text-5xl font-black tracking-tighter">{activos.length}</p><p className="text-[10px] opacity-70 mt-1">Miembros Totales</p></div></div><button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm group hover:shadow-md transition-all active:scale-95"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl transition-colors"><i className="fas fa-plus"></i></div><div><p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Personal</p><p className="text-[10px] text-slate-400 mt-1">Manual</p></div></button></div>
            </div>
        );
    }

    if (vistaActual === 'poblacion') {
        const adminAlumnosFiltrados = todosLosAlumnos.filter(a => { if (edadMin !== '' && a.edad < parseInt(edadMin)) return false; if (edadMax !== '' && a.edad > parseInt(edadMax)) return false; return true; });
        const filtroActivo = edadMin !== '' || edadMax !== '';

        contenidoAdmin = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Gestión por Campo</h2><p className="text-slate-400 text-xs">Población, currículo y clases del año</p></div>
                
                <div className="bg-sky-50 rounded-[32px] p-6 shadow-sm border border-sky-100">
                    <h3 className="font-bold text-sky-800 text-sm mb-4 flex items-center"><i className="fas fa-filter mr-2"></i> Rango de Edades</h3>
                    <div className="flex space-x-4"><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Mínima (Años)</label><input type="number" placeholder="Ej: 0" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMin} onChange={e=>setEdadMin(e.target.value)} /></div><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Máxima (Años)</label><input type="number" placeholder="Ej: 5" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMax} onChange={e=>setEdadMax(e.target.value)} /></div></div>
                    <div className="flex justify-around items-center bg-white p-4 rounded-2xl mt-4 shadow-sm">
                        <div className="text-center"><p className="text-3xl font-black text-sky-600">{adminAlumnosFiltrados.length}</p><p className="text-[9px] font-bold text-sky-500 uppercase">Total Red</p></div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="text-center"><p className="text-2xl font-black text-indigo-500">{adminAlumnosFiltrados.filter(a => a.genero === 'M').length}</p><p className="text-[9px] font-bold text-indigo-400 uppercase">Niños</p></div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="text-center"><p className="text-2xl font-black text-pink-500">{adminAlumnosFiltrados.filter(a => a.genero === 'F').length}</p><p className="text-[9px] font-bold text-pink-400 uppercase">Niñas</p></div>
                    </div>
                </div>

                <h3 className="font-bold text-slate-700 text-sm mt-6 px-2">Campos Activos</h3>
                <div className="space-y-3 pb-24">
                    {camposActivos.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-[32px] mt-4 border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl text-slate-300 mx-auto mb-3 shadow-sm"><i className="fas fa-seedling"></i></div>
                            <p className="text-sm font-bold text-slate-500">No hay campos activos aún</p>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Los campos aparecerán aquí automáticamente cuando un maestro se asigne a ellos o se inscriban alumnos.</p>
                        </div>
                    ) : (
                        camposActivos.map(campo => {
                            if (filtroActivo) {
                                const alumnosCampo = adminAlumnosFiltrados.filter(a => a.campo === campo);
                                const total = alumnosCampo.length; const ninos = alumnosCampo.filter(a => a.genero === 'M').length; const ninas = alumnosCampo.filter(a => a.genero === 'F').length;
                                if (total === 0) return null; 
                                return (<div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><span className="font-bold text-slate-700 text-sm">{campo}</span><div className="flex space-x-2 text-xs font-bold"><span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">T: {total}</span><span className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg">M: {ninos}</span><span className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg">F: {ninas}</span></div></div>);
                            } 
                            else {
                                const total = todosLosAlumnos.filter(a => a.campo === campo).length; 
                                
                                const registrosCampoTodo = historialAsistencias.filter(h => h.campo === campo && h.leccion !== undefined);
                                const registrosOrdenados = registrosCampoTodo.sort((a, b) => b.timestamp - a.timestamp);
                                const ultimoReg = registrosOrdenados[0];
                                
                                // EL ADMIN Y EL MAESTRO AHORA CALCULAN EXACTAMENTE IGUAL
                                let currLec = 1;
                                if (ultimoReg) {
                                    if (ultimoReg.esReset) {
                                        currLec = parseInt(ultimoReg.leccion);
                                    } else {
                                        currLec = ultimoReg.leccionImpartida ? parseInt(ultimoReg.leccion) + 1 : parseInt(ultimoReg.leccion);
                                    }
                                }

                                const prog = calcProgreso(currLec);
                                const isExpanded = campoExpandido === campo;
                                const registrosCampo = historialVisible.filter(h => h.campo === campo);
                                
                                return (
                                    <div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-700 text-lg truncate w-1/3">{campo}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-2 py-1.5 rounded uppercase">{total} Alumnos</span>
                                                <button onClick={() => setCampoExpandido(isExpanded ? null : campo)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Ver Historial de Clases"><i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i></button>
                                                <button onClick={() => setCampoResetUI(campoResetUI === campo ? null : campo)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-sky-500 hover:text-white transition-colors" title="Ajustar Material"><i className="fas fa-cog"></i></button>
                                                <button onClick={() => onDeleteCampo(campo)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Limpiar Campo"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>Material: Parte {prog.parte} • Lección {prog.leccion}</span><span className="text-indigo-500">{prog.porc}%</span></div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{width: `${prog.porc}%`}}></div></div>
                                        </div>

                                        {campoResetUI === campo && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                                                <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest text-center"><i className="fas fa-cog mr-1"></i> Asignar Lección Exacta</p>
                                                <form onSubmit={(e) => { 
                                                    e.preventDefault(); 
                                                    onResetLecciones(campo, parseInt(e.target.leccion.value)); 
                                                    setCampoResetUI(null); 
                                                }} className="flex space-x-2">
                                                    <input 
                                                        type="number" 
                                                        name="leccion" 
                                                        min="1" 
                                                        max="54" 
                                                        required 
                                                        placeholder="N° (1 al 54)" 
                                                        className="w-1/2 p-3 bg-white rounded-xl text-sm font-black text-slate-700 text-center shadow-sm border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" 
                                                    />
                                                    <button type="submit" className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all">
                                                        <i className="fas fa-check mr-2"></i>Aplicar
                                                    </button>
                                                </form>
                                                <p className="text-[9px] text-slate-400 text-center mt-2 font-bold">1 al 25 = Mat 1 | 26 al 54 = Mat 2</p>
                                            </div>
                                        )}

                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest"><i className="fas fa-history mr-1"></i> Clases Impartidas ({registrosCampo.length})</p>
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                    {registrosCampo.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">Sin clases registradas aún.</p> : 
                                                    registrosCampo.map((h, i) => (
                                                        <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                                            <div>
                                                                <p className="font-black text-slate-700 text-xs">{formatoFecha(h.fecha)}</p>
                                                                <p className="text-[9px] text-slate-400 uppercase mt-0.5"><i className="fas fa-user mr-1"></i>{h.maestro}</p>
                                                                {h.leccion !== undefined && (<p className={`text-[9px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}>Lec. {h.leccion} {h.leccionImpartida ? '✅' : '❌'}</p>)}
                                                            </div>
                                                            <div className="flex space-x-1 text-[10px] font-bold">
                                                                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-1 rounded">P: {h.totales?.presentes || 0}</span>
                                                                <span className="bg-rose-100 text-rose-700 px-1.5 py-1 rounded">A: {h.totales?.ausentes || 0}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            </div>
        );
    }

    if (vistaActual === 'logistica') {
        const entregasPendientes = entregasLogistica.filter(e => e.estado === 'Pendiente');
        const entregasCompletadas = entregasLogistica.filter(e => e.estado === 'Entregado');
        const personalLogistica = activos.filter(m => m.clase === 'LOGISTICA'); 

        const entregasCompletadasPorGrupo = {};
        entregasCompletadas.forEach(e => {
            if (!entregasCompletadasPorGrupo[e.grupo]) entregasCompletadasPorGrupo[e.grupo] = [];
            entregasCompletadasPorGrupo[e.grupo].push(e);
        });
        const gruposCompletados = Object.keys(entregasCompletadasPorGrupo).sort();

        const historicoRecibido = inventarioDatos?.historicoRecibido || 0;
        const actualRecibido = inventarioDatos?.actualRecibido || 0;

        let totalEntregadoHistorico = 0;
        let totalEntregadoActual = 0;
        const rutasParaArchivar = [];

        entregasLogistica.forEach(e => {
            let sumRoute = 0;
            if (e.detalles) {
                Object.values(e.detalles).forEach(val => sumRoute += (Number(val) || 0));
            }
            totalEntregadoHistorico += sumRoute;
            
            if (e.estado === 'Entregado' && !e.archivado) {
                totalEntregadoActual += sumRoute;
                rutasParaArchivar.push(e);
            }
        });

        const stockFisico = historicoRecibido - totalEntregadoHistorico;
        const restanActual = actualRecibido - totalEntregadoActual;

        contenidoAdmin = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Logística</h2><p className="text-slate-400 text-xs">Inventario, rutas y equipos</p></div>
                
                <div className="flex px-2 space-x-2 mb-2">
                    <button onClick={() => setSubVistaAdminLogistica('bodega')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaAdminLogistica === 'bodega' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-warehouse mr-2"></i>Bodega</button>
                    <button onClick={() => setSubVistaAdminLogistica('misiones')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaAdminLogistica === 'misiones' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-route mr-2"></i>Rutas</button>
                    <button onClick={() => setSubVistaAdminLogistica('equipos')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaAdminLogistica === 'equipos' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-users-cog mr-2"></i>Equipos</button>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    
                    {subVistaAdminLogistica === 'bodega' && (
                        <div className="animate-in slide-in-from-left duration-200 px-1">
                            <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-5 mt-2">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div>
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-1">Stock Físico en Bodega</p>
                                    <p className="text-6xl font-black tracking-tighter">{stockFisico}</p>
                                </div>
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm absolute bottom-6 right-6 z-10"><i className="fas fa-boxes"></i></div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-5 mb-5 border border-slate-200 shadow-sm">
                                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Control Actual (Esta Jornada)</h3>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-center w-1/3"><p className="text-[10px] font-bold text-slate-400 uppercase">Recibido</p><p className="text-xl font-black text-slate-700">{actualRecibido}</p></div>
                                    <div className="text-center w-1/3 border-l border-r border-slate-200"><p className="text-[10px] font-bold text-slate-400 uppercase">Entregado</p><p className="text-xl font-black text-emerald-500">{totalEntregadoActual}</p></div>
                                    <div className="text-center w-1/3"><p className="text-[10px] font-bold text-slate-400 uppercase">Por entregar</p><p className="text-xl font-black text-amber-500">{restanActual}</p></div>
                                </div>
                                <button onClick={() => onCerrarJornada(rutasParaArchivar)} className="w-full py-3 bg-white text-rose-500 border border-rose-200 font-bold rounded-xl shadow-sm text-[11px] uppercase tracking-widest active:scale-95 transition-all"><i className="fas fa-flag-checkered mr-2"></i> Cerrar Jornada (Reiniciar Actual)</button>
                            </div>

                            <div className="flex space-x-3 mb-6">
                                <div className="w-1/2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Histórico Recibido</p>
                                    <p className="text-2xl font-black text-slate-700">{historicoRecibido}</p>
                                </div>
                                <div className="w-1/2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Histórico Entregado</p>
                                    <p className="text-2xl font-black text-emerald-500">{totalEntregadoHistorico}</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); onActualizarInventario(Number(e.target.nuevoStock.value)); e.target.reset(); }} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center"><i className="fas fa-plus-circle text-indigo-500 mr-2"></i> Sumar Víveres Recibidos</h3>
                                <div className="flex space-x-3">
                                    <input type="number" name="nuevoStock" required min="1" placeholder="Ej: 100" className="w-2/3 p-4 bg-slate-50 rounded-2xl outline-none border border-slate-200 text-lg font-black text-slate-700 text-center focus:border-indigo-400" />
                                    <button type="submit" className="w-1/3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center">Sumar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {subVistaAdminLogistica === 'misiones' && (
                        <>
                            <form onSubmit={submitMision} className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm mx-1">
                                <h3 className="font-bold text-amber-800 text-sm mb-4 flex items-center"><i className="fas fa-map-marked-alt mr-2"></i> Crear Ruta de Reparto</h3>
                                <div className="space-y-4">
                                    
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-700 uppercase mb-2">1. Selecciona los campos a visitar:</p>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 bg-white rounded-2xl border border-amber-100 shadow-inner">
                                            {camposFijos.map(c => (
                                                <label key={c} className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer active:scale-95 transition-transform">
                                                    <input type="checkbox" checked={camposRuta.includes(c)} onChange={() => toggleCampoRuta(c)} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400" />
                                                    <span className="truncate">{c}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-amber-700 uppercase mb-2">2. Asigna Cantidad y Equipo:</p>
                                        <div className="flex space-x-3">
                                            <div className="w-1/2"><input type="number" name="cantidad" required placeholder="Total Víveres" className="w-full p-4 bg-white rounded-2xl outline-none border border-amber-100 text-sm font-bold text-slate-700 text-center shadow-sm" /></div>
                                            <div className="w-1/2">
                                                <select name="grupo" required className="w-full p-4 bg-white rounded-2xl outline-none border border-amber-100 text-sm font-bold text-slate-700 shadow-sm">
                                                    <option value="">¿A qué Grupo?</option>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (<option key={n} value={`Grupo ${n}`}>Grupo {n}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all mt-2">Confirmar Ruta</button>
                                </div>
                            </form>

                            <div className="mt-6 px-1">
                                {entregasPendientes.length > 0 && (
                                    <div className="mb-6"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Rutas Pendientes ({entregasPendientes.length})</h4>
                                    <div className="space-y-3">
                                        {entregasPendientes.map(e => {
                                            const totalEntregado = e.detalles ? Object.values(e.detalles).reduce((sum, val) => sum + (Number(val) || 0), 0) : 0;
                                            const diferencia = e.cantidad - totalEntregado;

                                            return (
                                                <div key={e.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-amber-400 shadow-sm flex justify-between items-center">
                                                    <div className="w-3/4 pr-2">
                                                        <p className="font-black text-slate-800 text-sm mb-1">{e.grupo}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed"><i className="fas fa-map-marker-alt mr-1 text-amber-500"></i> {e.campos ? e.campos.join(', ') : e.campo}</p>
                                                        
                                                        <div className="bg-slate-50 p-2 rounded-lg mt-3 flex justify-between text-[10px] font-bold border border-slate-100">
                                                            <span className="text-indigo-600">Total: {e.cantidad}</span>
                                                            <span className="text-emerald-600">Avance: {totalEntregado}</span>
                                                            <span className={diferencia < 0 ? 'text-rose-500' : 'text-amber-600'}>En Vehículo: {diferencia}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => onBorrarEntrega(e.id)} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors flex-shrink-0"><i className="fas fa-trash-alt"></i></button>
                                                </div>
                                            );
                                        })}
                                    </div></div>
                                )}

                                {gruposCompletados.length > 0 && (
                                    <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Historial por Rutas (Completadas)</h4>
                                    <div className="space-y-3 opacity-95">
                                        {gruposCompletados.map(nombreGrupo => {
                                            const isExpanded = grupoCompletadoExp === nombreGrupo;
                                            const entregasDelGrupo = entregasCompletadasPorGrupo[nombreGrupo].sort((a, b) => (b.fechaEntrega || 0) - (a.fechaEntrega || 0));

                                            return (
                                                <div key={nombreGrupo} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300">
                                                    <button onClick={() => setGrupoCompletadoExp(isExpanded ? null : nombreGrupo)} className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                                                        <div className="text-left">
                                                            <p className="font-black text-slate-700 text-sm">{nombreGrupo}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{entregasDelGrupo.length} misiones finalizadas</p>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-emerald-500 font-bold text-lg"><i className="fas fa-check-circle"></i></span>
                                                            <i className={`fas fa-chevron-down text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                                        </div>
                                                    </button>
                                                    
                                                    {isExpanded && (
                                                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-1">
                                                                {entregasDelGrupo.map(e => {
                                                                    const totalEntregado = e.detalles ? Object.values(e.detalles).reduce((sum, val) => sum + (Number(val) || 0), 0) : 0;
                                                                    const diferencia = e.cantidad - totalEntregado;
                                                                    const fechaObj = e.fechaEntrega ? new Date(e.fechaEntrega) : null;
                                                                    const fechaFormateada = fechaObj ? `${fechaObj.toLocaleDateString()} a las ${fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Fecha no registrada';

                                                                    return (
                                                                        <div key={e.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                                                                            <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-indigo-500"><i className="far fa-calendar-alt mr-1"></i> {fechaFormateada}</p>
                                                                                    <p className="text-xs font-black text-slate-700 mt-1">Asignado: {e.cantidad} | Entregado: {totalEntregado}</p>
                                                                                </div>
                                                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${diferencia === 0 ? 'bg-emerald-100 text-emerald-700' : diferencia > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                                    {diferencia === 0 ? 'Exacto (0)' : diferencia > 0 ? `Sobraron ${diferencia}` : `Faltaron ${Math.abs(diferencia)}`}
                                                                                </span>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 gap-1.5">
                                                                                {e.detalles && Object.entries(e.detalles).map(([campo, cant]) => {
                                                                                    const creador = e.bloqueos?.[campo]?.nombre;
                                                                                    return (
                                                                                        <p key={campo} className="text-[10px] font-bold text-slate-500 truncate flex justify-between bg-slate-50 p-1.5 rounded-lg">
                                                                                            <span><i className="fas fa-map-marker-alt text-slate-400 mr-1"></i> {campo}</span>
                                                                                            <span className="text-indigo-600 font-black">{cant} <span className="font-normal text-slate-400 ml-1">{creador ? `(${creador})` : ''}</span></span>
                                                                                        </p>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div></div>
                                )}
                            </div>
                        </>
                    )}

                    {subVistaAdminLogistica === 'equipos' && (
                        <div className="px-1 animate-in slide-in-from-right duration-200 mt-2">
                            <p className="text-xs text-slate-500 mb-4 px-2 leading-relaxed">Asigna a qué grupo de reparto pertenece cada integrante de logística.</p>
                            <div className="space-y-3">
                                {personalLogistica.length === 0 ? <p className="text-center text-slate-400 text-sm italic mt-8">No hay personal de logística registrado.</p> :
                                    personalLogistica.map(p => (
                                        <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-3 w-1/2">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">{p.nombre.charAt(0)}</div>
                                                <p className="font-bold text-slate-700 text-sm truncate">{p.nombre}</p>
                                            </div>
                                            <div className="w-1/2">
                                                <select 
                                                    value={p.grupo || ''} 
                                                    onChange={(e) => onAssignGroup(p.id, e.target.value)} 
                                                    className={`w-full p-2 rounded-xl text-xs font-bold outline-none border ${p.grupo ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-rose-50 border-rose-100 text-rose-500'}`}
                                                >
                                                    <option value="">-- Sin Grupo --</option>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                        <option key={n} value={`Grupo ${n}`}>Grupo {n}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (vistaActual === 'personal') {
        contenidoAdmin = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Directorio Personal</h2><p className="text-slate-400 text-xs">{activos.length} Miembros Activos</p></div>
                <div className="flex items-center bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100"><i className="fas fa-search text-slate-300 mr-3 text-lg"></i><input type="text" placeholder="Buscar..." className="bg-transparent w-full outline-none text-sm font-bold text-slate-700" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-2 mt-4">
                    {listaAdminVisible.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">{m.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{m.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{m.clase} {m.campo ? `- ${m.campo}` : m.grupo ? `- ${m.grupo}` : ''}</span></div></div><div className="flex space-x-2"><button onClick={() => onEdit(m)} className="text-indigo-400 w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-xl"><i className="fas fa-edit"></i></button><button onClick={() => onDelete(m)} className="text-rose-400 w-10 h-10 flex items-center justify-center bg-rose-50 rounded-xl"><i className="fas fa-trash"></i></button></div></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            {contenidoAdmin}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <NavButton id="inicio" icon="fa-home" label="Panel" width="w-[75px]" />
                <NavButton id="poblacion" icon="fa-layer-group" label="Campos" width="w-[75px]" />
                <NavButton id="logistica" icon="fa-truck" label="Logística" width="w-[75px]" />
                <NavButton id="personal" icon="fa-address-book" label="Personal" width="w-[75px]" />
            </div>
        </>
    );
}

window.AdminDashboard = AdminDashboard;
