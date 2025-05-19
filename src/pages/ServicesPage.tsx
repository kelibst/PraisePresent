import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { FiUser, FiCalendar, FiClock, FiPlus } from 'react-icons/fi';

// Mock data for services
const mockServices = [
  {
    id: '1',
    name: 'Sunday Morning Service',
    created: '2024-05-01',
    modified: '2024-05-03',
    createdBy: 'Pastor John'
  },
  {
    id: '2',
    name: 'Wednesday Bible Study',
    created: '2024-04-15',
    modified: '2024-04-28',
    createdBy: 'Elder Sarah'
  },
  {
    id: '3',
    name: 'Youth Group Service',
    created: '2024-04-10',
    modified: '2024-04-22',
    createdBy: 'Youth Pastor Mike'
  },
  {
    id: '4',
    name: 'Christmas Eve Service',
    created: '2023-11-15',
    modified: '2024-04-30',
    createdBy: 'Worship Team'
  }
];

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Service Plans</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <FiPlus /> Create New Service
        </button>
      </div>

      <Outlet />
      
      {/* If not rendering a child route, show the list */}
      {window.location.pathname === '/services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <div className="p-5">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-3">{service.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <FiCalendar className="mr-2 h-4 w-4" />
                    <span>Created: {service.created}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <FiClock className="mr-2 h-4 w-4" />
                    <span>Modified: {service.modified}</span>
                  </div>
                  <div className="flex items-center mt-2 text-primary">
                    <FiUser className="mr-2 h-4 w-4" />
                    <span className="font-medium">{service.createdBy}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 p-3 text-center border-t border-slate-200 dark:border-slate-600">
                <button className="text-primary hover:text-primary-dark text-sm font-medium">
                  Open Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage; 