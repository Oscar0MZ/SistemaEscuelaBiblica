function SecretariaDashboard(props) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-pink-50 text-pink-400 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">
                <i className="fas fa-laptop-code"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-700 mb-4">Área en Construcción</h2>
            <p className="text-slate-500 text-base leading-relaxed bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                El administrador está trabajando en las siguientes funciones para tu usuario. <br/><br/> ¡Pronto estarán disponibles!
            </p>
        </div>
    );
}

window.SecretariaDashboard = SecretariaDashboard;
