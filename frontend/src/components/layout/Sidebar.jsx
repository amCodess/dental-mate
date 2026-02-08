import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users,
  User,
  Calendar, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Package,
  Truck,
  Stethoscope,
  Building,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredSelection } from '../../utils/clinicSelection';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard', keepSearch: true },
    { icon: <Calendar size={20} />, label: 'Citas', path: '/appointments', keepSearch: true },
    { icon: <User size={20} />, label: 'Pacientes', path: '/patients', keepSearch: true },
    { icon: <CreditCard size={20} />, label: 'Facturación', path: '/billing', keepSearch: true },
    { icon: <Package size={20} />, label: 'Productos', path: '/products', keepSearch: true },
    { icon: <Truck size={20} />, label: 'Proveedores', path: '/suppliers', keepSearch: true },
    { icon: <Stethoscope size={20} />, label: 'Tratamientos', path: '/treatments', keepSearch: true },
    { icon: <Users size={20} />, label: 'Usuarios', path: '/users', keepSearch: true },
  ];

  const bottomItems = [
    { icon: <Building size={20} />, label: 'Cambiar Clínica', path: '/select-clinic' },
  ];

  const superAdminItems = [
    { icon: <Building size={20} />, label: 'Empresas', path: '/companies' },
    { icon: <Shield size={20} />, label: 'Administradores', path: '/admins' },
  ];

  const sidebarClass = `sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`;
  const searchParams = new URLSearchParams(location.search);
  const storedSelection = getStoredSelection();
  const clinicId = searchParams.get('clinicId') || storedSelection.clinicId;
  const companyId = searchParams.get('companyId') || storedSelection.companyId;
  if (!searchParams.get('clinicId') && clinicId) {
    searchParams.set('clinicId', clinicId);
  }
  if (!searchParams.get('companyId') && companyId) {
    searchParams.set('companyId', companyId);
  }
  const navSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const visibleNavItems = navItems;
  const buildPath = (path, keepSearch) => (keepSearch && navSearch ? `${path}${navSearch}` : path);

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      
      <aside className={sidebarClass}>
        <div className="sidebar-header">
          <div className="logo-container" aria-label="sidebar-brand">
            {/* Ícono oculto; solo texto de marca */}
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
              {visibleNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={buildPath(item.path, item.keepSearch)} 
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
              {user?.is_superadmin && superAdminItems.map((item) => (
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
            <div className="user-details-only">
              <p className="user-name">{user.nombre}</p>
              <p className="user-role">
                {storedSelection.companyName || 'Sin empresa'} · {storedSelection.clinicName || 'Sin clínica'}
              </p>
              <p className="user-role">{user?.is_superadmin ? 'superadmin' : 'usuario'}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
