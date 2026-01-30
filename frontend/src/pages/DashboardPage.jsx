import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1>Bienvenido, {user?.name}</h1>
            <p>Panel de control principal de DentalMate</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="dashboard-card">
                    <h3>Pacientes</h3>
                    <p>Gestiona tus pacientes</p>
                </div>
                <div className="dashboard-card">
                    <h3>Citas de hoy</h3>
                    <p>Ver agenda del día</p>
                </div>
                <div className="dashboard-card">
                    <h3>Facturación</h3>
                    <p>Últimas facturas</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
