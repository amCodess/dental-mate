import { useState, useLayoutEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Citas', path: '/appointments' },
    { icon: <Users size={20} />, label: 'Pacientes', path: '/patients' },
    { icon: <CreditCard size={20} />, label: 'Facturación', path: '/billing' },
  ];

  // Solo mostrar Usuarios si es superadmin (role_id 3 según seeders, o verificar nombre role)
  // Asumiendo que user tiene role_id o role object. El backend auth devuelve `user.id_role`.
  // Role 3 es superadmin.
  if (user && user.id_role === 3) {
    navItems.push({ icon: <Activity size={20} />, label: 'Usuarios (Admin)', path: '/users' });
  }

  const bottomItems = [
    { icon: <Settings size={20} />, label: 'Configuración', path: '/settings' },
  ];

  const sidebarClass = `sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`;

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      
      <aside className={sidebarClass}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">DM</div>
            {!collapsed && <span className="logo-text">DentalMate</span>}
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-group-title">{!collapsed && 'PRINCIPAL'}</span>
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)} // Close on mobile navigation
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-group mt-auto">
             <span className="nav-group-title">{!collapsed && 'SISTEMA'}</span>
            <ul>
              {bottomItems.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
              <li>
                <button className="nav-item nav-logout" onClick={handleLogout}>
                  <span className="nav-icon"><LogOut size={20} /></span>
                  {!collapsed && <span className="nav-label">Cerrar sesión</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {!collapsed && user && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{user.name}</p>
                <p className="user-role">{user.id_role === 3 ? 'Super Admin' : 'Usuario'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
