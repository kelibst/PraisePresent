// Shared types for Live Presentation components

export interface ContentItem {
	id: string;
	type: 'scripture' | 'song' | 'announcement' | 'media' | 'slide' | 'placeholder';
	title: string;
	content: any;
	reference?: string;
	translation?: string;
}

export interface RightPanelProps {
	leftPanelWidth: number;
	previewItem: ContentItem | null;
	liveItem: ContentItem | null;
	isLive: boolean;
	goToPreviousSlide: () => void;
	sendToLive: () => void;
	goToNextSlide: () => void;
	blankToBlack: () => void;
}

export interface NavigationControlsProps {
	onPrevious: () => void;
	onNext: () => void;
	onSendToLive: () => void;
	hasPreviewItem: boolean;
}

export interface MobileRemoteControlProps {
	liveItem: ContentItem | null;
	onPrevious: () => void;
	onNext: () => void;
	onBlankToBlack: () => void;
}

export interface ContentDisplayProps {
	item: ContentItem | null;
	isPreview: boolean;
} 