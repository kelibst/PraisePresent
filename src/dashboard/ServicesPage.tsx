import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { useNavigate, Outlet } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <Card
                key={service.id}
                className="hover:bg-accent/50 transition cursor-pointer"
                onClick={() => navigate(`/services/${service.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FiCalendar className="mr-2 h-4 w-4" />
                      <span>Created: {service.created}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FiClock className="mr-2 h-4 w-4" />
                      <span>Modified: {service.modified}</span>
                    </div>
                    <div className="flex items-center mt-2 text-blue-600 dark:text-blue-400">
                      <FiUser className="mr-2 h-4 w-4" />
                      <span className="font-medium">{service.createdBy}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage; 