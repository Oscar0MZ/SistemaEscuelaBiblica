const { useState } = React;

function LoginView({ onLogin }) {
    const [rol, setRol] = useState('');
    const [clave, setClave] = useState('');
    const [nombre, setNombre] = useState(''); // Nuevo estado para el nombre
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState(''); // Para avisos de "Esperando aprobación"

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        if (rol !== 'ADMIN' && !nombre.trim()) {
            setError('Por favor escribe tu nombre completo.');
            return;
        }

        // Llamamos a la función onLogin y esperamos su respuesta
        const respuesta = await onLogin(rol, clave, nombre);
        
        if (!respuesta.exito) {
            setError(respuesta.mensaje);
        } else if (respuesta.mensaje) {
            // Caso especial: Registro exitoso pero pendiente de aprobación
            setMensaje(respuesta.mensaje);
            setClave(''); // Limpiamos clave por seguridad
        }
    };

    return (
        <div className="flex items-center justify-center h-full bg-indigo-600 p-6">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <i className="fas fa-church text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Control Escolar</h2>
                    <p className="text-slate-500 text-sm">Sistema de Asistencia</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* SELECCIÓN DE ROL */}
                    <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-600"
                        value={rol} onChange={(e) => setRol(e.target.value)}>
                        <option value="">¿Quién eres?</option>
                        <option value="ADMIN">Director (Admin)</option>
                        <option value="MAESTRO">Maestro</option>
                        <option value="AUXILIAR">Auxiliar</option>
                        <option value="LOGISTICA">Logística</option>
                    </select>

                    {/* NUEVO CAMPO: NOMBRE COMPLETO (Solo si no es Admin) */}
                    {rol && rol !== 'ADMIN' && (
                        <input type="text" required placeholder="Tu Nombre Completo"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    )}
                    
                    {/* CLAVE */}
                    <input type="password" required placeholder="Clave de acceso"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-center text-xl tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={clave} onChange={(e) => setClave(e.target.value)} />
                    
                    {/* MENSAJES DE ERROR O ÉXITO */}
                    {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-xs text-center font-bold border border-rose-100"><i className="fas fa-exclamation-circle mr-1"></i> {error}</div>}
                    {mensaje && <div className="bg-amber-50 text-amber-600 p-3 rounded-xl text-xs text-center font-bold border border-amber-100"><i className="fas fa-clock mr-1"></i> {mensaje}</div>}
                    
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                        {rol === 'ADMIN' ? 'Entrar' : 'Solicitar Acceso / Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

window.LoginView = LoginView;
