import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiEdit, FiTrash2, FiCopy, FiPlay } from 'react-icons/fi';

// This would typically come from a store or API
const mockServices = [
  {
    id: '1',
    name: 'Sunday Morning Service',
    created: '2024-05-01',
    modified: '2024-05-03',
    createdBy: 'Pastor John',
    elements: [
      { id: 'e1', type: 'song', title: 'Amazing Grace', duration: '4:30' },
      { id: 'e2', type: 'scripture', title: 'John 3:16-17', duration: '1:00' },
      { id: 'e3', type: 'announcement', title: 'Weekly Announcements', duration: '3:00' },
      { id: 'e4', type: 'sermon', title: 'Walking in Faith', duration: '25:00' },
      { id: 'e5', type: 'song', title: 'How Great is Our God', duration: '5:15' }
    ]
  },
  {
    id: '2',
    name: 'Wednesday Bible Study',
    created: '2024-04-15',
    modified: '2024-04-28',
    createdBy: 'Elder Sarah',
    elements: [
      { id: 'e1', type: 'song', title: 'In Christ Alone', duration: '4:15' },
      { id: 'e2', type: 'scripture', title: 'Romans 8:1-11', duration: '2:30' },
      { id: 'e3', type: 'teaching', title: 'Freedom in Christ', duration: '35:00' }
    ]
  },
  {
    id: '3',
    name: 'Youth Group Service',
    created: '2024-04-10',
    modified: '2024-04-22',
    createdBy: 'Youth Pastor Mike',
    elements: [
      { id: 'e1', type: 'game', title: 'Icebreaker Activity', duration: '10:00' },
      { id: 'e2', type: 'song', title: 'God is Able', duration: '4:00' },
      { id: 'e3', type: 'video', title: 'Testimony Video', duration: '5:30' },
      { id: 'e4', type: 'teaching', title: 'Making Good Choices', duration: '20:00' }
    ]
  },
  {
    id: '4',
    name: 'Christmas Eve Service',
    created: '2023-11-15',
    modified: '2024-04-30',
    createdBy: 'Worship Team',
    elements: [
      { id: 'e1', type: 'song', title: 'O Holy Night', duration: '5:00' },
      { id: 'e2', type: 'scripture', title: 'Luke 2:1-20', duration: '3:30' },
      { id: 'e3', type: 'song', title: 'Silent Night', duration: '4:00' },
      { id: 'e4', type: 'sermon', title: 'The Gift of Christ', duration: '20:00' },
      { id: 'e5', type: 'song', title: 'Joy to the World', duration: '3:45' }
    ]
  }
];

// Helper function to get icon based on element type
const getElementIcon = (type: string) => {
  switch (type) {
    case 'song':
      return '🎵';
    case 'scripture':
      return '📖';
    case 'sermon':
    case 'teaching':
      return '🎤';
    case 'announcement':
      return '📢';
    case 'video':
      return '🎬';
    case 'game':
      return '🎮';
    default:
      return '📝';
  }
};

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = mockServices.find((s) => s.id === id);

  if (!service) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Service not found</h3>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => navigate('/services')}
        >
          Back to Services
        </button>
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = service.elements.reduce((total, element) => {
    const [minutes, seconds] = element.duration.split(':').map(Number);
    return total + minutes + (seconds / 60);
  }, 0);

  const formattedTotalDuration = `${Math.floor(totalDuration)}:${Math.round((totalDuration % 1) * 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <button 
          className="flex items-center text-primary mb-4"
          onClick={() => navigate('/services')}
        >
          <FiChevronLeft /> Back to Services
        </button>
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{service.name}</h2>
          <div className="flex space-x-2">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
              <FiEdit size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400">
              <FiCopy size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500">
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div className="text-sm text-slate-500 dark:text-slate-400">Created</div>
            <div className="font-medium text-slate-800 dark:text-white">{service.created}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div className="text-sm text-slate-500 dark:text-slate-400">Modified</div>
            <div className="font-medium text-slate-800 dark:text-white">{service.modified}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div className="text-sm text-slate-500 dark:text-slate-400">Created By</div>
            <div className="font-medium text-slate-800 dark:text-white">{service.createdBy}</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Service Elements</h3>
          <div className="text-sm bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full">
            Total Duration: {formattedTotalDuration}
          </div>
        </div>
        
        <div className="space-y-3">
          {service.elements.map((element, index) => (
            <div 
              key={element.id}
              className="flex items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-lg mr-3">
                {getElementIcon(element.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800 dark:text-white">{element.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {element.type.charAt(0).toUpperCase() + element.type.slice(1)} • {element.duration}
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400">
                  <FiEdit size={16} />
                </button>
                <button className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-3 bg-primary text-white rounded-md font-medium flex items-center justify-center gap-2">
          <FiPlay /> Present Service
        </button>
      </div>
    </div>
  );
};

export default ServiceDetail; 