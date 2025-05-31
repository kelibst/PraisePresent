import React, { useState } from 'react';
import { FiMonitor, FiSpeaker, FiUser, FiDatabase } from 'react-icons/fi';
import DisplaySettings from '@/components/settings/DisplaySettings';

interface Tab {
	id: string;
	label: string;
	icon: React.ReactNode;
	component: React.ReactNode;
}

const Settings: React.FC = () => {
	const [activeTab, setActiveTab] = useState('display');

	const tabs: Tab[] = [
		{
			id: 'display',
			label: 'Display',
			icon: <FiMonitor className="w-4 h-4" />,
			component: <DisplaySettings />,
		},
		{
			id: 'audio',
			label: 'Audio',
			icon: <FiSpeaker className="w-4 h-4" />,
			component: (
				<div className="p-6 text-center text-gray-500">
					<FiSpeaker className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p>Audio settings coming soon...</p>
				</div>
			),
		},
		{
			id: 'general',
			label: 'General',
			icon: <FiUser className="w-4 h-4" />,
			component: (
				<div className="p-6 text-center text-gray-500">
					<FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p>General settings coming soon...</p>
				</div>
			),
		},
		{
			id: 'database',
			label: 'Database',
			icon: <FiDatabase className="w-4 h-4" />,
			component: (
				<div className="p-6 text-center text-gray-500">
					<FiDatabase className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p>Database settings coming soon...</p>
				</div>
			),
		},
	];

	const activeTabData = tabs.find(tab => tab.id === activeTab);

	return (
		<div className="flex h-full">
			{/* Tab Navigation */}
			<div className="w-64 bg-secondary border-r border-border flex-shrink-0">
				<div className="p-4 border-b border-border">
					<h1 className="text-2xl font-bold text-foreground">Settings</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Configure your PraisePresent application
					</p>
				</div>

				<nav className="p-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${activeTab === tab.id
								? 'bg-accent text-accent-foreground'
								: 'text-foreground hover:bg-accent/50'
								}`}
						>
							{tab.icon}
							<span className="font-medium">{tab.label}</span>
						</button>
					))}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-auto">
				{activeTabData && (
					<div className="h-full">
						<div className="p-6 border-b border-border bg-background">
							<div className="flex items-center gap-3">
								{activeTabData.icon}
								<h2 className="text-xl font-semibold text-foreground">
									{activeTabData.label} Settings
								</h2>
							</div>
						</div>
						<div className="h-full">
							{activeTabData.component}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Settings; 