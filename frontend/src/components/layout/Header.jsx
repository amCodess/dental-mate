import { Menu } from 'lucide-react';
import './Header.css';

const Header = ({ title, setMobileOpen }) => {
  return (
    <header className="header-simple">
      <div className="header-simple-left">
        <button
          className="header-simple-menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="header-simple-title">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
