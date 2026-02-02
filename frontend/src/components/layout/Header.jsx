import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = ({ title, collapsed, setMobileOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className={`header ${collapsed ? 'header-expanded' : ''}`}>
      <div className="header-left">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-center">
        <div className="global-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Buscar pacientes, citas..." />
          <span className="search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="header-right">
        <button className="header-btn-icon">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        
        <div className="header-profile">
          <button className="header-avatar">
             {user?.name?.charAt(0) || 'U'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
