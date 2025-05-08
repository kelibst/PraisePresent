import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiBook, FiMusic, FiImage, FiMonitor, FiList, FiX, FiSun, FiMoon, FiMonitor as FiSystem } from 'react-icons/fi';
import { useTheme } from '../lib/theme';

const menu = [
  { label: 'Home', icon: <FiHome />, path: '/' },
  { label: 'Scripture', icon: <FiBook />, path: '/scripture' },
  { label: 'Songs', icon: <FiMusic />, path: '/songs' },
  { label: 'Media', icon: <FiImage />, path: '/media' },
  { label: 'Presentations', icon: <FiMonitor />, path: '/presentations' },
  { label: 'Services', icon: <FiList />, path: '/services' },
];

const SidebarDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Close drawer on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line
  }, [location.pathname]);

  return (
    <div className={`fixed inset-0 z-40 flex transition-all duration-500 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close menu overlay"
      />
      {/* Drawer */}
      <aside
        className={`relative w-64 bg-secondary border-r p-4 flex flex-col gap-2 min-h-screen shadow-lg transform transition-transform duration-500 ease-in-out
        ${open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ zIndex: 50 }}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded hover:bg-accent transition-colors"
          onClick={onClose}
          aria-label="Close menu"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-lg font-bold mb-4 mt-2">Menu</h2>
        <nav className="flex flex-col gap-2 mt-8">
          {menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition-colors font-medium ${isActive ? 'bg-accent text-primary' : 'text-foreground'}`
              }
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        {/* Theme toggle at bottom */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-accent text-yellow-500' : 'text-foreground hover:bg-accent'}`}
            onClick={() => setTheme('light')}
            aria-label="Light mode"
          >
            <FiSun size={22} />
          </button>
          <button
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-accent text-blue-500' : 'text-foreground hover:bg-accent'}`}
            onClick={() => setTheme('dark')}
            aria-label="Dark mode"
          >
            <FiMoon size={22} />
          </button>
          <button
            className={`p-2 rounded-full transition-colors ${theme === 'system' ? 'bg-accent text-purple-500' : 'text-foreground hover:bg-accent'}`}
            onClick={() => setTheme('system')}
            aria-label="System theme"
          >
            <FiSystem size={22} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default SidebarDrawer; 