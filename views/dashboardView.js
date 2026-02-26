function DashboardView(props) {
    const { usuario } = props;

    if (usuario === 'ADMIN') {
        return <AdminDashboard {...props} />;
    }

    if (usuario === 'LOGISTICA') {
        return <LogisticaDashboard {...props} />;
    }

    if (usuario === 'MAESTRO' || usuario === 'AUXILIAR') {
        return <MaestroDashboard {...props} />;
    }

    return null; // Si no es ninguno, no muestra nada
}

window.DashboardView = DashboardView;
