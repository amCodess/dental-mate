import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, Calendar, FileText, LogOut } from 'lucide-react';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>DentalMate</h2>
                    <p className="user-name">{user?.name}</p>
                </div>
                
                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item">
                        <Home size={20} />
                        <span>Inicio</span>
                    </Link>
                    <Link to="/patients" className="nav-item">
                        <Users size={20} />
                        <span>Pacientes</span>
                    </Link>
                    <Link to="/appointments" className="nav-item">
                        <Calendar size={20} />
                        <span>Citas</span>
                    </Link>
                    <Link to="/billing" className="nav-item">
                        <FileText size={20} />
                        <span>Facturación</span>
                    </Link>
                </nav>

                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Cerrar sesión</span>
                </button>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
