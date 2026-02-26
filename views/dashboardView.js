const { useState } = React;

function DashboardView({ 
    maestros, 
    alumnos = [], 
    todosLosAlumnos = [], 
    asistenciaHoy, 
    datosGlobalesAsistencia = { registros: [], rango: null }, 
    historialAsistencias = [], 
    usuario, 
    datosUsuarioActual,
    mantenimiento, // ESTADO RECIBIDO
    onToggleMantenimiento, // ACCIÓN RECIBIDA
    onEdit, onDelete, onApprove, onToggleModal, 
    onOpenAlumnoModal, onEditAlumno, onDeleteAlumno, onSaveAsistencia,
    onDeleteCampo,
    onResetLecciones
}) {
    const esAdmin = usuario === 'ADMIN';
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [listaAsistencia, setListaAsistencia] = useState({});

    const [expandirFiltroAdmin, setExpandirFiltroAdmin] = useState(false);
    const [campoHistorialExp, setCampoHistorialExp] = useState(null); 
    const [campoResetUI, setCampoResetUI] = useState(null);

    const [subVistaReporte, setSubVistaReporte] = useState('ranking');
    const [fechaInicioRanking, setFechaInicioRanking] = useState('');
    const [fechaFinRanking, setFechaFinRanking] = useState('');
    
    const [leccionActual, setLeccionActual] = useState('');
    const [leccionImpartida, setLeccionImpartida] = useState(true);
    const [edadMin, setEdadMin] = useState('');
    const [edadMax, setEdadMax] = useState('');

    const historialVisible = historialAsistencias.filter(h => !h.esReset);
    const todasAsistencias = datosGlobalesAsistencia?.registros || [];

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };
    const textoFechas = datosGlobalesAsistencia?.rango ? `${formatoFecha(datosGlobalesAsistencia.rango.inicio).substring(0,5)} - ${formatoFecha(datosGlobalesAsistencia.rango.fin).substring(0,5)}` : 'Calculando...';

    const calcProgreso = (leccionNumero) => {
        const l = parseInt(leccionNumero) || 0;
        if (l === 0) return { parte: 1, impartidas: 0, faltan: 25, porc: 0 };
        if (l <= 25) return { parte: 1, impartidas: l, faltan: 25 - l, porc: Math.round((l/25)*100) };
        if (l <= 50) return { parte: 2, impartidas: l - 25, faltan: 50 - l, porc: Math.round(((l-25)/25)*100) };
        return { parte: 'Extra', impartidas: l, faltan: 0, porc: 100 };
    };

    React.useEffect(() => {
        if (vistaActual === 'asistencia' && alumnos.length > 0) {
            const inicial = {};
            if (asistenciaHoy && asistenciaHoy.registros) {
                asistenciaHoy.registros.forEach(r => inicial[r.idAlumno] = r.estado);
                setLeccionActual(asistenciaHoy.leccion || '');
                setLeccionImpartida(asistenciaHoy.leccionImpartida !== false);
            } else {
                alumnos.forEach(a => inicial[a.id] = 'Presente');
                if (historialAsistencias && historialAsistencias.length > 0) {
                    const ultimo = historialAsistencias.find(h => h.leccion !== undefined);
                    if (ultimo) { setLeccionActual(ultimo.leccionImpartida ? parseInt(ultimo.leccion) + 1 : parseInt(ultimo.leccion)); } 
                    else { setLeccionActual(1); }
                } else { setLeccionActual(1); }
                setLeccionImpartida(true);
            }
            setListaAsistencia(inicial);
        }
    }, [vistaActual, alumnos, asistenciaHoy, historialAsistencias]);

    const guardarLista = async () => {
        if (alumnos.length === 0) { alert("Debes registrar alumnos primero."); return; }
        if (!leccionActual) { alert("Por favor, ingresa el número de la lección."); return; }
        const registros = alumnos.map(a => ({ idAlumno: a.id, nombre: a.nombre, estado: listaAsistencia[a.id] || 'Ausente' }));
        const exito = await onSaveAsistencia(registros, leccionActual, leccionImpartida);
        if (exito) setVistaActual('inicio');
    };

    const NavButton = ({ id, icon, label }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center w-[70px] h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[9px] tracking-wide">{label}</span>
        </button>
    );

    // ==========================================
    // VISTA ADMINISTRADOR / DIRECTOR
    // ==========================================
    if (esAdmin) {
        const pendientes = maestros.filter(m => m.estado === 'Pendiente');
        const activos = maestros.filter(m => m.estado === 'Activo');
        const listaAdminVisible = maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase())));
        
        const todosLosCamposExistentes = [...new Set([
            ...todosLosAlumnos.map(a => a.campo),
            ...todasAsistencias.map(a => a.campo),
            ...historialAsistencias.map(h => h.campo)
        ].filter(Boolean))].sort();

        let contenidoAdmin;

        if (vistaActual === 'inicio') {
            let tp = 0, ta = 0, tperm = 0; todasAsistencias.forEach(r => { if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } });
            contenidoAdmin = (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* BOTÓN MODO MANTENIMIENTO */}
                    <div className={`p-5 rounded-3xl border shadow-sm transition-colors duration-500 flex justify-between items-center ${mantenimiento ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                        <div>
                            <h3 className={`font-black flex items-center ${mantenimiento ? 'text-rose-600' : 'text-slate-700'}`}>
                                <i className={`fas fa-tools mr-2 ${mantenimiento ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}></i> 
                                Mantenimiento
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{mantenimiento ? 'App bloqueada. Nadie puede entrar.' : 'Sistema activo. Maestros operando.'}</p>
                        </div>
                        <button onClick={onToggleMantenimiento} className={`w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner ${mantenimiento ? 'bg-rose-500' : 'bg-slate-200'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${mantenimiento ? 'right-1' : 'left-1'}`}></div>
                        </button>
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
                                        <div className="flex justify-around items-center bg-sky-50 p-4 rounded-2xl mb-4">
                                            <div className="text-center"><p className="text-2xl font-black text-sky-600">{filtrados.length}</p><p className="text-[9px] font-bold text-sky-500 uppercase">Total</p></div>
                                            <div className="text-center"><p className="text-2xl font-black text-indigo-500">{m}</p><p className="text-[9px] font-bold text-indigo-400 uppercase">Niños</p></div>
                                            <div className="text-center"><p className="text-2xl font-black text-pink-500">{f}</p><p className="text-[9px] font-bold text-pink-400 uppercase">Niñas</p></div>
                                        </div>
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
            const adminTotalNinos = adminAlumnosFiltrados.filter(a => a.genero === 'M').length;
            const adminTotalNinas = adminAlumnosFiltrados.filter(a => a.genero === 'F').length;
            const filtroActivo = edadMin !== '' || edadMax !== '';

            contenidoAdmin = (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Campos y Material</h2><p className="text-slate-400 text-xs">Administración de currículo y datos locales</p></div>
                    
                    <div className="bg-sky-50 rounded-[32px] p-6 shadow-sm border border-sky-100">
                        <h3 className="font-bold text-sky-800 text-sm mb-4 flex items-center"><i className="fas fa-filter mr-2"></i> Rango de Edades</h3>
                        <div className="flex space-x-4"><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Mínima (Años)</label><input type="number" placeholder="Ej: 0" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMin} onChange={e=>setEdadMin(e.target.value)} /></div><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Máxima (Años)</label><input type="number" placeholder="Ej: 5" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMax} onChange={e=>setEdadMax(e.target.value)} /></div></div>
                        <div className="flex justify-around items-center bg-white p-4 rounded-2xl mt-4 shadow-sm"><div className="text-center"><p className="text-3xl font-black text-sky-600">{adminAlumnosFiltrados.length}</p><p className="text-[9px] font-bold text-sky-500 uppercase">Total Red</p></div><div className="w-px h-10 bg-slate-100"></div><div className="text-center"><p className="text-2xl font-black text-indigo-500">{adminTotalNinos}</p><p className="text-[9px] font-bold text-indigo-400 uppercase">Niños</p></div><div className="w-px h-10 bg-slate-100"></div><div className="text-center"><p className="text-2xl font-black text-pink-500">{adminTotalNinas}</p><p className="text-[9px] font-bold text-pink-400 uppercase">Niñas</p></div></div>
                    </div>

                    <h3 className="font-bold text-slate-700 text-sm mt-6 px-2">Gestión por Campo</h3>
                    <div className="space-y-3 pb-24">
                        {todosLosCamposExistentes.length === 0 ? <p className="text-center text-slate-400 italic mt-8">No hay campos registrados.</p> :
                         todosLosCamposExistentes.map(campo => {
                            if (filtroActivo) {
                                const alumnosCampo = adminAlumnosFiltrados.filter(a => a.campo === campo);
                                const total = alumnosCampo.length; const ninos = alumnosCampo.filter(a => a.genero === 'M').length; const ninas = alumnosCampo.filter(a => a.genero === 'F').length;
                                if (total === 0) return null; 
                                return (<div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><span className="font-bold text-slate-700 text-sm">{campo}</span><div className="flex space-x-2 text-xs font-bold"><span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">T: {total}</span><span className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg">M: {ninos}</span><span className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg">F: {ninas}</span></div></div>);
                            } 
                            else {
                                const total = todosLosAlumnos.filter(a => a.campo === campo).length; 
                                const histCampo = historialAsistencias.find(h => h.campo === campo && h.leccion !== undefined);
                                const ultimaLec = histCampo ? parseInt(histCampo.leccion) : 0;
                                const prog = calcProgreso(ultimaLec);
                                
                                return (
                                    <div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-700 text-lg truncate w-1/2">{campo}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-indigo-50 text-indigo-600 font-black text-[10px] px-2 py-1.5 rounded uppercase">{total} Alumnos</span>
                                                <button onClick={() => setCampoResetUI(campoResetUI === campo ? null : campo)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-sky-500 hover:text-white transition-colors" title="Ajustar Material"><i className="fas fa-cog"></i></button>
                                                <button onClick={() => onDeleteCampo(campo)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Limpiar Campo"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>Material: Parte {prog.parte} • {prog.impartidas}/25 dadas</span><span className="text-indigo-500">{prog.porc}%</span></div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{width: `${prog.porc}%`}}></div></div>
                                        </div>

                                        {campoResetUI === campo && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest text-center"><i className="fas fa-sync-alt mr-1"></i> Reiniciar Material</p>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => { onResetLecciones(campo, 0); setCampoResetUI(null); }} className="flex-1 py-3 bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all">Empezar Parte 1</button>
                                                    <button onClick={() => { onResetLecciones(campo, 25); setCampoResetUI(null); }} className="flex-1 py-3 bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all">Empezar Parte 2</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            );
        }

        if (vistaActual === 'historial') {
            const camposConHistorial = [...new Set(historialVisible.map(h => h.campo))].sort();

            contenidoAdmin = (
                <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                    <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Historial Anual</h2><p className="text-slate-400 text-xs">Clases agrupadas por campo ({new Date().getFullYear()})</p></div>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-2">
                        {camposConHistorial.length === 0 ? <div className="text-center p-8 bg-slate-50 rounded-[32px]"><p className="text-sm font-bold text-slate-500">Historial vacío</p></div> : 
                        camposConHistorial.map(campo => {
                            const registrosCampo = historialVisible.filter(h => h.campo === campo);
                            const isExpanded = campoHistorialExp === campo;
                            return (
                                <div key={campo} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                    <button onClick={() => setCampoHistorialExp(isExpanded ? null : campo)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3"><i className="fas fa-map-marker-alt"></i></div><div className="text-left"><h3 className="font-bold text-slate-700 text-sm">{campo}</h3><p className="text-[10px] text-slate-400">{registrosCampo.length} clases impartidas</p></div></div>
                                        <i className={`fas fa-chevron-down text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {isExpanded && (
                                        <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200 border-t border-slate-50 bg-slate-50/50">
                                            <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1">
                                                {registrosCampo.map((h, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <p className="font-black text-slate-700 text-sm">{formatoFecha(h.fecha)}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase mt-0.5"><i className="fas fa-user mr-1"></i>{h.maestro}</p>
                                                            {h.leccion && (<p className={`text-[10px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}><i className="fas fa-book-open mr-1"></i>Lección {h.leccion} {h.leccionImpartida ? '✅' : '❌'}</p>)}
                                                        </div>
                                                        <div className="flex space-x-1 text-[10px] font-bold"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">P: {h.totales?.presentes || 0}</span><span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">A: {h.totales?.ausentes || 0}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                            <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">{m.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{m.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{m.clase} - {m.campo || 'N/A'}</span></div></div><div className="flex space-x-2"><button onClick={() => onEdit(m)} className="text-indigo-400 w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-xl"><i className="fas fa-edit"></i></button><button onClick={() => onDelete(m)} className="text-rose-400 w-10 h-10 flex items-center justify-center bg-rose-50 rounded-xl"><i className="fas fa-trash"></i></button></div></div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <>
                {contenidoAdmin}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <NavButton id="inicio" icon="fa-home" label="Panel" />
                    <NavButton id="poblacion" icon="fa-layer-group" label="Campos" />
                    <NavButton id="historial" icon="fa-history" label="Historial" />
                    <NavButton id="personal" icon="fa-address-book" label="Personal" />
                </div>
            </>
        );
    }

    // ==========================================
    // VISTA MAESTRO / AUXILIAR
    // ==========================================
    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        const asistenciaTomada = asistenciaHoy !== null;
        const soyElAutor = asistenciaHoy && asistenciaHoy.registradoPorId === datosUsuarioActual.id;
        const estaBloqueada = asistenciaTomada && !soyElAutor;

        const nombreDisplay = datosUsuarioActual ? datosUsuarioActual.nombre.split(' ')[0] : '';
        const rolDisplay = usuario.charAt(0) + usuario.slice(1).toLowerCase();

        const progInicio = calcProgreso(leccionActual || (asistenciaHoy ? asistenciaHoy.leccion : 0));

        const historialRankingFiltrado = historialVisible.filter(ha => {
            if (!fechaInicioRanking && !fechaFinRanking) return true;
            const f = ha.fecha;
            if (fechaInicioRanking && f < fechaInicioRanking) return false;
            if (fechaFinRanking && f > fechaFinRanking) return false;
            return true;
        });

        const alumnosConRanking = alumnos.map(a => {
            let asistenciasLogradas = 0;
            historialRankingFiltrado.forEach(ha => {
                const registroAlumno = ha.registros?.find(r => r.idAlumno === a.id);
                if (registroAlumno && registroAlumno.estado === 'Presente') asistenciasLogradas++;
            });
            return { ...a, asistenciasLogradas };
        });

        const rankingOrdenado = [...alumnosConRanking].sort((a,b) => b.asistenciasLogradas - a.asistenciasLogradas);

        const alumnosFiltrados = alumnos.filter(a => {
            if (edadMin !== '' && a.edad < parseInt(edadMin)) return false;
            if (edadMax !== '' && a.edad > parseInt(edadMax)) return false;
            return true;
        });

        let contenidoMaestro;

        if (vistaActual === 'inicio') {
            contenidoMaestro = (
                <div className="flex flex-col h-full space-y-6 pt-4 animate-in fade-in duration-300">
                    <div className="px-2"><h2 className="text-3xl font-black text-slate-800">Hola, {rolDisplay} {nombreDisplay}</h2><p className="text-slate-400 text-sm mt-1">Resumen de tu campo: <b className="text-indigo-500">{datosUsuarioActual.campo}</b></p></div>
                    
                    <div className={`w-full p-6 rounded-[32px] text-left relative overflow-hidden group shadow-lg ${estaBloqueada ? 'bg-slate-50 border border-slate-200' : asistenciaTomada ? 'bg-white border border-slate-100' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                        {asistenciaTomada ? (
                            <>
                                <div className="flex justify-between items-center mb-6"><h3 className={`font-bold text-sm flex items-center ${estaBloqueada ? 'text-slate-500' : 'text-slate-700'}`}><i className={`fas ${estaBloqueada ? 'fa-lock' : 'fa-clipboard-check'} mr-2 text-lg ${estaBloqueada ? 'text-slate-400' : 'text-emerald-500'}`}></i> {estaBloqueada ? 'Asistencia (Solo Lectura)' : 'Asistencia Completada'}</h3>{estaBloqueada ? (<span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase">Bloqueada</span>) : (<span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">TUYA</span>)}</div>
                                <div className="flex justify-around text-center mb-6"><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-emerald-500'}`}>{asistenciaHoy.totales.presentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Presentes</p></div><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-rose-500'}`}>{asistenciaHoy.totales.ausentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ausentes</p></div><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-amber-500'}`}>{asistenciaHoy.totales.permisos}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Permisos</p></div></div>
                                <div className={`pt-4 border-t ${estaBloqueada ? 'border-slate-200' : 'border-slate-50'}`}>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2"><span>Material: Parte {progInicio.parte} • {progInicio.impartidas}/25</span><span className="text-indigo-400">{progInicio.porc}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className="bg-indigo-400 h-1.5 rounded-full" style={{width: `${progInicio.porc}%`}}></div></div>
                                </div>
                            </>
                        ) : (<><div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><div className="flex items-center space-x-4 relative z-10"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm animate-pulse"><i className="fas fa-clipboard-list"></i></div><div><h3 className="font-bold text-xl">Tomar Asistencia</h3><p className="text-rose-100 text-xs">Aún no registras el día de hoy</p></div></div></>)}
                    </div>
                    <div className="w-full bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex justify-between items-center relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><div className="relative z-10"><p className="text-xs font-bold uppercase opacity-70 tracking-widest">Niños Totales</p><p className="text-5xl font-black tracking-tighter mt-1">{alumnos.length}</p></div><div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-users"></i></div></div>
                </div>
            );
        }

        if (vistaActual === 'asistencia') { 
            if (alumnos.length === 0) {
                contenidoMaestro = (
                    <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                        <div className="px-2 mb-4"><div><h2 className="text-2xl font-black text-slate-800">Pasar Lista</h2></div></div>
                        <div className="flex-1 bg-white rounded-t-[40px] shadow-lg border-t border-slate-100 p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm animate-pulse"><i className="fas fa-user-slash"></i></div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">Salón Vacío</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">Debes registrar al menos un alumno en tu campo antes de poder impartir una lección y tomar la asistencia.</p>
                            <button onClick={() => setVistaActual('gestion')} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all"><i className="fas fa-plus mr-2"></i>Ir a Registrar</button>
                        </div>
                    </div>
                );
            } else if (estaBloqueada) {
                contenidoMaestro = <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in"><div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner"><i className="fas fa-lock"></i></div><h3 className="text-2xl font-black text-slate-700 mb-2">Acceso Bloqueado</h3><p className="text-slate-500 text-sm leading-relaxed">La asistencia de hoy ya fue registrada por <b>{asistenciaHoy?.maestro}</b>.</p></div>;
            } else {
                contenidoMaestro = (
                    <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center space-x-4 mb-4 px-2"><div><h2 className="text-2xl font-black text-slate-800">Pasar Lista</h2><p className="text-slate-400 text-xs">{new Date().toLocaleDateString()}</p></div></div>
                        <div className="flex-1 bg-white rounded-t-[40px] shadow-lg border-t border-slate-100 p-6 overflow-hidden flex flex-col relative">
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-4 flex-shrink-0">
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-3 flex items-center"><i className="fas fa-book mr-2"></i> Material de Clase</h3>
                                <div className="flex space-x-4 items-center">
                                    <div className="w-1/3"><label className="text-[10px] font-bold text-indigo-400 uppercase ml-1 block mb-1">Lección N°</label><input type="number" className="w-full p-3 bg-white rounded-xl outline-none border border-indigo-100 focus:border-indigo-400 text-center font-black text-indigo-600 text-lg shadow-sm" value={leccionActual} onChange={e=>setLeccionActual(e.target.value)} placeholder="0" /></div>
                                    <div className="w-2/3"><label className="text-[10px] font-bold text-indigo-400 uppercase ml-1 block mb-1">¿Se impartió hoy?</label><div className="flex space-x-2"><button onClick={() => setLeccionImpartida(true)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${leccionImpartida ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-400 hover:bg-indigo-100'}`}>Sí ✅</button><button onClick={() => setLeccionImpartida(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${!leccionImpartida ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-indigo-100 text-indigo-400 hover:bg-indigo-100'}`}>No ❌</button></div></div>
                                </div>
                            </div>
                            <div className="overflow-y-auto space-y-4 pb-28 pr-2">
                                {alumnos.map(a => (<div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center space-x-3 w-1/3"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm font-bold">{a.nombre.charAt(0)}</div><p className="font-bold text-slate-700 text-sm truncate">{a.nombre.split(' ')[0]}</p></div><div className="flex space-x-2 flex-1 justify-end"><button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Presente'})} className={`w-10 h-10 rounded-xl text-xs font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Presente' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>P</button><button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Ausente'})} className={`w-10 h-10 rounded-xl text-xs font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Ausente' ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>A</button><button onClick={() => setListaAsistencia({...listaAsistencia, [a.id]: 'Permiso'})} className={`w-12 h-10 rounded-xl text-[10px] font-bold uppercase transition-all ${listaAsistencia[a.id] === 'Permiso' ? 'bg-amber-400 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>PER</button></div></div>))}
                            </div>
                            <div className="absolute bottom-6 left-6 right-6"><button onClick={guardarLista} className="w-full bg-indigo-600 p-4 rounded-2xl text-white font-black shadow-xl active:scale-95 transition-all text-lg">Guardar Asistencia</button></div>
                        </div>
                    </div>
                ); 
            }
        }

        if (vistaActual === 'gestion') {
            contenidoMaestro = (
                <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                    <div className="px-2 mb-6"><h2 className="text-2xl font-black text-slate-800">Directorio Alumnos</h2><p className="text-slate-400 text-xs">{alumnos.length} Registrados en tu campo</p></div>
                    <button onClick={onOpenAlumnoModal} className="w-full bg-emerald-500 p-5 rounded-[24px] shadow-lg shadow-emerald-200 active:scale-95 transition-all text-white flex items-center justify-between mb-6"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm"><i className="fas fa-plus"></i></div><span className="font-bold text-lg">Inscribir Nuevo</span></div><i className="fas fa-chevron-right opacity-50 text-xl"></i></button>
                    <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col"><div className="overflow-y-auto space-y-3 pb-24 pr-2">{alumnos.map(nino => (<div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center space-x-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${nino.genero === 'M' ? 'bg-sky-100 text-sky-600' : nino.genero === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-white text-slate-400 border border-slate-200'}`}>{nino.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{nino.nombre}</p><p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1"><i className="fas fa-birthday-cake mr-1 text-rose-300"></i>{nino.edad} Años <span className="mx-1 text-slate-300">|</span> <span className={nino.genero === 'M' ? 'text-sky-500' : 'text-pink-500'}>{nino.genero === 'M' ? 'Niño' : nino.genero === 'F' ? 'Niña' : '-'}</span></p></div></div><div className="flex space-x-2"><button onClick={() => onEditAlumno(nino)} className="text-indigo-400 w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"><i className="fas fa-edit"></i></button><button onClick={() => onDeleteAlumno(nino)} className="text-rose-400 w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"><i className="fas fa-trash"></i></button></div></div>))}</div></div>
                </div>
            );
        }

        if (vistaActual === 'reportes') {
            contenidoMaestro = (
                <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                    <div className="px-2 mb-4"><h2 className="text-2xl font-black text-slate-800">Reportes</h2><p className="text-slate-400 text-xs">Análisis y estadísticas de tu clase</p></div>
                    
                    <div className="flex px-2 space-x-2 mb-4">
                        <button onClick={() => setSubVistaReporte('ranking')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaReporte === 'ranking' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-trophy mr-2"></i>Ranking</button>
                        <button onClick={() => setSubVistaReporte('historial')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaReporte === 'historial' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-history mr-2"></i>Clases</button>
                        <button onClick={() => setSubVistaReporte('filtro')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaReporte === 'filtro' ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-filter mr-2"></i>Edades</button>
                    </div>

                    <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col">
                        
                        {subVistaReporte === 'ranking' && (
                            <>
                                <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center justify-between">Top Asistencia<span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase tracking-widest">{historialRankingFiltrado.length} clases</span></h3>
                                <div className="bg-amber-50 p-3 rounded-2xl mb-4 border border-amber-100 flex space-x-3"><div className="w-1/2"><label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Desde</label><input type="date" className="w-full p-2 mt-1 bg-white rounded-xl outline-none text-xs font-bold text-slate-600 border border-amber-100" value={fechaInicioRanking} onChange={e=>setFechaInicioRanking(e.target.value)} /></div><div className="w-1/2"><label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Hasta</label><input type="date" className="w-full p-2 mt-1 bg-white rounded-xl outline-none text-xs font-bold text-slate-600 border border-amber-100" value={fechaFinRanking} onChange={e=>setFechaFinRanking(e.target.value)} /></div></div>
                                <div className="overflow-y-auto space-y-3 pb-24 pr-2">
                                    {rankingOrdenado.map((nino, index) => (
                                        <div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center space-x-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-300 border border-slate-200'}`}>#{index + 1}</div><p className="font-bold text-slate-700 text-sm">{nino.nombre.split(' ')[0]}</p></div><span className="bg-emerald-50 text-emerald-600 font-black text-xs px-3 py-1.5 rounded-lg border border-emerald-100"><i className="fas fa-star mr-1"></i>{nino.asistenciasLogradas} Clases</span></div>
                                    ))}
                                </div>
                            </>
                        )}

                        {subVistaReporte === 'historial' && (
                            <>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">Días Anteriores (Solo Lectura)</h3>
                                <div className="overflow-y-auto space-y-3 pb-24 pr-2">
                                    {historialVisible.length === 0 ? <p className="text-center text-slate-400 text-sm italic mt-8">Sin registros previos.</p> : 
                                    historialVisible.map((h, i) => (
                                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div><p className="font-bold text-slate-700 text-sm">{formatoFecha(h.fecha)}</p><p className="text-[9px] text-slate-400 uppercase mt-1">Por: {h.maestro}</p>{h.leccion && (<p className={`text-[10px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}><i className="fas fa-book-open mr-1"></i>Lección {h.leccion} {h.leccionImpartida ? '✅' : '❌'}</p>)}</div>
                                            <div className="flex flex-col space-y-1"><div className="flex space-x-1 text-[10px] font-bold"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">P: {h.totales?.presentes||0}</span><span className="bg-rose-100 text-rose-700 px-2 py-1 rounded">A: {h.totales?.ausentes||0}</span></div></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {subVistaReporte === 'filtro' && (
                            <>
                                <div className="flex space-x-4 mb-5"><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Edad Mínima</label><input type="number" placeholder="Ej: 0" className="w-full p-4 mt-1 bg-sky-50 rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-xl font-black text-slate-700 text-center" value={edadMin} onChange={e=>setEdadMin(e.target.value)} /></div><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Edad Máxima</label><input type="number" placeholder="Ej: 5" className="w-full p-4 mt-1 bg-sky-50 rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-xl font-black text-slate-700 text-center" value={edadMax} onChange={e=>setEdadMax(e.target.value)} /></div></div>
                                {(edadMin !== '' || edadMax !== '') && (<div className="flex justify-around items-center bg-sky-600 p-4 rounded-2xl shadow-sm mb-4"><div className="text-center"><p className="text-3xl font-black text-white">{alumnosFiltrados.length}</p><p className="text-[9px] font-bold text-sky-200 uppercase tracking-widest">Total</p></div><div className="text-center"><p className="text-2xl font-black text-white">{alumnosFiltrados.filter(a=>a.genero==='M').length}</p><p className="text-[9px] font-bold text-sky-200 uppercase tracking-widest">Niños</p></div><div className="text-center"><p className="text-2xl font-black text-white">{alumnosFiltrados.filter(a=>a.genero==='F').length}</p><p className="text-[9px] font-bold text-sky-200 uppercase tracking-widest">Niñas</p></div></div>)}
                                <div className="overflow-y-auto space-y-3 pb-24 pr-2">
                                    {alumnosFiltrados.map(nino => (
                                        <div key={nino.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100"><div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${nino.genero === 'M' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'}`}>{nino.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-xs">{nino.nombre}</p><p className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">{nino.edad} Años</p></div></div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <>
                {contenidoMaestro}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-slate-100 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <NavButton id="inicio" icon="fa-home" label="Resumen" />
                    <NavButton id="asistencia" icon="fa-clipboard-check" label="Lista" />
                    <NavButton id="gestion" icon="fa-users" label="Alumnos" />
                    <NavButton id="reportes" icon="fa-chart-bar" label="Reportes" />
                </div>
            </>
        );
    }

    return null;
}

window.DashboardView = DashboardView;
