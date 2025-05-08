import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBook, FiMusic, FiImage, FiMonitor, FiSettings, FiList } from 'react-icons/fi';

const menu = [
  { label: 'Home', icon: <FiHome />, path: '/' },
  { label: 'Scripture', icon: <FiBook />, path: '/scripture' },
  { label: 'Songs', icon: <FiMusic />, path: '/songs' },
  { label: 'Media', icon: <FiImage />, path: '/media' },
  { label: 'Presentations', icon: <FiMonitor />, path: '/presentations' },
  { label: 'Services', icon: <FiList />, path: '/services' },
  { label: 'Settings', icon: <FiSettings />, path: '/settings' },
];

const Sidebar = () => (
  <aside className="w-64 bg-secondary border-r p-4 flex flex-col gap-2 min-h-screen">
    <h2 className="text-lg font-bold mb-4">Menu</h2>
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
  </aside>
);

export default Sidebar; 