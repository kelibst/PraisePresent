import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const services = useSelector((state: RootState) => state.services);
  const service = services.find((s) => s.id === id);

  if (!service) {
    return <div className="p-8 text-center">Service not found</div>;
  }

  return (
    <div className="mt-2 mb-8">
      <h3 className="text-xl font-semibold">{service.name} Details</h3>
      <div className="mt-4 bg-card p-6 rounded-lg shadow">
        <p>
          <strong>Created:</strong> {service.created}
        </p>
        <p>
          <strong>Modified:</strong> {service.modified}
        </p>
        <p>
          <strong>Created By:</strong> {service.createdBy}
        </p>
      </div>
    </div>
  );
};

export default ServiceDetail; 