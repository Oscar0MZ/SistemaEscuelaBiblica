const { useState } = React;

function AdminDashboard({
    maestros, todosLosAlumnos, datosGlobalesAsistencia, historialAsistencias, entregasLogistica,
    mantenimiento, onToggleMantenimiento, onApprove, onDelete, onToggleModal, 
    onDeleteCampo, onResetLecciones, onCrearEntrega, onBorrarEntrega, onAssignGroup
}) {
    const [busqueda, setBusqueda] = useState('');
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    // ESTADOS ADMIN
    const [expandirFiltroAdmin, setExpandirFiltroAdmin] = useState(false);
    const [campoExpandido, setCampoExpandido] = useState(null); 
    const [campoResetUI, setCampoResetUI] = useState(null);
    const [subVistaAdminLogistica, setSubVistaAdminLogistica] = useState('misiones'); 
    const [edadMin, setEdadMin] = useState('');
    const [edadMax, setEdadMax] = useState('');

    // NUEVO: Array para capturar los campos que el admin selecciona para la Ruta
    const [camposRuta, setCamposRuta] = useState([]);

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

    const NavButton = ({ id, icon, label, width = 'w-[75px]' }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center ${width} h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[9px] tracking-wide">{label}</span>
        </button>
    );

    const pendientes = maestros.filter(m => m.estado === 'Pendiente');
    const activos = maestros.filter(m => m.estado === 'Activo');
    const listaAdminVisible = maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (m.campo && m.campo.toLowerCase().includes(busqueda.toLowerCase())));
    
    const camposActivos = [...new Set([
        ...maestros.filter(m => m.clase !== 'LOGISTICA' && m.campo).map(m => m.campo),
        ...todosLosAlumnos.map(a => a.campo),
        ...historialVisible.map(h => h.campo)
    ].filter(Boolean))].sort();

    const camposFijos = ["La Isla", "Las Delicias", "El Amatal", "El Manguito", "Buenos Aires", "Corozal #1", "El Porvenir", "El Caulote", "Corozal #2", "Valle Encantado", "La Playa"];

    // FUNCIÓN PARA EL CHECKBOX MULTIPLE DE RUTAS
    const toggleCampoRuta = (c) => {
        if(camposRuta.includes(c)) setCamposRuta(camposRuta.filter(x => x !== c));
        else setCamposRuta([...camposRuta, c]);
    };

    // EVITAR EL SUBMIT POR DEFECTO PARA ENVIAR EL ARRAY
    const submitMision = (e) => {
        e.preventDefault();
        if(camposRuta.length === 0) {
            alert("⚠️ Debes seleccionar al menos un campo para armar la ruta.");
            return;
        }
        const fd = new FormData(e.target);
        onCrearEntrega({
            campos: camposRuta,
            cantidad: parseInt(fd.get('cantidad')),
            grupo: fd.get('grupo')
        });
        setCamposRuta([]); // Limpiar selección
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
                                const histCampo = historialVisible.find(h => h.campo === campo && h.leccion !== undefined); 
                                const resetCampo = historialAsistencias.find(h => h.campo === campo && h.esReset); 
                                
                                let ultimaLec = 0;
                                if (histCampo && resetCampo) { ultimaLec = histCampo.timestamp > resetCampo.timestamp ? parseInt(histCampo.leccion) : parseInt(resetCampo.leccion); } 
                                else if (histCampo) { ultimaLec = parseInt(histCampo.leccion); } 
                                else if (resetCampo) { ultimaLec = parseInt(resetCampo.leccion); }

                                const prog = calcProgreso(ultimaLec);
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

        contenidoAdmin = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 h-full flex flex-col">
                <div className="px-2 mb-2"><h2 className="text-2xl font-black text-slate-800">Logística</h2><p className="text-slate-400 text-xs">Administración de rutas y equipos</p></div>
                
                <div className="flex px-2 space-x-2 mb-2">
                    <button onClick={() => setSubVistaAdminLogistica('misiones')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaAdminLogistica === 'misiones' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-route mr-2"></i>Rutas</button>
                    <button onClick={() => setSubVistaAdminLogistica('equipos')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subVistaAdminLogistica === 'equipos' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}><i className="fas fa-users-cog mr-2"></i>Equipos</button>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    {subVistaAdminLogistica === 'misiones' ? (
                        <>
                            <form onSubmit={submitMision} className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm mx-1">
                                <h3 className="font-bold text-amber-800 text-sm mb-4 flex items-center"><i className="fas fa-map-marked-alt mr-2"></i> Crear Ruta de Reparto</h3>
                                <div className="space-y-4">
                                    
                                    {/* GRID DE MULTIPLES CAMPOS */}
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

                                    {/* CANTIDAD Y GRUPO */}
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-700 uppercase mb-2">2. Asigna Cantidad y Equipo:</p>
                                        <div className="flex space-x-3">
                                            <div className="w-1/2">
                                                <input type="number" name="cantidad" required placeholder="Total Víveres" className="w-full p-4 bg-white rounded-2xl outline-none border border-amber-100 text-sm font-bold text-slate-700 text-center shadow-sm" />
                                            </div>
                                            <div className="w-1/2">
                                                <select name="grupo" required className="w-full p-4 bg-white rounded-2xl outline-none border border-amber-100 text-sm font-bold text-slate-700 shadow-sm">
                                                    <option value="">¿A qué Grupo?</option>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                        <option key={n} value={`Grupo ${n}`}>Grupo {n}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all mt-2">
                                        Confirmar Ruta
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 px-1">
                                {entregasPendientes.length > 0 && (
                                    <div className="mb-6"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Rutas Pendientes ({entregasPendientes.length})</h4>
                                    <div className="space-y-3">
                                        {entregasPendientes.map(e => (
                                            <div key={e.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-amber-400 shadow-sm flex justify-between items-center">
                                                <div className="w-3/4 pr-2">
                                                    <p className="font-black text-slate-800 text-sm mb-1">{e.grupo}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed"><i className="fas fa-map-marker-alt mr-1 text-amber-500"></i> {e.campos ? e.campos.join(', ') : e.campo}</p>
                                                    <p className="text-xs text-indigo-500 font-bold mt-2"><i className="fas fa-box mr-1"></i>{e.cantidad} Paquetes en total</p>
                                                </div>
                                                <button onClick={() => onBorrarEntrega(e.id)} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors flex-shrink-0"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        ))}
                                    </div></div>
                                )}
                                {entregasCompletadas.length > 0 && (
                                    <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Completadas Hoy</h4><div className="space-y-3 opacity-60">{entregasCompletadas.slice(0, 5).map(e => (<div key={e.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center"><div><p className="font-bold text-slate-700 line-through decoration-slate-300">Ruta Entregada</p><p className="text-[10px] text-slate-400 mt-1 uppercase">Por {e.grupo}</p></div><span className="text-emerald-500 font-bold text-sm"><i className="fas fa-check-circle"></i></span></div>))}</div></div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="px-1 animate-in slide-in-from-right duration-200">
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
