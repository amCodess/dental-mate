import { useState, useLayoutEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Building,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
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
                    onClick={() => setMobileOpen(false)}
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
              {/* Sección Administración (Solo SuperAdmin) */}
              {user?.role?.nombre_role === 'superadmin' && (
                <>
                  <li>
                    <NavLink 
                      to="/companies" 
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="nav-icon"><Building size={20} /></span>
                      {!collapsed && <span className="nav-label">Empresas</span>}
                    </NavLink>
                  </li>
                   <li>
                    <NavLink 
                      to="/admins" 
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="nav-icon"><Shield size={20} /></span>
                      {!collapsed && <span className="nav-label">Administradores</span>}
                    </NavLink>
                  </li>
                </>
              )}

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
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{user.nombre}</p>
                <p className="user-role">{user.role?.nombre_role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
