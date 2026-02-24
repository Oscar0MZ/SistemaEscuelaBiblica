// views/LoginView.js
import React, { useState } from 'react';

export default function LoginView({ onLogin }) {
    const [rol, setRol] = useState('');
    const [clave, setClave] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const exito = onLogin(rol, clave);
        if (!exito) setError('Clave incorrecta.');
    };

    return (
        <div className="flex items-center justify-center h-full bg-indigo-600 p-6">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-8">
                    <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <i className="fas fa-church text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Control Escolar</h2>
                    <p className="text-slate-500 text-sm">Ingresa tus credenciales</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none"
                        value={rol} onChange={(e) => setRol(e.target.value)}>
                        <option value="">¿Quién eres?</option>
                        <option value="ADMIN">Director (Admin)</option>
                        <option value="MAESTRO">Maestro</option>
                        <option value="AUXILIAR">Auxiliar</option>
                        <option value="LOGISTICA">Logística</option>
                    </select>
                    <input type="password" required placeholder="Clave numérica"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl tracking-[0.5em]"
                        value={clave} onChange={(e) => setClave(e.target.value)} />
                    
                    {error && <p className="text-rose-500 text-xs text-center font-bold">{error}</p>}
                    
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                        Entrar al Sistema
                    </button>
                </form>
            </div>
        </div>
    );
}
