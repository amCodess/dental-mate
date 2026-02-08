import { useState, useLayoutEffect } from 'react';
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
  const [showContext, setShowContext] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard', keepSearch: true },
    { icon: <Calendar size={20} />, label: 'Citas', path: '/appointments', permission: 'menu_citas', keepSearch: true },
    { icon: <User size={20} />, label: 'Pacientes', path: '/patients', permission: 'menu_pacientes', keepSearch: true },
    { icon: <CreditCard size={20} />, label: 'Facturacion', path: '/billing', permission: 'menu_facturacion', keepSearch: true },
    { icon: <Package size={20} />, label: 'Productos', path: '/products', permission: 'menu_productos', keepSearch: true },
    { icon: <Truck size={20} />, label: 'Proveedores', path: '/suppliers', permission: 'menu_proveedores', keepSearch: true },
    { icon: <Stethoscope size={20} />, label: 'Tratamientos', path: '/treatments', permission: 'menu_tratamientos', keepSearch: true },
    { icon: <Users size={20} />, label: 'Usuarios', path: '/users', permission: 'menu_usuarios', keepSearch: true },
  ];

  const bottomItems = [
    { icon: <Building size={20} />, label: 'Cambiar clinica', path: '/select-clinic' },
    { icon: <Settings size={20} />, label: 'Configuración', path: '/settings' },
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

  const resolveVisibility = () => {
    if (!user?.clinics || user.clinics.length === 0) return null;
    if (clinicId) {
      return user.clinics.find(clinic => String(clinic.id_clinica) === String(clinicId))?.pivot || null;
    }
    if (user.clinics.length === 1) {
      return user.clinics[0]?.pivot || null;
    }
    return null;
  };

  const visibility = resolveVisibility();
  const normalizeVisibility = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (['true', 't', '1', 'yes'].includes(normalized)) return true;
      if (['false', 'f', '0', 'no'].includes(normalized)) return false;
    }
    return null;
  };

  const canShowMenu = (key) => {
    if (!key) return true;
    if (!visibility) return true;
    const value = normalizeVisibility(visibility[key]);
    if (value === null) return true;
    return value;
  };

  const visibleNavItems = navItems.filter(item => canShowMenu(item.permission));
  const buildPath = (path, keepSearch) => (keepSearch && navSearch ? `${path}${navSearch}` : path);

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
            <div className="user-popover">
              <button className="user-info" onClick={() => setShowContext(!showContext)}>
                <div className="user-avatar">
                  {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <p className="user-name">{user.nombre}</p>
                  <p className="user-role">Empresa y clínica</p>
                </div>
              </button>
              {showContext && (
                <div className="session-context popover">
                  <p className="session-context-label">Empresa</p>
                  <p className="session-context-value">{storedSelection.companyName || 'Sin seleccion'}</p>
                  <p className="session-context-label">Clinica</p>
                  <p className="session-context-value">{storedSelection.clinicName || 'Sin seleccion'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
