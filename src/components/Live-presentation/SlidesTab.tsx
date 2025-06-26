import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { FiSearch, FiX, FiPlay, FiArrowRight, FiList, FiLoader, FiEdit, FiPlus, FiEye } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import {
	loadPresentations,
	searchPresentations,
	getPresentation,
	updatePresentationUsage,
	initializeSlidesDefaults,
	Presentation,
	Slide,
	selectPresentations,
	selectCurrentPresentation,
	selectSlides,
	selectRecentPresentations,
	selectSlidesLoading,
	selectSearchResults,
	selectSlidesInitialized
} from '../../lib/slidesSlice';
import { setPreviewItem, sendContentToLiveDisplay, PresentationItem } from '../../lib/presentationSlice';
import { UniversalSlide } from '../../lib/universalSlideSlice';
import SlideEditor from '../slides/SlideEditor';

// Constants for better maintainability
const DOUBLE_CLICK_TIMEOUT = 500;
const SEARCH_DEBOUNCE_DELAY = 300;
const PRESENTATIONS_PER_PAGE = 20;
const SEARCH_LIMIT = 15;

interface PresentationCardProps {
	presentation: Presentation;
	onSelect: (presentation: Presentation) => void;
	onPreview: (presentation: Presentation) => void;
	onLive: (presentation: Presentation) => void;
	onEdit: (presentation: Presentation) => void;
	isSelected?: boolean;
}

const PresentationCard: React.FC<PresentationCardProps> = ({
	presentation,
	onSelect,
	onPreview,
	onLive,
	onEdit,
	isSelected = false
}) => {
	return (
		<div
			className={`group p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${isSelected
				? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
				: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
				}`}
			onClick={() => onSelect(presentation)}
		>
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
					{presentation.title}
				</h3>
				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={(e) => { e.stopPropagation(); onPreview(presentation); }}
						className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
						title="Preview"
					>
						<FiEye size={14} />
					</button>
					<button
						onClick={(e) => { e.stopPropagation(); onLive(presentation); }}
						className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
						title="Send to Live"
					>
						<FiPlay size={14} />
					</button>
					<button
						onClick={(e) => { e.stopPropagation(); onEdit(presentation); }}
						className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
						title="Edit"
					>
						<FiEdit size={14} />
					</button>
				</div>
			</div>

			<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
				<span className="flex items-center gap-1">
					<FiList size={12} />
					{presentation.totalSlides || 0} slides
				</span>
				{presentation.template?.category && (
					<span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
						{presentation.template.category}
					</span>
				)}
			</div>

			<div className="text-xs text-gray-400 dark:text-gray-500">
				{presentation.lastUsed ? (
					<span>Last used: {new Date(presentation.lastUsed).toLocaleDateString()}</span>
				) : (
					<span>Created: {new Date(presentation.createdAt).toLocaleDateString()}</span>
				)}
			</div>

			{presentation.description && (
				<p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
					{presentation.description}
				</p>
			)}
		</div>
	);
};

interface SlideListProps {
	slides: Slide[];
	onSlidePreview: (slide: Slide) => void;
	onSlideLive: (slide: Slide) => void;
	onSlideEdit: (slide: Slide) => void;
	currentSlideId?: string;
}

const SlideList: React.FC<SlideListProps> = ({
	slides,
	onSlidePreview,
	onSlideLive,
	onSlideEdit,
	currentSlideId
}) => {
	return (
		<div className="space-y-2">
			{slides.map((slide, index) => (
				<div
					key={slide.id}
					className={`group p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${currentSlideId === slide.id
						? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
						: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
						}`}
					onClick={() => onSlidePreview(slide)}
				>
					<div className="flex justify-between items-start">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
									Slide {index + 1}
								</span>
								{slide.title && (
									<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
										{slide.title}
									</h4>
								)}
							</div>

							{slide.parsedContent && (
								<div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
									{slide.parsedContent.title && (
										<span className="font-medium">{slide.parsedContent.title}</span>
									)}
									{slide.parsedContent.body && (
										<span className={slide.parsedContent.title ? " - " : ""}>
											{slide.parsedContent.body.substring(0, 100)}
											{slide.parsedContent.body.length > 100 ? "..." : ""}
										</span>
									)}
								</div>
							)}
						</div>

						<div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								onClick={(e) => { e.stopPropagation(); onSlideEdit(slide); }}
								className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
								title="Edit Slide"
							>
								<FiEdit size={14} />
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); onSlidePreview(slide); }}
								className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
								title="Preview Slide"
							>
								<FiEye size={14} />
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); onSlideLive(slide); }}
								className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
								title="Send to Live"
							>
								<FiPlay size={14} />
							</button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

