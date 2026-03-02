function DashboardView(props) {
    if (props.usuario === 'ADMIN') {
        return <window.AdminDashboard {...props} />;
    }
    
    if (props.usuario === 'SECRETARIA') {
        return <window.SecretariaDashboard {...props} />;
    }

    // --- AQUÍ ESTÁ LA CORRECCIÓN: REDIRECCIÓN DEL TESORERO ---
    if (props.usuario === 'TESORERO') {
        return <window.TesoreroDashboard {...props} />;
    }

    if (props.usuario === 'LOGISTICA') {
        return <window.LogisticaDashboard {...props} />;
    }

    // Si no es ninguno de los de arriba, asume que es Maestro/Auxiliar
    return <window.MaestroDashboard {...props} />;
}

window.DashboardView = DashboardView;
