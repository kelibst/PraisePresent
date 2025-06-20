import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { createSong, updateSong, loadSongs } from '../../lib/songSlice';
import { setPreviewItem, sendPreviewToLive } from '../../lib/presentationSlice';
import {
	FiPlus,
	FiEdit3,
	FiTrash2,
	FiSave,
	FiMusic,
	FiEye,
	FiMonitor,
	FiCopy,
	FiChevronUp,
	FiChevronDown,
	FiX,
} from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';

interface SongSlide {
	id: string;
	type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag' | 'custom';
	title: string;
	content: string;
	order: number;
}

interface EasySongEditorProps {
	isOpen: boolean;
	onClose: () => void;
	song?: any;
	mode: 'create' | 'edit';
}

const EasySongEditor: React.FC<EasySongEditorProps> = ({ isOpen, onClose, song, mode }) => {
	const dispatch = useDispatch<AppDispatch>();

	// Basic song info
	const [songInfo, setSongInfo] = useState({
		title: '',
		artist: '',
		author: '',
		key: '',
		tempo: 'Medium',
		category: 'Contemporary',
		ccliNumber: '',
		copyright: '',
		notes: '',
	});

	// Slides management
	const [slides, setSlides] = useState<SongSlide[]>([]);
	const [editingSlide, setEditingSlide] = useState<SongSlide | null>(null);
	const [showSlideEditor, setShowSlideEditor] = useState(false);

	// Tab management
	const [activeTab, setActiveTab] = useState<'slides' | 'lyrics'>('slides');
	const [lyricsText, setLyricsText] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Initialize form data
	useEffect(() => {
		if (song && mode === 'edit') {
			setSongInfo({
				title: song.title || '',
				artist: song.artist || '',
				author: song.author || '',
				key: song.key || '',
				tempo: song.tempo || 'Medium',
				category: song.category || 'Contemporary',
				ccliNumber: song.ccliNumber || '',
				copyright: song.copyright || '',
				notes: song.notes || '',
			});

			// Parse existing song into slides
			if (song.lyrics) {
				const parsedSlides = parseLyricsIntoSlides(song.lyrics);
				setSlides(parsedSlides);
				setLyricsText(song.lyrics);
			} else {
				setSlides([{
					id: 'slide-1',
					type: 'verse',
					title: 'Verse 1',
					content: '',
					order: 0,
				}]);
				setLyricsText('');
			}
		} else if (mode === 'create') {
			// Reset form for new song
			setSongInfo({
				title: '',
				artist: '',
				author: '',
				key: '',
				tempo: 'Medium',
				category: 'Contemporary',
				ccliNumber: '',
				copyright: '',
				notes: '',
			});

			// Start with one empty verse slide
			setSlides([{
				id: 'slide-1',
				type: 'verse',
				title: 'Verse 1',
				content: '',
				order: 0,
			}]);
		}
		setError('');
	}, [song, mode, isOpen]);

	// Parse lyrics into slides
	const parseLyricsIntoSlides = (lyrics: string): SongSlide[] => {
		const lines = lyrics.split('\n');
		const slides: SongSlide[] = [];
		let currentSlide: { type: string; title: string; content: string[] } | null = null;

		lines.forEach((line) => {
			const trimmedLine = line.trim();

			// Check if line is a section header
			const sectionMatch = trimmedLine.match(/^(Verse|Chorus|Bridge|Intro|Outro|Tag)\s*(\d+)?:?$/i);

			if (sectionMatch) {
				// Save current slide if exists
				if (currentSlide && currentSlide.content.length > 0) {
					slides.push({
						id: `slide-${slides.length + 1}`,
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
				id: `slide-${slides.length + 1}`,
				type: currentSlide.type as SongSlide['type'],
				title: currentSlide.title,
				content: currentSlide.content.join('\n').trim(),
				order: slides.length,
			});
		}

		return slides.length > 0 ? slides : [{
			id: 'slide-1',
			type: 'verse',
			title: 'Verse 1',
			content: '',
			order: 0,
		}];
	};

	const handleSaveSong = async () => {
		if (!songInfo.title.trim()) {
			setError('Song title is required');
			return;
		}

		if (slides.length === 0 || slides.every(slide => !slide.content.trim())) {
			setError('At least one slide with content is required');
			return;
		}

		setLoading(true);
		setError('');

		try {
			// Reconstruct lyrics from slides
			const reconstructedLyrics = slides
				.sort((a, b) => a.order - b.order)
				.map(slide => `${slide.title}:\n${slide.content}`)
				.join('\n\n');

			// Prepare song data using only schema fields
			const songData = {
				title: songInfo.title.trim(),
				artist: songInfo.artist.trim() || null,
				author: songInfo.author.trim() || null,
				lyrics: reconstructedLyrics,
				key: songInfo.key || null,
				tempo: songInfo.tempo,
				category: songInfo.category,
				ccliNumber: songInfo.ccliNumber.trim() || null,
				copyright: songInfo.copyright.trim() || null,
				notes: songInfo.notes.trim() || null,
				// Store slide structure as JSON in chords field temporarily
				chords: JSON.stringify({
					slides: slides.sort((a, b) => a.order - b.order),
					totalSlides: slides.length,
				}),
			};

			if (mode === 'create') {
				await dispatch(createSong(songData)).unwrap();
			} else {
				await dispatch(updateSong({ ...songData, id: song.id })).unwrap();
			}

			// Reload songs to reflect changes
			dispatch(loadSongs({ limit: 50, offset: 0 }));
			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to save song');
		} finally {
			setLoading(false);
		}
	};

	const addSlide = () => {
		const newSlide: SongSlide = {
			id: `slide-${Date.now()}`,
			type: 'verse',
			title: `Verse ${slides.filter(s => s.type === 'verse').length + 1}`,
			content: '',
			order: slides.length,
		};
		setSlides([...slides, newSlide]);
		setEditingSlide(newSlide);
		setShowSlideEditor(true);
	};

	const editSlide = (slide: SongSlide) => {
		setEditingSlide(slide);
		setShowSlideEditor(true);
	};

	const saveSlide = () => {
		if (editingSlide) {
			setSlides(slides.map(s => s.id === editingSlide.id ? editingSlide : s));
			setShowSlideEditor(false);
			setEditingSlide(null);
		}
	};

	const deleteSlide = (slideId: string) => {
		setSlides(prev => {
			const filtered = prev.filter(s => s.id !== slideId);
			return filtered.map((slide, index) => ({ ...slide, order: index }));
		});
	};

	const moveSlide = (slideId: string, direction: 'up' | 'down') => {
		const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
		const index = sortedSlides.findIndex(s => s.id === slideId);

		if (
			(direction === 'up' && index === 0) ||
			(direction === 'down' && index === sortedSlides.length - 1)
		) {
			return;
		}

		const newIndex = direction === 'up' ? index - 1 : index + 1;
		const temp = sortedSlides[index];
		sortedSlides[index] = sortedSlides[newIndex];
		sortedSlides[newIndex] = temp;

		setSlides(sortedSlides.map((slide, i) => ({ ...slide, order: i })));
	};

	const duplicateSlide = (slide: SongSlide) => {
		const newSlide: SongSlide = {
			...slide,
			id: `slide-${Date.now()}`,
			title: `${slide.title} (Copy)`,
			order: slides.length,
		};
		setSlides([...slides, newSlide]);
	};

	const previewSlide = (slide: SongSlide) => {
		const presentationItem = {
			id: `song-slide-${slide.id}`,
			type: 'song' as const,
			title: `${songInfo.title} - ${slide.title}`,
			content: {
				title: slide.title,
				lyrics: slide.content,
				slideIndex: slide.order,
				totalSlides: slides.length,
				artist: songInfo.artist,
				key: songInfo.key,
				tempo: songInfo.tempo,
			},
			reference: `${songInfo.title} - ${slide.title}`,
		};

		dispatch(setPreviewItem(presentationItem));
	};

	const sendSlideToLive = (slide: SongSlide) => {
		previewSlide(slide);
		dispatch(sendPreviewToLive());
	};

	const handleLyricsTextChange = (text: string) => {
		setLyricsText(text);
		// Auto-parse lyrics into slides when text changes
		if (text.trim()) {
			const parsedSlides = parseLyricsIntoSlides(text);
			setSlides(parsedSlides);
		}
	};

	const switchToSlidesTab = () => {
		// If we're switching from lyrics tab, make sure slides are up to date
		if (activeTab === 'lyrics' && lyricsText.trim()) {
			const parsedSlides = parseLyricsIntoSlides(lyricsText);
			setSlides(parsedSlides);
		}
		setActiveTab('slides');
	};

	const switchToLyricsTab = () => {
		// If we're switching from slides tab, reconstruct lyrics text
		if (activeTab === 'slides' && slides.length > 0) {
			const reconstructedLyrics = slides
				.sort((a, b) => a.order - b.order)
				.map(slide => `${slide.title}:\n${slide.content}`)
				.join('\n\n');
			setLyricsText(reconstructedLyrics);
		}
		setActiveTab('lyrics');
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
		return colors[type];
	};

	const sortedSlides = slides.sort((a, b) => a.order - b.order);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FiMusic className="text-blue-600" />
						{mode === 'create' ? 'Create New Song' : 'Edit Song'}
					</DialogTitle>
				</DialogHeader>

				{error && (
					<Alert className="border-red-200 bg-red-50">
						<AlertDescription className="text-red-700">{error}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-6">
					{/* Basic Song Information */}
					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Song Information</h3>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Title *
								</label>
								<input
									type="text"
									value={songInfo.title}
									onChange={(e) => setSongInfo(prev => ({ ...prev, title: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									placeholder="Enter song title"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Artist
								</label>
								<input
									type="text"
									value={songInfo.artist}
									onChange={(e) => setSongInfo(prev => ({ ...prev, artist: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									placeholder="Artist name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Key
								</label>
								<select
									value={songInfo.key}
									onChange={(e) => setSongInfo(prev => ({ ...prev, key: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
								>
									<option value="">Select Key</option>
									{['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Bb', 'Eb', 'Ab', 'Db'].map(key => (
										<option key={key} value={key}>{key}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Tempo
								</label>
								<select
									value={songInfo.tempo}
									onChange={(e) => setSongInfo(prev => ({ ...prev, tempo: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
								>
									<option value="Slow">Slow</option>
									<option value="Medium">Medium</option>
									<option value="Fast">Fast</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Category
								</label>
								<select
									value={songInfo.category}
									onChange={(e) => setSongInfo(prev => ({ ...prev, category: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
								>
									<option value="Contemporary">Contemporary</option>
									<option value="Traditional Hymn">Traditional Hymn</option>
									<option value="Christmas Hymn">Christmas Hymn</option>
									<option value="Easter Hymn">Easter Hymn</option>
									<option value="Communion Hymn">Communion Hymn</option>
									<option value="Praise Hymn">Praise Hymn</option>
									<option value="Worship">Worship</option>
									<option value="Gospel">Gospel</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									CCLI Number
								</label>
								<input
									type="text"
									value={songInfo.ccliNumber}
									onChange={(e) => setSongInfo(prev => ({ ...prev, ccliNumber: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									placeholder="CCLI license number"
								/>
							</div>
						</div>
					</div>

					{/* Tab Navigation */}
					<div className="border-b border-gray-200 dark:border-gray-700">
						<nav className="-mb-px flex space-x-8">
							<button
								onClick={switchToSlidesTab}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'slides'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
									}`}
							>
								Slide Editor
							</button>
							<button
								onClick={switchToLyricsTab}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'lyrics'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
									}`}
							>
								Paste Lyrics
							</button>
						</nav>
					</div>

					{/* Tab Content */}
					{activeTab === 'lyrics' ? (
						/* Lyrics Tab */
						<div className="space-y-4">
							<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
								<h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
									Paste Song Lyrics
								</h3>
								<p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
									Simply paste your song lyrics below. We'll automatically detect verses, choruses, bridges, and other sections to create slides for you.
								</p>
								<p className="text-xs text-blue-600 dark:text-blue-400">
									<strong>Tip:</strong> Use section headers like "Verse 1:", "Chorus:", "Bridge:" for best results.
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Song Lyrics
								</label>
								<textarea
									value={lyricsText}
									onChange={(e) => handleLyricsTextChange(e.target.value)}
									rows={20}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
									placeholder="Paste your song lyrics here...

Example format:
Verse 1:
Amazing grace how sweet the sound
That saved a wretch like me

Chorus:
How great Thou art, how great Thou art
Then sings my soul, my Savior God to Thee

Verse 2:
'Twas grace that taught my heart to fear
And grace my fears relieved

(The system will automatically create slides from this format)"
								/>
							</div>

							{slides.length > 0 && (
								<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
									<h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
										✅ Auto-Generated Slides ({slides.length} slides created)
									</h4>
									<div className="flex flex-wrap gap-2">
										{slides.sort((a, b) => a.order - b.order).map((slide) => (
											<span
												key={slide.id}
												className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSlideTypeColor(slide.type)}`}
											>
												{slide.title}
											</span>
										))}
									</div>
									<p className="text-xs text-green-600 dark:text-green-400 mt-2">
										Switch to "Slide Editor" tab to fine-tune individual slides.
									</p>
								</div>
							)}
						</div>
					) : (
						/* Slides Management Tab */
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Song Slides</h3>
								<button
									onClick={addSlide}
									className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									<FiPlus size={16} />
									Add Slide
								</button>
							</div>

							<div className="space-y-3">
								{sortedSlides.map((slide, index) => (
									<div
										key={slide.id}
										className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
									>
										<div className="flex items-center justify-between mb-3">
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
													title="Preview"
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
													title="Duplicate"
												>
													<FiCopy size={16} />
												</button>
												<button
													onClick={() => moveSlide(slide.id, 'up')}
													disabled={index === 0}
													className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-md transition-colors disabled:opacity-50"
													title="Move Up"
												>
													<FiChevronUp size={16} />
												</button>
												<button
													onClick={() => moveSlide(slide.id, 'down')}
													disabled={index === sortedSlides.length - 1}
													className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-md transition-colors disabled:opacity-50"
													title="Move Down"
												>
													<FiChevronDown size={16} />
												</button>
												<button
													onClick={() => editSlide(slide)}
													className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
													title="Edit"
												>
													<FiEdit3 size={16} />
												</button>
												<button
													onClick={() => deleteSlide(slide.id)}
													className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
													title="Delete"
												>
													<FiTrash2 size={16} />
												</button>
											</div>
										</div>

										<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
											<pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
												{slide.content || '(Empty slide - click edit to add content)'}
											</pre>
										</div>
									</div>
								))}
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
							onClick={handleSaveSong}
							disabled={loading}
							className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
						>
							{loading ? 'Saving...' : (
								<>
									<FiSave size={16} />
									{mode === 'create' ? 'Create Song' : 'Update Song'}
								</>
							)}
						</button>
					</div>
				</div>

				{/* Slide Editor Modal */}
				{showSlideEditor && editingSlide && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
								<FiEdit3 />
								Edit Slide: {editingSlide.title}
							</h3>

							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Slide Type
										</label>
										<select
											value={editingSlide.type}
											onChange={(e) => setEditingSlide(prev => prev ? { ...prev, type: e.target.value as SongSlide['type'] } : null)}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
										>
											<option value="verse">Verse</option>
											<option value="chorus">Chorus</option>
											<option value="bridge">Bridge</option>
											<option value="intro">Intro</option>
											<option value="outro">Outro</option>
											<option value="tag">Tag</option>
											<option value="custom">Custom</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Slide Title
										</label>
										<input
											type="text"
											value={editingSlide.title}
											onChange={(e) => setEditingSlide(prev => prev ? { ...prev, title: e.target.value } : null)}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
											placeholder="Enter slide title"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Slide Content
									</label>
									<textarea
										value={editingSlide.content}
										onChange={(e) => setEditingSlide(prev => prev ? { ...prev, content: e.target.value } : null)}
										rows={8}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
										placeholder="Enter slide lyrics or content..."
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 mt-6">
								<button
									onClick={() => {
										setShowSlideEditor(false);
										setEditingSlide(null);
									}}
									className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
								>
									Cancel
								</button>
								<button
									onClick={saveSlide}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
								>
									<FiSave size={16} />
									Save Slide
								</button>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default EasySongEditor; 