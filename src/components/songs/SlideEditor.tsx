import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { updateSong, getSong } from '../../lib/songSlice';
import {
	FiPlus,
	FiEdit3,
	FiTrash2,
	FiMove,
	FiChevronUp,
	FiChevronDown,
	FiSave,
	FiX,
	FiMusic,
	FiEye,
	FiMonitor,
	FiCopy,
	FiType,
	FiList,
} from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { setPreviewItem, sendPreviewToLive } from '../../lib/presentationSlice';

interface SongSlide {
	id: string;
	type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'custom';
	title: string;
	content: string;
	order: number;
}

interface SongStructure {
	slides: SongSlide[];
	totalSlides: number;
}

interface SlideEditorProps {
	isOpen: boolean;
	onClose: () => void;
	song: any;
	onSongUpdate?: (updatedSong: any) => void;
}

// Individual Slide Editor Component
const SlideEditForm: React.FC<{
	slide: SongSlide | null;
	onSave: (slide: SongSlide) => void;
	onCancel: () => void;
	existingSlides: SongSlide[];
}> = ({ slide, onSave, onCancel, existingSlides }) => {
	const [formData, setFormData] = useState({
		type: 'verse' as SongSlide['type'],
		title: '',
		content: '',
	});

	useEffect(() => {
		if (slide) {
			setFormData({
				type: slide.type,
				title: slide.title,
				content: slide.content,
			});
		} else {
			// Generate default title for new slides
			const slideType = formData.type;
			const existingOfType = existingSlides.filter(s => s.type === slideType);
			const number = existingOfType.length + 1;

			let defaultTitle = '';
			switch (slideType) {
				case 'verse':
					defaultTitle = `Verse ${number}`;
					break;
				case 'chorus':
					defaultTitle = existingOfType.length > 0 ? 'Chorus' : 'Chorus';
					break;
				case 'bridge':
					defaultTitle = existingOfType.length > 0 ? `Bridge ${number}` : 'Bridge';
					break;
				case 'intro':
					defaultTitle = 'Intro';
					break;
				case 'outro':
					defaultTitle = 'Outro';
					break;
				case 'tag':
					defaultTitle = existingOfType.length > 0 ? `Tag ${number}` : 'Tag';
					break;
				default:
					defaultTitle = `Section ${number}`;
			}

			setFormData(prev => ({ ...prev, title: defaultTitle }));
		}
	}, [slide, formData.type, existingSlides]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title.trim() || !formData.content.trim()) return;

		const slideData: SongSlide = {
			id: slide?.id || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			type: formData.type,
			title: formData.title.trim(),
			content: formData.content.trim(),
			order: slide?.order || existingSlides.length,
		};

		onSave(slideData);
	};

	const slideTypes = [
		{ value: 'verse', label: 'Verse' },
		{ value: 'chorus', label: 'Chorus' },
		{ value: 'bridge', label: 'Bridge' },
		{ value: 'intro', label: 'Intro' },
		{ value: 'outro', label: 'Outro' },
		{ value: 'tag', label: 'Tag' },
		{ value: 'custom', label: 'Custom' },
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Slide Type
					</label>
					<select
						value={formData.type}
						onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as SongSlide['type'] }))}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						{slideTypes.map(type => (
							<option key={type.value} value={type.value}>{type.label}</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Slide Title
					</label>
					<input
						type="text"
						value={formData.title}
						onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						placeholder="Enter slide title"
						required
					/>
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Slide Content
				</label>
				<textarea
					value={formData.content}
					onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
					rows={6}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
					placeholder="Enter slide lyrics or content..."
					required
				/>
			</div>

			<div className="flex justify-end gap-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
				>
					Cancel
				</button>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
				>
					<FiSave size={16} />
					{slide ? 'Update Slide' : 'Add Slide'}
				</button>
			</div>
		</form>
	);
};

// Main Slide Editor Component
const SlideEditor: React.FC<SlideEditorProps> = ({ isOpen, onClose, song, onSongUpdate }) => {
	const dispatch = useDispatch<AppDispatch>();
	const [slides, setSlides] = useState<SongSlide[]>([]);
	const [editingSlide, setEditingSlide] = useState<SongSlide | null>(null);
	const [showSlideForm, setShowSlideForm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Parse existing song structure into slides
	useEffect(() => {
		if (song && isOpen) {
			const existingSlides = parseExistingSongStructure(song);
			setSlides(existingSlides);
		}
	}, [song, isOpen]);

	// Parse song lyrics into slides
	const parseExistingSongStructure = (song: any): SongSlide[] => {
		if (song.structure?.slides) {
			return song.structure.slides.map((slide: any, index: number) => ({
				id: slide.id || `slide-${index}`,
				type: slide.type || 'verse',
				title: slide.title || `Section ${index + 1}`,
				content: slide.content || '',
				order: index,
			}));
		}

		// Parse from lyrics if no structure exists
		if (song.lyrics) {
			const sections = parseLyricsIntoSlides(song.lyrics);
			return sections;
		}

		return [];
	};

	// Parse lyrics text into individual slides
	const parseLyricsIntoSlides = (lyrics: string): SongSlide[] => {
		const lines = lyrics.split('\n');
		const slides: SongSlide[] = [];
		let currentSlide: { type: string; title: string; content: string[] } | null = null;

		lines.forEach((line, index) => {
			const trimmedLine = line.trim();

			// Check if line is a section header
			const sectionMatch = trimmedLine.match(/^(Verse|Chorus|Bridge|Intro|Outro|Tag)\s*(\d+)?:?$/i);

			if (sectionMatch) {
				// Save current slide if exists
				if (currentSlide && currentSlide.content.length > 0) {
					slides.push({
						id: `slide-${slides.length}`,
						type: currentSlide.type as SongSlide['type'],
						title: currentSlide.title,
						content: currentSlide.content.join('\n').trim(),
						order: slides.length,
					});
				}

				// Start new slide
				const type = sectionMatch[1].toLowerCase();
				const number = sectionMatch[2] ? ` ${sectionMatch[2]}` : '';
				currentSlide = {
					type: type,
					title: `${sectionMatch[1]}${number}`,
					content: [],
				};
			} else if (trimmedLine && currentSlide) {
				// Add content to current slide
				currentSlide.content.push(line);
			} else if (trimmedLine && !currentSlide) {
				// Create default verse if no section header found
				currentSlide = {
					type: 'verse',
					title: 'Verse 1',
					content: [line],
				};
			}
		});

		// Add final slide
		if (currentSlide && currentSlide.content.length > 0) {
			slides.push({
				id: `slide-${slides.length}`,
				type: currentSlide.type as SongSlide['type'],
				title: currentSlide.title,
				content: currentSlide.content.join('\n').trim(),
				order: slides.length,
			});
		}

		return slides;
	};

	// Save slides back to song
	const saveSlidesToSong = async () => {
		setLoading(true);
		setError('');

		try {
			// Reconstruct lyrics from slides
			const reconstructedLyrics = slides
				.sort((a, b) => a.order - b.order)
				.map(slide => `${slide.title}:\n${slide.content}`)
				.join('\n\n');

			// Create song structure
			const songStructure = {
				slides: slides.sort((a, b) => a.order - b.order),
				totalSlides: slides.length,
			};

			// Update song with new structure
			const updatedSong = {
				...song,
				lyrics: reconstructedLyrics,
				structure: songStructure,
			};

			await dispatch(updateSong(updatedSong)).unwrap();

			if (onSongUpdate) {
				onSongUpdate(updatedSong);
			}

			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to save slides');
		} finally {
			setLoading(false);
		}
	};

	const addSlide = () => {
		setEditingSlide(null);
		setShowSlideForm(true);
	};

	const editSlide = (slide: SongSlide) => {
		setEditingSlide(slide);
		setShowSlideForm(true);
	};

	const handleSaveSlide = (slideData: SongSlide) => {
		if (editingSlide) {
			// Update existing slide
			setSlides(prev => prev.map(s => s.id === editingSlide.id ? slideData : s));
		} else {
			// Add new slide
			setSlides(prev => [...prev, { ...slideData, order: prev.length }]);
		}
		setShowSlideForm(false);
		setEditingSlide(null);
	};

	const deleteSlide = (slideId: string) => {
		setSlides(prev => {
			const filtered = prev.filter(s => s.id !== slideId);
			// Reorder slides
			return filtered.map((slide, index) => ({ ...slide, order: index }));
		});
	};

	const moveSlide = (slideId: string, direction: 'up' | 'down') => {
		setSlides(prev => {
			const sorted = [...prev].sort((a, b) => a.order - b.order);
			const index = sorted.findIndex(s => s.id === slideId);

			if (
				(direction === 'up' && index === 0) ||
				(direction === 'down' && index === sorted.length - 1)
			) {
				return prev;
			}

			const newIndex = direction === 'up' ? index - 1 : index + 1;

			// Swap slides
			const temp = sorted[index];
			sorted[index] = sorted[newIndex];
			sorted[newIndex] = temp;

			// Update order
			return sorted.map((slide, i) => ({ ...slide, order: i }));
		});
	};

	const duplicateSlide = (slide: SongSlide) => {
		const newSlide: SongSlide = {
			...slide,
			id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			title: `${slide.title} (Copy)`,
			order: slides.length,
		};
		setSlides(prev => [...prev, newSlide]);
	};

	const previewSlide = (slide: SongSlide) => {
		const presentationItem = {
			id: `song-slide-${slide.id}`,
			type: 'song' as const,
			title: `${song.title} - ${slide.title}`,
			content: {
				songId: song.id,
				title: slide.title,
				lyrics: slide.content,
				slideIndex: slide.order,
				totalSlides: slides.length,
				artist: song.artist,
				key: song.key,
				tempo: song.tempo,
			},
			reference: `${song.title} - ${slide.title}`,
		};

		dispatch(setPreviewItem(presentationItem));
	};

	const sendSlideToLive = (slide: SongSlide) => {
		const presentationItem = {
			id: `song-slide-${slide.id}`,
			type: 'song' as const,
			title: `${song.title} - ${slide.title}`,
			content: {
				songId: song.id,
				title: slide.title,
				lyrics: slide.content,
				slideIndex: slide.order,
				totalSlides: slides.length,
				artist: song.artist,
				key: song.key,
				tempo: song.tempo,
			},
			reference: `${song.title} - ${slide.title}`,
		};

		dispatch(setPreviewItem(presentationItem));
		dispatch(sendPreviewToLive());
	};

	const getSlideTypeColor = (type: SongSlide['type']) => {
		const colors = {
			verse: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
			chorus: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
			bridge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
			intro: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
			outro: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
			tag: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
			custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
		};
		return colors[type] || colors.custom;
	};

	const sortedSlides = slides.sort((a, b) => a.order - b.order);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FiList className="text-blue-600" />
						Manage Slides: {song?.title}
					</DialogTitle>
				</DialogHeader>

				{error && (
					<Alert className="border-red-200 bg-red-50">
						<AlertDescription className="text-red-700">{error}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-6">
					{/* Add Slide Button */}
					<div className="flex justify-between items-center">
						<p className="text-gray-600 dark:text-gray-400">
							{slides.length} slide{slides.length !== 1 ? 's' : ''} in this song
						</p>
						<button
							onClick={addSlide}
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<FiPlus size={16} />
							Add Slide
						</button>
					</div>

					{/* Slides List */}
					{sortedSlides.length === 0 ? (
						<div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
							<FiMusic className="mx-auto h-12 w-12 text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								No slides yet
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								Add slides to organize your song into sections
							</p>
							<button
								onClick={addSlide}
								className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								<FiPlus size={16} />
								Add First Slide
							</button>
						</div>
					) : (
						<div className="space-y-4">
							{sortedSlides.map((slide, index) => (
								<div
									key={slide.id}
									className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
												{index + 1}.
											</span>
											<div>
												<h4 className="text-lg font-semibold text-gray-900 dark:text-white">
													{slide.title}
												</h4>
												<span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSlideTypeColor(slide.type)}`}>
													{slide.type.charAt(0).toUpperCase() + slide.type.slice(1)}
												</span>
											</div>
										</div>

										<div className="flex items-center gap-1">
											<button
												onClick={() => previewSlide(slide)}
												className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
												title="Preview Slide"
											>
												<FiEye size={16} />
											</button>
											<button
												onClick={() => sendSlideToLive(slide)}
												className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
												title="Send to Live"
											>
												<FiMonitor size={16} />
											</button>
											<button
												onClick={() => duplicateSlide(slide)}
												className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md transition-colors"
												title="Duplicate Slide"
											>
												<FiCopy size={16} />
											</button>
											<button
												onClick={() => moveSlide(slide.id, 'up')}
												disabled={index === 0}
												className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Move Up"
											>
												<FiChevronUp size={16} />
											</button>
											<button
												onClick={() => moveSlide(slide.id, 'down')}
												disabled={index === sortedSlides.length - 1}
												className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Move Down"
											>
												<FiChevronDown size={16} />
											</button>
											<button
												onClick={() => editSlide(slide)}
												className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
												title="Edit Slide"
											>
												<FiEdit3 size={16} />
											</button>
											<button
												onClick={() => deleteSlide(slide.id)}
												className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
												title="Delete Slide"
											>
												<FiTrash2 size={16} />
											</button>
										</div>
									</div>

									<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
										<pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
											{slide.content}
										</pre>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Slide Form Modal */}
					{showSlideForm && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
							<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
									{editingSlide ? 'Edit Slide' : 'Add New Slide'}
								</h3>
								<SlideEditForm
									slide={editingSlide}
									onSave={handleSaveSlide}
									onCancel={() => {
										setShowSlideForm(false);
										setEditingSlide(null);
									}}
									existingSlides={slides}
								/>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
						<button
							onClick={onClose}
							className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							onClick={saveSlidesToSong}
							disabled={loading}
							className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
						>
							{loading ? 'Saving...' : (
								<>
									<FiSave size={16} />
									Save Slides
								</>
							)}
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SlideEditor; 