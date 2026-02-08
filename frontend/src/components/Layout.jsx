import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import './Layout.css';

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Determine title based on path
    const getPageTitle = (pathname) => {
        switch (true) {
            case pathname === '/dashboard': return 'Dashboard';
            case pathname === '/patients': return 'Pacientes';
            case pathname === '/appointments': return 'Gestión de citas';
            case pathname === '/billing': return 'Facturación';
            case pathname === '/users': return 'Gestión de usuarios';
            case pathname === '/settings': return 'Configuración';
            default: return 'DentalMate';
        }
    };

    const title = getPageTitle(location.pathname);

    return (
        <div className="layout-root">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className={`layout-content-wrapper ${collapsed ? 'collapsed-content' : ''}`}>
                <Header
                    title={title}
                    setMobileOpen={setMobileOpen}
                />

                <main className="layout-main">
                    <Outlet /> {/* Renders the child route element */}
                </main>
            </div>
        </div>
    );
};

export default Layout;
