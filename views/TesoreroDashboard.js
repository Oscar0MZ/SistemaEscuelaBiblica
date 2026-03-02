const { useState } = React;

function TesoreroDashboard({
    fondoTotal, historialIngresos, onGuardarIngreso
}) {
    const [vistaActual, setVistaActual] = useState('inicio'); 
    
    // Estados para el formulario de nuevo ingreso
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [cargando, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const exito = await onGuardarIngreso(monto, descripcion);
        if (exito) {
            setMonto('');
            setDescripcion('');
            setVistaActual('historial'); // Lo manda al historial para que vea que se guardó
        }
        setLoading(false);
    };

    const formatoFecha = (f) => {
        if (!f) return '';
        const p = f.split('-');
        if (p.length !== 3) return f;
        return `${p[2]}/${p[1]}/${p[0]}`; 
    };

    const NavButton = ({ id, icon, label }) => (
        <button onClick={() => setVistaActual(id)} className={`flex flex-col items-center justify-center w-[120px] h-14 rounded-2xl transition-all ${vistaActual === id ? 'text-amber-600 bg-amber-50 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`}>
            <i className={`fas ${icon} text-xl mb-1 ${vistaActual === id ? 'animate-bounce' : ''}`}></i><span className="text-[10px] tracking-wide">{label}</span>
        </button>
    );

    let contenido;

    if (vistaActual === 'inicio') {
        contenido = (
            <div className="space-y-6 animate-in fade-in duration-300 pt-2 pb-24">
                
                {/* TARJETA DEL FONDO GENERAL */}
                <div className="bg-slate-800 p-8 rounded-[32px] text-white shadow-2xl mx-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-bl-[100px] pointer-events-none"></div>
                    <div className="relative z-10 text-center">
                        <p className="text-xs font-bold uppercase opacity-70 tracking-widest mb-2 flex items-center justify-center"><i className="fas fa-vault mr-2 text-amber-400"></i> Fondo General Activo</p>
                        <p className="text-6xl font-black tracking-tighter text-amber-400">
                            ${Number(fondoTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                    </div>
                </div>

                {/* FORMULARIO PARA AGREGAR NUEVO INGRESO */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mx-1">
                    <h3 className="font-black text-slate-700 text-lg mb-1"><i className="fas fa-plus-circle text-emerald-500 mr-2"></i>Registrar Nuevo Ingreso</h3>
                    <p className="text-xs text-slate-400 mb-6">Agrega las ofrendas mensuales o ingresos extra.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Monto a ingresar ($)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-4 text-slate-400 font-black text-lg">$</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0.01" 
                                    required
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00" 
                                    className="w-full py-4 pl-9 pr-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-xl font-black text-slate-700 transition-all" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Descripción / Motivo</label>
                            <input 
                                type="text" 
                                required
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Ej: Ofrenda mensual de Octubre" 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-bold text-slate-700 transition-all" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={cargando}
                            className={`w-full py-4 mt-2 rounded-2xl font-black text-white shadow-xl transition-all ${cargando ? 'bg-slate-400' : 'bg-amber-500 hover:bg-amber-600 active:scale-95 shadow-amber-200'}`}
                        >
                            {cargando ? 'Guardando...' : 'Guardar Ingreso al Fondo'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (vistaActual === 'historial') {
        contenido = (
            <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-2 pb-24">
                <div className="px-2 mb-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Historial</h2>
                        <p className="text-slate-400 text-xs mt-1">Todos los ingresos registrados</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Fondo</p>
                        <p className="font-black text-amber-500 text-xl">${Number(fondoTotal).toFixed(2)}</p>
                    </div>
                </div>
                
                <div className="space-y-3 px-1">
                    {historialIngresos.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 rounded-[32px] mt-4 border-2 border-dashed border-slate-200">
                            <i className="fas fa-receipt text-3xl text-slate-300 mb-3"></i>
                            <p className="text-sm font-bold text-slate-500">Aún no has registrado ingresos.</p>
                        </div>
                    ) : (
                        historialIngresos.map((ingreso) => {
                            const fechaObj = new Date(ingreso.timestamp);
                            const hora = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                            return (
                                <div key={ingreso.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                                    <div className="pl-2 w-2/3">
                                        <p className="font-black text-slate-700 text-sm truncate">{ingreso.descripcion}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-bold">
                                            <i className="far fa-calendar-alt mr-1 text-amber-400"></i> 
                                            {formatoFecha(ingreso.fecha)} a las {hora}
                                        </p>
                                    </div>
                                    <div className="text-right w-1/3">
                                        <p className="font-black text-emerald-500 text-lg">+ ${Number(ingreso.monto).toFixed(2)}</p>
                                    </div>
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
                <NavButton id="inicio" icon="fa-vault" label="Fondo" />
                <NavButton id="historial" icon="fa-receipt" label="Historial" />
            </div>
        </>
    );
}

window.TesoreroDashboard = TesoreroDashboard;
