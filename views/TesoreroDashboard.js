function TesoreroDashboard(props) {
    return (
        <div className="flex flex-col min-h-[100dvh] bg-slate-50 relative">
            <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">
                    <i className="fas fa-hammer"></i>
                </div>
                <h2 className="text-3xl font-black text-slate-700 mb-4">Área en Construcción</h2>
                <p className="text-slate-500 text-base leading-relaxed bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    El administrador o director está trabajando en tu nueva interfaz.<br/><br/> ¡Pronto estarán disponibles tus funciones financieras!
                </p>
            </div>
        </div>
    );
}

window.TesoreroDashboard = TesoreroDashboard;
