import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiBook, FiMusic, FiImage, FiMonitor, FiList, FiChevronLeft, FiChevronRight, FiSun, FiMoon } from 'react-icons/fi';

const menu = [
  { label: 'Home', icon: <FiHome />, path: '/' },
  { label: 'Scripture', icon: <FiBook />, path: '/scripture' },
  { label: 'Songs', icon: <FiMusic />, path: '/songs' },
  { label: 'Media', icon: <FiImage />, path: '/media' },
  { label: 'Presentations', icon: <FiMonitor />, path: '/presentations' },
  { label: 'Services', icon: <FiList />, path: '/services' },
];

function useTheme() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

const AnimatedSidebar: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const [theme, setTheme] = useTheme();
  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 bg-secondary border-r shadow-lg flex flex-col gap-2 transition-all duration-500 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} w-64`}
    >
      <button
        className="absolute -right-5 top-4 bg-background border rounded-full shadow p-1 z-40 hover:bg-accent transition-colors"
        onClick={onToggle}
        aria-label={open ? 'Retract sidebar' : 'Expand sidebar'}
      >
        {open ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
      </button>
      <h2 className="text-lg font-bold mb-4 mt-8 px-4">Menu</h2>
      <nav className="flex flex-col gap-2 mt-2 px-2">
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
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-accent text-yellow-500' : 'text-foreground'}`}
          onClick={() => setTheme('light')}
          aria-label="Light mode"
        >
          <FiSun size={22} />
        </button>
        <button
          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-accent text-blue-500' : 'text-foreground'}`}
          onClick={() => setTheme('dark')}
          aria-label="Dark mode"
        >
          <FiMoon size={22} />
        </button>
      </div>
    </aside>
  );
};

export default AnimatedSidebar; 