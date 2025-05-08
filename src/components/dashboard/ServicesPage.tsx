import React from 'react';
import { useParams } from 'react-router-dom';
import { FiBook, FiMusic, FiImage, FiMonitor, FiSettings } from 'react-icons/fi';

const menu = [
  { label: 'Scripture', icon: <FiBook />, path: '/scripture' },
  { label: 'Songs', icon: <FiMusic />, path: '/songs' },
  { label: 'Media', icon: <FiImage />, path: '/media' },
  { label: 'Presentations', icon: <FiMonitor />, path: '/presentations' },
  { label: 'Settings', icon: <FiSettings />, path: '/settings' },
];

const ServicesPage = () => {
  const { id } = useParams();
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-secondary border-r p-4 flex flex-col gap-2">
        <h2 className="text-lg font-bold mb-4">Menu</h2>
        {menu.map((item) => (
          <button key={item.label} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition-colors">
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Service Details</h1>
        <p>Service ID: {id}</p>
        {/* Add more details here */}
      </main>
    </div>
  );
};

export default ServicesPage; 