const SlidesTab = () => {
	const dispatch = useDispatch<AppDispatch>();
	const presentations = useSelector(selectPresentations);
	const currentPresentation = useSelector(selectCurrentPresentation);
	const slides = useSelector(selectSlides);
	const recentPresentations = useSelector(selectRecentPresentations);
	const loading = useSelector(selectSlidesLoading);
	const searchResults = useSelector(selectSearchResults);
	const initialized = useSelector(selectSlidesInitialized);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
	const [clickedPresentation, setClickedPresentation] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<'presentations' | 'slides' | 'editor'>('presentations');
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
	const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

	// Initialize slides system on mount
	useEffect(() => {
		if (!initialized) {
			dispatch(initializeSlidesDefaults());
		}
	}, [dispatch, initialized]);

	// Load presentations on mount
	useEffect(() => {
		if (initialized && presentations.length === 0 && !loading) {
			dispatch(loadPresentations({ limit: PRESENTATIONS_PER_PAGE, offset: 0 }));
		}
	}, [dispatch, presentations.length, loading, initialized]);

	// Memoized presentation item creator
	const createPresentationItem = useCallback((presentation: Presentation, slide?: Slide): PresentationItem => {
		const firstSlide = slide || presentation.slides?.[0];

		return {
			id: slide ? `slide-${slide.id}` : `presentation-${presentation.id}`,
			type: "slide",
			title: slide?.title || presentation.title,
			content: {
				presentationId: presentation.id,
				slideId: slide?.id,
				title: slide?.title || presentation.title,
				text: slide?.parsedContent?.body || slide?.parsedContent?.title || '',
				presentation: presentation,
				slide: slide,
				slides: presentation.slides || [],
				currentSlideIndex: slide ? presentation.slides?.findIndex(s => s.id === slide.id) || 0 : 0,
				totalSlides: presentation.totalSlides || presentation.slides?.length || 0,
				background: slide?.background,
				template: slide?.template || presentation.template,
				notes: slide?.notes
			},
			reference: slide
				? `${presentation.title} - Slide ${(presentation.slides?.findIndex(s => s.id === slide.id) || 0) + 1}`
				: presentation.title,
		};
	}, []);

	// Universal slide presentation item creator
	const createUniversalSlideItem = useCallback((universalSlide: UniversalSlide): PresentationItem => {
		return {
			id: `universal-slide-${universalSlide.id}`,
			type: "universal-slide",
			title: universalSlide.title,
			content: universalSlide.content,
			reference: universalSlide.subtitle,
			universalSlide: universalSlide,
		};
	}, []);

	// Usage tracking
	const updatePresentationUsageTracking = useCallback(async (presentation: Presentation) => {
		if (!presentation.id) return;

		try {
			await dispatch(updatePresentationUsage(presentation.id));
		} catch (error) {
			console.error('Failed to update presentation usage:', error);
		}
	}, [dispatch]);

	// Handler functions
	const handlePresentationPreview = useCallback(async (presentation: Presentation) => {
		try {
			// Load full presentation with slides if needed
			let fullPresentation = presentation;
			if (!presentation.slides?.length) {
				const result = await dispatch(getPresentation(presentation.id)).unwrap();
				fullPresentation = result;
			}

			const presentationItem = createPresentationItem(fullPresentation);
			dispatch(setPreviewItem(presentationItem));
			updatePresentationUsageTracking(fullPresentation);
		} catch (error) {
			console.error('Failed to send presentation to preview:', error);
		}
	}, [createPresentationItem, dispatch, updatePresentationUsageTracking]);

	const handlePresentationLive = useCallback(async (presentation: Presentation) => {
		try {
			// Load full presentation with slides if needed
			let fullPresentation = presentation;
			if (!presentation.slides?.length) {
				const result = await dispatch(getPresentation(presentation.id)).unwrap();
				fullPresentation = result;
			}

			const presentationItem = createPresentationItem(fullPresentation);
			await dispatch(sendContentToLiveDisplay(presentationItem));
			updatePresentationUsageTracking(fullPresentation);
		} catch (error) {
			console.error('Failed to send presentation to live:', error);
		}
	}, [createPresentationItem, dispatch, updatePresentationUsageTracking]);

	const handleSlidePreview = useCallback(async (slide: Slide) => {
		try {
			if (!selectedPresentation) return;

			const presentationItem = createPresentationItem(selectedPresentation, slide);
			dispatch(setPreviewItem(presentationItem));
			updatePresentationUsageTracking(selectedPresentation);
		} catch (error) {
			console.error('Failed to send slide to preview:', error);
		}
	}, [createPresentationItem, dispatch, selectedPresentation, updatePresentationUsageTracking]);

	const handleSlideLive = useCallback(async (slide: Slide) => {
		try {
			if (!selectedPresentation) return;

			const presentationItem = createPresentationItem(selectedPresentation, slide);
			await dispatch(sendContentToLiveDisplay(presentationItem));
			updatePresentationUsageTracking(selectedPresentation);
		} catch (error) {
			console.error('Failed to send slide to live:', error);
		}
	}, [createPresentationItem, dispatch, selectedPresentation, updatePresentationUsageTracking]);

	const handleSlideEdit = useCallback((slide: Slide) => {
		setEditingSlide(slide);
		setActiveView('editor');
	}, []);

	const handlePresentationClick = useCallback(async (presentation: Presentation) => {
		const presentationId = presentation.id;

		if (clickedPresentation === presentationId) {
			// Double click - send to live
			setClickedPresentation(null);
			await handlePresentationLive(presentation);
		} else {
			// First click - send to preview and load slides
			setClickedPresentation(presentationId);
			await handlePresentationPreview(presentation);

			// Load presentation with slides for slide view
			try {
				const fullPresentation = await dispatch(getPresentation(presentation.id)).unwrap();
				setSelectedPresentation(fullPresentation);
				setActiveView('slides');
			} catch (error) {
				console.error('Failed to load presentation slides:', error);
			}

			// Clear the clicked state after delay
			setTimeout(() => {
				setClickedPresentation(null);
			}, DOUBLE_CLICK_TIMEOUT);
		}
	}, [clickedPresentation, handlePresentationLive, handlePresentationPreview, dispatch]);

	const handlePresentationEdit = useCallback((presentation: Presentation) => {
		// For Phase 1B, this will open the presentation in edit mode
		console.log('Edit presentation:', presentation.title);
		// TODO: Implement presentation editor
	}, []);

	const handleCreateNew = useCallback(() => {
		// For Phase 1B, this will create a new presentation
		console.log('Create new presentation');
		// TODO: Implement new presentation creation

		// TEST: Create a sample Universal Slide
		const testUniversalSlide: UniversalSlide = {
			id: `test-${Date.now()}`,
			title: "Test Universal Slide",
			subtitle: "Testing the integration",
			type: "note",
			content: {
				text: "This is a test Universal Slide to verify the preview/live integration is working correctly.",
				bulletPoints: ["Point 1: Preview should work", "Point 2: Live display should work", "Point 3: Background should render"]
			},
			background: {
				type: "gradient",
				colors: ["#3b82f6", "#1e40af"],
				opacity: 1
			},
			textFormatting: {
				titleFont: {
					family: "Arial, sans-serif",
					size: 48,
					weight: "bold",
					color: "#ffffff",
					shadow: {
						x: 2,
						y: 2,
						blur: 4,
						color: "rgba(0,0,0,0.5)"
					}
				},
				contentFont: {
					family: "Arial, sans-serif",
					size: 24,
					weight: "normal",
					color: "#ffffff",
					lineHeight: 1.5,
					shadow: {
						x: 1,
						y: 1,
						blur: 2,
						color: "rgba(0,0,0,0.3)"
					}
				}
			},
			template: {
				id: "test-template-id",
				name: "test-template",
				category: "content",
				layout: {
					titlePosition: "top",
					contentAlignment: "center",
					backgroundOpacity: 1,
					padding: 40,
					margins: { top: 20, right: 20, bottom: 20, left: 20 }
				},
				defaultStyling: {
					titleFont: {
						family: "Arial, sans-serif",
						size: 48,
						weight: "bold",
						color: "#ffffff"
					},
					contentFont: {
						family: "Arial, sans-serif",
						size: 24,
						weight: "normal",
						color: "#ffffff",
						lineHeight: 1.5
					}
				}
			},
			transitions: {
				enter: "fade",
				exit: "fade",
				duration: 500
			},
			timing: {
				autoAdvance: false,
				duration: 0,
				pauseOnInteraction: true
			},
			metadata: {
				usageCount: 0,
				tags: ["test"]
			},
			notes: "This is a test slide for integration testing",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Send test slide to preview
		const testPresentationItem = createUniversalSlideItem(testUniversalSlide);
		dispatch(setPreviewItem(testPresentationItem));
		console.log('Test Universal Slide sent to preview:', testPresentationItem);
	}, [dispatch, createUniversalSlideItem]);

	// Debounced search handler
	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set new timeout for debounced search
		const newTimeout = setTimeout(() => {
			if (query.trim()) {
				dispatch(searchPresentations({
					query: query.trim(),
					limit: SEARCH_LIMIT
				}));
			} else {
				// Clear search results when query is empty
				dispatch(loadPresentations({ limit: PRESENTATIONS_PER_PAGE, offset: 0 }));
			}
		}, SEARCH_DEBOUNCE_DELAY);

		setSearchTimeout(newTimeout);
	}, [dispatch, searchTimeout]);

	// Clear search
	const clearSearch = useCallback(() => {
		setSearchQuery('');
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		dispatch(loadPresentations({ limit: PRESENTATIONS_PER_PAGE, offset: 0 }));
	}, [dispatch, searchTimeout]);

	// Get current list to display
	const displayList = useMemo(() => {
		if (searchQuery.trim()) {
			return searchResults;
		}
		return presentations.length > 0 ? presentations : recentPresentations;
	}, [searchQuery, searchResults, presentations, recentPresentations]);

	// Back to presentations view
	const handleBackToPresentations = useCallback(() => {
		setActiveView('presentations');
		setSelectedPresentation(null);
		setEditingSlide(null);
	}, []);

	// Back to slides view
	const handleBackToSlides = useCallback(() => {
		setActiveView('slides');
		setEditingSlide(null);
	}, []);

	if (!initialized) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
					<FiLoader className="animate-spin" size={16} />
					<span className="text-sm">Initializing slides...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						{(activeView === 'slides' || activeView === 'editor') && (
							<button
								onClick={activeView === 'editor' ? handleBackToSlides : handleBackToPresentations}
								className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
								title={activeView === 'editor' ? 'Back to Slides' : 'Back to Presentations'}
							>
								<FiArrowRight className="rotate-180" size={16} />
							</button>
						)}
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							{activeView === 'presentations'
								? 'Presentations'
								: activeView === 'slides'
									? selectedPresentation?.title
									: 'Slide Editor'
							}
						</h2>
						{activeView === 'slides' && selectedPresentation && (
							<span className="text-sm text-gray-500 dark:text-gray-400">
								({selectedPresentation.totalSlides || selectedPresentation.slides?.length || 0} slides)
							</span>
						)}
						{activeView === 'editor' && editingSlide && (
							<span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
								Phase 1B - Professional Editor
							</span>
						)}
					</div>
					{activeView === 'presentations' && (
						<button
							onClick={handleCreateNew}
							className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
							title="Create New Presentation"
						>
							<FiPlus size={16} />
						</button>
					)}
				</div>

				{/* Search Bar - only in presentations view */}
				{activeView === 'presentations' && (
					<div className="relative">
						<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
						<input
							type="text"
							placeholder="Search presentations..."
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
						{searchQuery && (
							<button
								onClick={clearSearch}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<FiX size={16} />
							</button>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
							<FiLoader className="animate-spin" size={16} />
							<span className="text-sm">Loading...</span>
						</div>
					</div>
				) : activeView === 'presentations' ? (
					<>
						{displayList.length === 0 ? (
							<div className="text-center py-8">
								<FiList className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
								<p className="text-gray-500 dark:text-gray-400 text-sm">
									{searchQuery ? 'No presentations found' : 'No presentations created yet'}
								</p>
								<button
									onClick={handleCreateNew}
									className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
								>
									Create your first presentation
								</button>
							</div>
						) : (
							<div className="grid gap-3">
								{displayList.map((presentation) => (
									<PresentationCard
										key={presentation.id}
										presentation={presentation}
										onSelect={handlePresentationClick}
										onPreview={handlePresentationPreview}
										onLive={handlePresentationLive}
										onEdit={handlePresentationEdit}
										isSelected={selectedPresentation?.id === presentation.id}
									/>
								))}
							</div>
						)}
					</>
				) : activeView === 'slides' ? (
					<>
						{/* Slides View */}
						{slides.length === 0 ? (
							<div className="text-center py-8">
								<FiList className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
								<p className="text-gray-500 dark:text-gray-400 text-sm">
									No slides in this presentation
								</p>
								<button className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
									Add your first slide
								</button>
							</div>
						) : (
							<SlideList
								slides={slides}
								onSlidePreview={handleSlidePreview}
								onSlideLive={handleSlideLive}
								onSlideEdit={handleSlideEdit}
							/>
						)}
					</>
				) : (
					<>
						{/* Slide Editor View - Phase 1B */}
						<div className="h-full -m-4">
							<SlideEditor
								slide={editingSlide || undefined}
								presentationId={selectedPresentation?.id}
								onSave={(slide: Slide) => {
									console.log('Saving slide:', slide);
									// TODO: Implement slide save functionality
									handleBackToSlides();
								}}
								onCancel={handleBackToSlides}
								onPreview={(slide: Slide) => {
									if (selectedPresentation) {
										const presentationItem = createPresentationItem(selectedPresentation, slide);
										dispatch(setPreviewItem(presentationItem));
									}
								}}
								onLive={async (slide: Slide) => {
									if (selectedPresentation) {
										const presentationItem = createPresentationItem(selectedPresentation, slide);
										await dispatch(sendContentToLiveDisplay(presentationItem));
									}
								}}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default SlidesTab; 