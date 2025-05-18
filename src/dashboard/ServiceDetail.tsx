import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { FiUser } from 'react-icons/fi';

const ServiceDetail = () => {
  const { id } = useParams();
  const service = useSelector((state: RootState) => state.services.find((s: any) => s.id === id));
  if (!service) return <div className="text-red-500">Service not found.</div>;
  return (
    <div className="max-w-xl mx-auto rounded-lg shadow border p-8">
      <h3 className="text-2xl font-bold mb-4 text-foreground">{service.name}</h3>
      <div className="text-md text-muted-foreground mb-2">Created: {service.created}</div>
      <div className="text-md text-muted-foreground mb-2">Modified: {service.modified}</div>
      <div className="flex items-center gap-2 text-blue-600 dark:text-white mt-4">
        <FiUser />
        <span className="font-medium">{service.createdBy}</span>
      </div>
    </div>
  );
};

export default ServiceDetail; 