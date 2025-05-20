import React from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface ServiceItem {
  id: number;
  type: string;
  title: string;
  author: string;
  content: string;
}

interface ServicePlanListProps {
  items: ServiceItem[];
  currentIndex: number;
}

const ServicePlanList: React.FC<ServicePlanListProps> = ({ items, currentIndex }) => {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div 
          key={item.id}
          className={`flex items-start p-3 rounded-lg border ${
            currentIndex === index 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700" 
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`}
        >
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-800 dark:text-white">{item.title}</h3>
              <div className="flex items-center gap-2">
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <FiEdit size={16} />
                </button>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicePlanList; 