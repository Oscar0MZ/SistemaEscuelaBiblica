function DashboardView(props) {
    if (props.usuario === 'ADMIN') {
        return <window.AdminDashboard {...props} />;
    }
    
    // --- REDIRECCIÓN PARA LA SECRETARIA ---
    if (props.usuario === 'SECRETARIA') {
        return <window.SecretariaDashboard {...props} />;
    }

    if (props.usuario === 'LOGISTICA') {
        return <window.LogisticaDashboard {...props} />;
    }

    return <window.MaestroDashboard {...props} />;
}

window.DashboardView = DashboardView;
