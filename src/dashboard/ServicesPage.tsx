import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { FiUser } from 'react-icons/fi';
import { useNavigate, Outlet } from 'react-router-dom';

const ServicesPage = () => {
  const services = useSelector((state: RootState) => state.services);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 bg-background p-12 flex flex-col">
        <h2 className="text-2xl font-bold mb-8 text-foreground">All Services</h2>
        <Outlet />
        {/* If not rendering a child route, show the list */}
        {window.location.pathname === '/services' && (
          <div className="flex flex-col gap-4">
            {services.map((service: any) => (
              <div
                key={service.id}
                className=" rounded-lg shadow border p-6 flex items-center justify-between hover:bg-blue-50 transition cursor-pointer"
                onClick={() => navigate(`/services/${service.id}`)}
              >
                <div>
                  <div className="text-lg font-semibold text-foreground">{service.name}</div>
                  <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                    <span>Created: {service.created}</span>
                    <span>Modified: {service.modified}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <FiUser />
                  <span className="font-medium">{service.createdBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage; 