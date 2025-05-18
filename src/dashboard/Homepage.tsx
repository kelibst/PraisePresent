import { ChurchIcon } from 'lucide-react';
import React from 'react';
import { FiPlus, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const services = [
	{
		id: '1',
		name: 'Sunday Worship',
		created: '2024-05-01',
		modified: '2024-05-07',
		createdBy: 'Pastor John',
	},
	{
		id: '2',
		name: 'Youth Service',
		created: '2024-04-20',
		modified: '2024-05-05',
		createdBy: 'Sister Mary',
	},
	{
		id: '3',
		name: 'Prayer Meeting',
		created: '2024-05-03',
		modified: '2024-05-06',
		createdBy: 'Brother Paul',
	},
];

const Homepage = () => {
	const navigate = useNavigate();
	return (
		<div className="flex min-h-screen">
			{/* Left: Start a new Service */}
			<div className="flex flex-col justify-center items-center flex-1 bg-blue-800 dark:bg-gray-900  text-white relative overflow-hidden">
				{/* Decorative circle */}
				<div className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30" style={{ transform: 'translate(-30%,-30%)' }} />
				<div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30" style={{ transform: 'translate(30%,30%)' }} />
				{/* Church Icon */}
				<ChurchIcon className='w-10 h-10 my-10' />
				<h2 className="text-2xl font-bold mb-10">Start a new Service</h2>
				<button
					className="flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded shadow hover:bg-accent transition"
					onClick={() => alert('Start new service (to be implemented)')}
				>
					<FiPlus /> New Service
				</button>
			</div>
			{/* Right: Services List */}
			<div className="flex-1 bg-background p-12 flex flex-col">
				<h2 className="text-2xl font-bold mb-8 text-foreground">Services List</h2>
				<div className="flex flex-col gap-4">
					{services.map(service => (
						<div
							key={service.id}
							className="rounded-lg shadow border p-6 flex items-center justify-between hover:bg-accent transition cursor-pointer"
							onClick={() => navigate(`/services/${service.id}`)}
						>
							<div>
								<div className="text-lg font-semibold text-foreground">{service.name}</div>
								<div className="text-sm text-muted-foreground flex gap-4 mt-1">
									<span>Created: {service.created}</span>
									<span>Modified: {service.modified}</span>
								</div>
							</div>
							<div className="flex items-center gap-2 text-blue-600 dark:text-white">
								<FiUser />
								<span className="font-medium">{service.createdBy}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default Homepage;