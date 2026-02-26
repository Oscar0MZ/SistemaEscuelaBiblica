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
    onEdit, onDelete, onApprove, onToggleModal, 
    onOpenAlumnoModal, onEditAlumno, onDeleteAlumno, onSaveAsistencia 
}) {
    const esAdmin = usuario === 'ADMIN';
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState('inicio'); 
    const [listaAsistencia, setListaAsistencia] = useState({});

    // ESTADOS ADMIN
    const [expandirPoblacion, setExpandirPoblacion] = useState(false);
    const [expandirPersonal, setExpandirPersonal] = useState(false);
    const [expandirFiltroAdmin, setExpandirFiltroAdmin] = useState(false);
    const [campoHistorialExp, setCampoHistorialExp] = useState(null); 

    // ESTADOS MAESTRO
    const [subVistaReporte, setSubVistaReporte] = useState('ranking');
    const [fechaInicioRanking, setFechaInicioRanking] = useState('');
    const [fechaFinRanking, setFechaFinRanking] = useState('');
    
    // NUEVOS ESTADOS: MATERIAL DE CLASE (LECCIÓN)
    const [leccionActual, setLeccionActual] = useState('');
    const [leccionImpartida, setLeccionImpartida] = useState(true);

    const [edadMin, setEdadMin] = useState('');
    const [edadMax, setEdadMax] = useState('');

    const { registros: todasAsistencias, rango } = datosGlobalesAsistencia;
    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };
    const textoFechas = rango ? `${formatoFecha(rango.inicio).substring(0,5)} - ${formatoFecha(rango.fin).substring(0,5)}` : 'Calculando...';

    // AUTO-CARGAR ESTADOS AL ENTRAR A ASISTENCIA
    React.useEffect(() => {
        if (vistaActual === 'asistencia' && alumnos.length > 0) {
            const inicial = {};
            if (asistenciaHoy && asistenciaHoy.registros) {
                asistenciaHoy.registros.forEach(r => inicial[r.idAlumno] = r.estado);
                // Si ya tomó asistencia hoy, carga lo que puso
                setLeccionActual(asistenciaHoy.leccion || '');
                setLeccionImpartida(asistenciaHoy.leccionImpartida !== false);
            } else {
                alumnos.forEach(a => inicial[a.id] = 'Presente');
                
                // LÓGICA DE AUTOINCREMENTO DE LECCIÓN
                if (historialAsistencias && historialAsistencias.length > 0) {
                    const ultimo = historialAsistencias[0]; // El historial está ordenado del más reciente al más antiguo
                    if (ultimo && ultimo.leccion) {
                        // Si la última se impartió, toca la siguiente. Si no se impartió, toca repetir.
                        setLeccionActual(ultimo.leccionImpartida ? parseInt(ultimo.leccion) + 1 : parseInt(ultimo.leccion));
                    }
                } else {
                    setLeccionActual(''); // Es su primera vez
                }
                setLeccionImpartida(true);
            }
            setListaAsistencia(inicial);
        }
    }, [vistaActual, alumnos, asistenciaHoy, historialAsistencias]);

    const guardarLista = async () => {
        if (!leccionActual) {
            alert("Por favor, ingresa el número de la lección antes de guardar.");
            return;
        }
        const registros = alumnos.map(a => ({ idAlumno: a.id, nombre: a.nombre, estado: listaAsistencia[a.id] || 'Ausente' }));
        // Enviamos los nuevos datos de la lección
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
        const camposDisponibles = [...new Set(todosLosAlumnos.map(a => a.campo || 'Sin Campo'))].sort();

        let contenidoAdmin;

        if (vistaActual === 'inicio') {
            let tp = 0, ta = 0, tperm = 0; todasAsistencias.forEach(r => { if(r.totales){ tp+=r.totales.presentes; ta+=r.totales.ausentes; tperm+=r.totales.permisos; } });
            contenidoAdmin = (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {pendientes.length > 0 && (<div className="bg-amber-50 border border-amber-100 p-5 rounded-[32px]"><h3 className="text-amber-800 font-bold text-sm mb-3"><i className="fas fa-user-clock mr-2"></i> Solicitudes ({pendientes.length})</h3><div className="space-y-3">{pendientes.map(p => (<div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-amber-100"><div><p className="font-bold text-slate-700 text-sm">{p.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{p.clase} - {p.campo}</span></div><div className="flex space-x-2"><button onClick={() => onApprove(p.id)} className="w-9 h-9 bg-emerald-500 text-white rounded-xl"><i className="fas fa-check"></i></button><button onClick={() => onDelete(p)} className="w-9 h-9 bg-rose-100 text-rose-500 rounded-xl"><i className="fas fa-times"></i></button></div></div>))}</div></div>)}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm"><div className="flex justify-between items-center mb-4"><div><h3 className="font-bold text-slate-700 text-sm flex items-center"><i className="fas fa-clipboard-check text-emerald-500 mr-2"></i> Asistencia Global</h3><p className="text-[10px] text-slate-400 pl-6">Acumulado Semanal</p></div><span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg border border-slate-200">{textoFechas}</span></div><div className="flex justify-around text-center divide-x divide-slate-50"><div className="px-2"><p className="text-3xl font-black text-emerald-500">{tp}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Presentes</p></div><div className="px-2"><p className="text-3xl font-black text-rose-500">{ta}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ausentes</p></div><div className="px-2"><p className="text-3xl font-black text-amber-500">{tperm}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Permisos</p></div></div></div>
                    <div className="grid grid-cols-2 gap-4"><div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between h-40 relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><p className="text-xs font-bold uppercase opacity-70 tracking-widest">Personal Activo</p><div><p className="text-5xl font-black tracking-tighter">{activos.length}</p><p className="text-[10px] opacity-70 mt-1">Miembros Totales</p></div></div><button onClick={onToggleModal} className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col justify-between h-40 text-left shadow-sm group hover:shadow-md transition-all active:scale-95"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i className="fas fa-plus"></i></div><div><p className="font-bold text-slate-700 text-lg leading-tight">Inscribir<br/>Personal</p><p className="text-[10px] text-slate-400 mt-1">Manual</p></div></button></div>
                </div>
            );
        }

        if (vistaActual === 'poblacion') {
            const adminAlumnosFiltrados = todosLosAlumnos.filter(a => {
                if (edadMin !== '' && a.edad < parseInt(edadMin)) return false;
                if (edadMax !== '' && a.edad > parseInt(edadMax)) return false;
                return true;
            });
            const adminTotalNinos = adminAlumnosFiltrados.filter(a => a.genero === 'M').length;
            const adminTotalNinas = adminAlumnosFiltrados.filter(a => a.genero === 'F').length;
            const filtroActivo = edadMin !== '' || edadMax !== '';

            contenidoAdmin = (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Población y Filtros</h2><p className="text-slate-400 text-xs">Análisis demográfico de la red</p></div>
                    <div className="bg-sky-50 rounded-[32px] p-6 shadow-sm border border-sky-100">
                        <h3 className="font-bold text-sky-800 text-sm mb-4 flex items-center"><i className="fas fa-filter mr-2"></i> Rango de Edades</h3>
                        <div className="flex space-x-4"><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Mínima (Años)</label><input type="number" placeholder="Ej: 0" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMin} onChange={e=>setEdadMin(e.target.value)} /></div><div className="w-1/2"><label className="text-[10px] font-bold text-sky-600 uppercase ml-2">Máxima (Años)</label><input type="number" placeholder="Ej: 5" className="w-full p-4 mt-1 bg-white rounded-2xl outline-none border border-sky-100 focus:ring-2 focus:ring-sky-300 text-lg font-bold" value={edadMax} onChange={e=>setEdadMax(e.target.value)} /></div></div>
                        <div className="flex justify-around items-center bg-white p-4 rounded-2xl mt-4 shadow-sm"><div className="text-center"><p className="text-3xl font-black text-sky-600">{adminAlumnosFiltrados.length}</p><p className="text-[9px] font-bold text-sky-500 uppercase">Total Red</p></div><div className="w-px h-10 bg-slate-100"></div><div className="text-center"><p className="text-2xl font-black text-indigo-500">{adminTotalNinos}</p><p className="text-[9px] font-bold text-indigo-400 uppercase">Niños (M)</p></div><div className="w-px h-10 bg-slate-100"></div><div className="text-center"><p className="text-2xl font-black text-pink-500">{adminTotalNinas}</p><p className="text-[9px] font-bold text-pink-400 uppercase">Niñas (F)</p></div></div>
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm mt-6 px-2">Desglose por Campo</h3>
                    <div className="space-y-3 pb-24">
                        {camposDisponibles.map(campo => {
                            if (filtroActivo) {
                                const alumnosCampo = adminAlumnosFiltrados.filter(a => a.campo === campo);
                                const total = alumnosCampo.length; const ninos = alumnosCampo.filter(a => a.genero === 'M').length; const ninas = alumnosCampo.filter(a => a.genero === 'F').length;
                                if (total === 0) return null; 
                                return (<div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><span className="font-bold text-slate-700 text-sm">{campo}</span><div className="flex space-x-2 text-xs font-bold"><span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">T: {total}</span><span className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg">M: {ninos}</span><span className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg">F: {ninas}</span></div></div>);
                            } else {
                                const total = todosLosAlumnos.filter(a => a.campo === campo).length; const rc = todasAsistencias.filter(a => a.campo === campo);
                                let p = 0, a = 0, perm = 0; rc.forEach(r => { p += r.totales.presentes; a += r.totales.ausentes; perm += r.totales.permisos; });
                                return (<div key={campo} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-3"><span className="font-bold text-slate-700 text-sm">{campo}</span><span className="bg-indigo-50 text-indigo-600 font-black text-xs px-3 py-1 rounded-lg">{total} Niños</span></div>{rc.length > 0 ? (<div className="flex space-x-2"><span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-bold">P: {p}</span><span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-lg font-bold">A: {a}</span><span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-bold">Perm: {perm}</span></div>) : <p className="text-[10px] text-slate-400 italic"><i className="fas fa-clock mr-1"></i> Sin asistencia registrada</p>}</div>);
                            }
                        })}
                    </div>
                </div>
            );
        }

        if (vistaActual === 'historial') {
            const camposConHistorial = [...new Set(historialAsistencias.map(h => h.campo))].sort();

            contenidoAdmin = (
                <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                    <div className="px-2 mb-2">
                        <h2 className="text-2xl font-black text-slate-800">Historial Anual</h2>
                        <p className="text-slate-400 text-xs">Asistencias y lecciones agrupadas por campo ({new Date().getFullYear()})</p>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-2">
                        {camposConHistorial.length === 0 ? (
                            <div className="text-center p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 mt-4"><i className="fas fa-folder-open text-4xl text-slate-300 mb-2"></i><p className="text-sm font-bold text-slate-500">Historial vacío</p></div>
                        ) : (
                            camposConHistorial.map(campo => {
                                const registrosCampo = historialAsistencias.filter(h => h.campo === campo);
                                const isExpanded = campoHistorialExp === campo;
                                
                                return (
                                    <div key={campo} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                        <button onClick={() => setCampoHistorialExp(isExpanded ? null : campo)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3"><i className="fas fa-map-marker-alt"></i></div>
                                                <div className="text-left"><h3 className="font-bold text-slate-700 text-sm">{campo}</h3><p className="text-[10px] text-slate-400">{registrosCampo.length} clases impartidas</p></div>
                                            </div>
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
                                                                {/* MOSTRAR LECCIÓN EN ADMIN */}
                                                                {h.leccion && (
                                                                    <p className={`text-[10px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}>
                                                                        <i className="fas fa-book-open mr-1"></i>Lección {h.leccion} {h.leccionImpartida ? '✅' : '❌'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex space-x-1 text-[10px] font-bold">
                                                                <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">P: {h.totales?.presentes || 0}</span>
                                                                <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">A: {h.totales?.ausentes || 0}</span>
                                                                <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">PE: {h.totales?.permisos || 0}</span>
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

        if (vistaActual === 'personal') {
            contenidoAdmin = (
                <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                    <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Directorio Personal</h2><p className="text-slate-400 text-xs">{activos.length} Miembros Activos</p></div>
                    <div className="flex items-center bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100"><i className="fas fa-search text-slate-300 mr-3 text-lg"></i><input type="text" placeholder="Buscar por nombre o campo..." className="bg-transparent w-full outline-none text-sm font-bold text-slate-700" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-2 mt-4">
                        {listaAdminVisible.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-colors"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">{m.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{m.nombre}</p><span className="text-[10px] text-slate-400 font-bold uppercase">{m.clase} - {m.campo || 'N/A'}</span></div></div><div className="flex space-x-2"><button onClick={() => onEdit(m)} className="text-indigo-400 w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"><i className="fas fa-edit"></i></button><button onClick={() => onDelete(m)} className="text-rose-400 w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"><i className="fas fa-trash"></i></button></div></div>
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
                    <NavButton id="poblacion" icon="fa-chart-pie" label="Población" />
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

        // 1. FILTRADO DE FECHAS (RANKING)
        const historialRankingFiltrado = historialAsistencias.filter(ha => {
            if (!fechaInicioRanking && !fechaFinRanking) return true;
            const f = ha.fecha; // Formato YYYY-MM-DD
            if (fechaInicioRanking && f < fechaInicioRanking) return false;
            if (fechaFinRanking && f > fechaFinRanking) return false;
            return true;
        });

        // 2. CÁLCULO DE RANKING
        const alumnosConRanking = alumnos.map(a => {
            let asistenciasLogradas = 0;
            historialRankingFiltrado.forEach(ha => {
                const registroAlumno = ha.registros?.find(r => r.idAlumno === a.id);
                if (registroAlumno && registroAlumno.estado === 'Presente') asistenciasLogradas++;
            });
            return { ...a, asistenciasLogradas };
        });

        const rankingOrdenado = [...alumnosConRanking].sort((a,b) => b.asistenciasLogradas - a.asistenciasLogradas);

        // 3. FILTRADO DEMOGRÁFICO
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
                            <><div className="flex justify-between items-center mb-6"><h3 className={`font-bold text-sm flex items-center ${estaBloqueada ? 'text-slate-500' : 'text-slate-700'}`}><i className={`fas ${estaBloqueada ? 'fa-lock' : 'fa-clipboard-check'} mr-2 text-lg ${estaBloqueada ? 'text-slate-400' : 'text-emerald-500'}`}></i> {estaBloqueada ? 'Asistencia (Solo Lectura)' : 'Asistencia Completada'}</h3>{estaBloqueada ? (<span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase">Bloqueada</span>) : (<span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">TUYA</span>)}</div><div className="flex justify-around text-center"><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-emerald-500'}`}>{asistenciaHoy.totales.presentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Presentes</p></div><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-rose-500'}`}>{asistenciaHoy.totales.ausentes}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ausentes</p></div><div><p className={`text-3xl font-black ${estaBloqueada ? 'text-slate-500' : 'text-amber-500'}`}>{asistenciaHoy.totales.permisos}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Permisos</p></div></div><div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest bg-slate-100 p-2 rounded-xl">{estaBloqueada ? (<span className="text-slate-500"><i className="fas fa-info-circle mr-1"></i> Tomada por: {asistenciaHoy.maestro}</span>) : (<span className="text-indigo-500">Ve a 'Lista' para editar</span>)}</div></>
                        ) : (<><div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><div className="flex items-center space-x-4 relative z-10"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm animate-pulse"><i className="fas fa-clipboard-list"></i></div><div><h3 className="font-bold text-xl">Tomar Asistencia</h3><p className="text-rose-100 text-xs">Aún no registras el día de hoy</p></div></div></>)}
                    </div>
                    <div className="w-full bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 flex justify-between items-center relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-bl-[100px] pointer-events-none"></div><div className="relative z-10"><p className="text-xs font-bold uppercase opacity-70 tracking-widest">Niños Totales</p><p className="text-5xl font-black tracking-tighter mt-1">{alumnos.length}</p></div><div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm relative z-10"><i className="fas fa-users"></i></div></div>
                </div>
            );
        }

        // PANTALLA ASISTENCIA (CON MATERIAL DE CLASE)
        if (vistaActual === 'asistencia') { 
            if (estaBloqueada) {
                contenidoMaestro = <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in"><div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner"><i className="fas fa-lock"></i></div><h3 className="text-2xl font-black text-slate-700 mb-2">Acceso Bloqueado</h3><p className="text-slate-500 text-sm leading-relaxed">La asistencia de hoy ya fue registrada por <b>{asistenciaHoy?.maestro}</b>.</p></div>;
            } else {
                contenidoMaestro = (
                    <div className="flex flex-col h-full pt-4 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center space-x-4 mb-4 px-2"><div><h2 className="text-2xl font-black text-slate-800">Pasar Lista</h2><p className="text-slate-400 text-xs">{new Date().toLocaleDateString()}</p></div></div>
                        
                        <div className="flex-1 bg-white rounded-t-[40px] shadow-lg border-t border-slate-100 p-6 overflow-hidden flex flex-col relative">
                            {/* NUEVO: PANEL DE LECCIÓN */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 flex-shrink-0">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center"><i className="fas fa-book mr-2"></i> Material de Clase</h3>
                                <div className="flex space-x-4 items-center">
                                    <div className="w-1/3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Lección N°</label>
                                        <input type="number" className="w-full p-3 bg-white rounded-xl outline-none border border-slate-200 focus:border-indigo-400 text-center font-black text-indigo-600 text-lg shadow-sm" value={leccionActual} onChange={e=>setLeccionActual(e.target.value)} placeholder="Ej: 26" />
                                    </div>
                                    <div className="w-2/3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">¿Se impartió hoy?</label>
                                        <div className="flex space-x-2">
                                            <button onClick={() => setLeccionImpartida(true)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${leccionImpartida ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>Sí ✅</button>
                                            <button onClick={() => setLeccionImpartida(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${!leccionImpartida ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>No ❌</button>
                                        </div>
                                    </div>
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
                    <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 p-6 overflow-hidden flex flex-col"><div className="overflow-y-auto space-y-3 pb-24 pr-2">{alumnos.map(nino => (<div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex items-center space-x-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${nino.genero === 'M' ? 'bg-sky-100 text-sky-600' : nino.genero === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-white text-slate-400 border border-slate-200'}`}>{nino.nombre.charAt(0)}</div><div><p className="font-bold text-slate-700 text-sm">{nino.nombre}</p><p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1"><i className="fas fa-birthday-cake mr-1 text-rose-300"></i>{nino.edad} Años <span className="mx-1 text-slate-300">|</span> <span className={nino.genero === 'M' ? 'text-sky-500' : 'text-pink-500'}>{nino.genero === 'M' ? 'Niño' : nino.genero === 'F' ? 'Niña' : '-'}</span></p></div></div><div className="flex space-x-2"><button onClick={() => onEditAlumno(nino)} className="text-indigo-400 w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"><i className="fas fa-edit"></i></button><button onClick={() => onDeleteAlumno(nino.id)} className="text-rose-400 w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"><i className="fas fa-trash"></i></button></div></div>))}</div></div>
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
                                <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center justify-between">Top Asistencia<span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg uppercase tracking-widest">{historialRankingFiltrado.length} clases analizadas</span></h3>
                                
                                <div className="bg-amber-50 p-3 rounded-2xl mb-4 border border-amber-100 flex space-x-3">
                                    <div className="w-1/2"><label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Desde</label><input type="date" className="w-full p-2 mt-1 bg-white rounded-xl outline-none text-xs font-bold text-slate-600 border border-amber-100" value={fechaInicioRanking} onChange={e=>setFechaInicioRanking(e.target.value)} /></div>
                                    <div className="w-1/2"><label className="text-[9px] font-bold text-amber-700 uppercase ml-1">Hasta</label><input type="date" className="w-full p-2 mt-1 bg-white rounded-xl outline-none text-xs font-bold text-slate-600 border border-amber-100" value={fechaFinRanking} onChange={e=>setFechaFinRanking(e.target.value)} /></div>
                                </div>

                                <div className="overflow-y-auto space-y-3 pb-24 pr-2">
                                    {rankingOrdenado.map((nino, index) => (
                                        <div key={nino.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center space-x-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-300 border border-slate-200'}`}>#{index + 1}</div><p className="font-bold text-slate-700 text-sm">{nino.nombre.split(' ')[0]}</p></div>
                                            <span className="bg-emerald-50 text-emerald-600 font-black text-xs px-3 py-1.5 rounded-lg border border-emerald-100"><i className="fas fa-star mr-1"></i>{nino.asistenciasLogradas} Clases</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {subVistaReporte === 'historial' && (
                            <>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">Días Anteriores (Solo Lectura)</h3>
                                <div className="overflow-y-auto space-y-3 pb-24 pr-2">
                                    {historialAsistencias.length === 0 ? <p className="text-center text-slate-400 text-sm italic mt-8">Sin registros previos.</p> : 
                                    historialAsistencias.map((h, i) => (
                                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">{formatoFecha(h.fecha)}</p>
                                                <p className="text-[9px] text-slate-400 uppercase mt-1">Por: {h.maestro}</p>
                                                {/* NUEVO: MOSTRAR LECCIÓN EN MAESTRO */}
                                                {h.leccion && (
                                                    <p className={`text-[10px] font-bold mt-1 ${h.leccionImpartida ? 'text-indigo-500' : 'text-rose-500'}`}>
                                                        <i className="fas fa-book-open mr-1"></i>Lección {h.leccion} {h.leccionImpartida ? '✅' : '❌'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex space-x-1 text-[10px] font-bold"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">P: {h.totales?.presentes||0}</span><span className="bg-rose-100 text-rose-700 px-2 py-1 rounded">A: {h.totales?.ausentes||0}</span></div>
                                            </div>
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
