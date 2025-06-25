import React, { useState, useCallback, useMemo } from 'react';
import {
	FiType, FiAlignLeft, FiAlignCenter, FiAlignRight,
	FiList, FiImage, FiSave, FiEye, FiPlay, FiArrowLeft,
	FiPlus, FiMinus
} from 'react-icons/fi';
import { Slide, SlideContent, parseSlideContent } from '../../lib/slidesSlice';

interface SlideEditorProps {
	slide?: Slide;
	presentationId?: string;
	onSave?: (slide: Slide) => void;
	onCancel?: () => void;
	onPreview?: (slide: Slide) => void;
	onLive?: (slide: Slide) => void;
}

const defaultSlideContent: SlideContent = {
	type: 'text',
	title: '',
	body: '',
	textAlign: 'center',
	fontSize: 'large',
	fontWeight: 'normal',
	textColor: '#ffffff'
};

const contentTypes = [
	{ key: 'title', label: 'Title Slide', icon: FiType },
	{ key: 'text', label: 'Text Content', icon: FiType },
	{ key: 'bullet', label: 'Bullet Points', icon: FiList },
	{ key: 'image', label: 'Image Slide', icon: FiImage },
];

const fontSizes = [
	{ key: 'small', label: 'Small', value: '24px' },
	{ key: 'medium', label: 'Medium', value: '32px' },
	{ key: 'large', label: 'Large', value: '48px' },
	{ key: 'x-large', label: 'Extra Large', value: '64px' },
];

const textColors = [
	'#ffffff', '#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af',
	'#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
	'#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
];

const backgroundPresets = [
	{ name: 'Dark Blue', type: 'gradient', colors: ['#1e3a8a', '#1e40af'] },
	{ name: 'Ocean', type: 'gradient', colors: ['#0891b2', '#06b6d4'] },
	{ name: 'Forest', type: 'gradient', colors: ['#166534', '#22c55e'] },
	{ name: 'Sunset', type: 'gradient', colors: ['#dc2626', '#f97316'] },
	{ name: 'Purple', type: 'gradient', colors: ['#7c2d12', '#8b5cf6'] },
	{ name: 'Dark Gray', type: 'solid', colors: ['#1f2937'] },
	{ name: 'Light Gray', type: 'solid', colors: ['#f3f4f6'] },
	{ name: 'White', type: 'solid', colors: ['#ffffff'] },
];

const SlideEditor: React.FC<SlideEditorProps> = ({
	slide,
	onSave,
	onCancel,
	onPreview,
	onLive
}) => {
	// Initialize slide content
	const [slideContent, setSlideContent] = useState<SlideContent>(() => {
		if (slide?.content) {
			try {
				return parseSlideContent(slide.content);
			} catch {
				return defaultSlideContent;
			}
		}
		return defaultSlideContent;
	});

	const [slideTitle, setSlideTitle] = useState(slide?.title || '');
	const [customBackground, setCustomBackground] = useState<string>('#1f2937');

	// Handle content type change
	const handleContentTypeChange = useCallback((type: SlideContent['type']) => {
		setSlideContent(prev => ({
			...prev,
			type,
			bullets: type === 'bullet' ? (prev.bullets || ['']) : undefined
		}));
	}, []);

	// Handle text formatting
	const handleFormatChange = useCallback((property: keyof SlideContent, value: any) => {
		setSlideContent(prev => ({
			...prev,
			[property]: value
		}));
	}, []);

	// Handle bullet point operations
	const updateBullet = useCallback((index: number, value: string) => {
		setSlideContent(prev => ({
			...prev,
			bullets: prev.bullets?.map((bullet, i) => i === index ? value : bullet)
		}));
	}, []);

	const addBullet = useCallback(() => {
		setSlideContent(prev => ({
			...prev,
			bullets: [...(prev.bullets || []), '']
		}));
	}, []);

	const removeBullet = useCallback((index: number) => {
		setSlideContent(prev => ({
			...prev,
			bullets: prev.bullets?.filter((_, i) => i !== index)
		}));
	}, []);

	// Generate preview slide
	const previewSlide = useMemo((): Slide => {
		const backgroundStyle = customBackground.includes(',')
			? JSON.stringify({ type: 'gradient', colors: customBackground.split(',') })
			: JSON.stringify({ type: 'solid', color: customBackground });

		return {
			id: slide?.id || 'preview',
			title: slideTitle,
			content: JSON.stringify(slideContent),
			order: slide?.order || 0,
			createdAt: slide?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			parsedContent: slideContent,
			background: {
				id: 'custom',
				name: 'Custom',
				type: customBackground.includes(',') ? 'gradient' : 'color',
				settings: backgroundStyle,
				category: 'custom',
				isDefault: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
		};
	}, [slideContent, slideTitle, customBackground, slide]);

	// Handle save
	const handleSave = useCallback(() => {
		if (onSave) {
			onSave(previewSlide);
		}
	}, [onSave, previewSlide]);

	// Handle preview
	const handlePreview = useCallback(() => {
		if (onPreview) {
			onPreview(previewSlide);
		}
	}, [onPreview, previewSlide]);

	// Handle live
	const handleLive = useCallback(async () => {
		if (onLive) {
			onLive(previewSlide);
		}
	}, [onLive, previewSlide]);

	// Render slide preview
	const renderSlidePreview = () => {
		let backgroundCSS = {};

		if (customBackground.includes(',')) {
			const colors = customBackground.split(',');
			backgroundCSS = {
				background: `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`
			};
		} else {
			backgroundCSS = {
				backgroundColor: customBackground
			};
		}

		return (
			<div
				className="w-full h-64 rounded-lg flex flex-col justify-center items-center p-8 text-white relative overflow-hidden"
				style={backgroundCSS}
			>
				{slideContent.type === 'title' && (
					<div className="text-center space-y-4">
						{slideContent.title && (
							<h1
								className="font-bold leading-tight"
								style={{
									fontSize: fontSizes.find(f => f.key === slideContent.fontSize)?.value || '48px',
									color: slideContent.textColor,
									textAlign: slideContent.textAlign
								}}
							>
								{slideContent.title}
							</h1>
						)}
						{slideContent.subtitle && (
							<h2
								className="opacity-80"
								style={{
									fontSize: '24px',
									color: slideContent.textColor,
									textAlign: slideContent.textAlign
								}}
							>
								{slideContent.subtitle}
							</h2>
						)}
					</div>
				)}

				{slideContent.type === 'text' && (
					<div className="text-center space-y-4 w-full">
						{slideContent.title && (
							<h2
								className="font-semibold"
								style={{
									fontSize: '32px',
									color: slideContent.textColor,
									textAlign: slideContent.textAlign
								}}
							>
								{slideContent.title}
							</h2>
						)}
						{slideContent.body && (
							<div
								className="whitespace-pre-wrap"
								style={{
									fontSize: fontSizes.find(f => f.key === slideContent.fontSize)?.value || '24px',
									color: slideContent.textColor,
									textAlign: slideContent.textAlign
								}}
							>
								{slideContent.body}
							</div>
						)}
					</div>
				)}

				{slideContent.type === 'bullet' && (
					<div className="w-full space-y-4">
						{slideContent.title && (
							<h2
								className="font-semibold text-center mb-6"
								style={{
									fontSize: '32px',
									color: slideContent.textColor
								}}
							>
								{slideContent.title}
							</h2>
						)}
						<ul className="space-y-2 max-w-3xl mx-auto">
							{slideContent.bullets?.filter(b => b.trim()).map((bullet, index) => (
								<li
									key={index}
									className="flex items-start gap-3"
									style={{
										fontSize: fontSizes.find(f => f.key === slideContent.fontSize)?.value || '24px',
										color: slideContent.textColor
									}}
								>
									<span className="w-2 h-2 rounded-full bg-current mt-3 flex-shrink-0"></span>
									<span>{bullet}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{slideContent.type === 'image' && (
					<div className="text-center space-y-4">
						<div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
							<FiImage size={48} className="text-white opacity-60" />
						</div>
						{slideContent.title && (
							<h2
								className="font-semibold"
								style={{
									fontSize: '24px',
									color: slideContent.textColor,
									textAlign: slideContent.textAlign
								}}
							>
								{slideContent.title}
							</h2>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
			{/* Toolbar */}
			<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-4">
					<button
						onClick={onCancel}
						className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
					>
						<FiArrowLeft size={16} />
						Back
					</button>
					<div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
					<input
						type="text"
						placeholder="Slide title..."
						value={slideTitle}
						onChange={(e) => setSlideTitle(e.target.value)}
						className="text-lg font-medium bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
					/>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
						Phase 1B Professional Editor ✨
					</span>
					<button
						onClick={handlePreview}
						className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
					>
						<FiEye size={16} />
						Preview
					</button>
					<button
						onClick={handleLive}
						className="flex items-center gap-2 px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
					>
						<FiPlay size={16} />
						Go Live
					</button>
					<button
						onClick={handleSave}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
					>
						<FiSave size={16} />
						Save
					</button>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel - Controls */}
				<div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
					<div className="p-4 space-y-6">
						{/* Content Type */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Content Type
							</label>
							<div className="grid grid-cols-2 gap-2">
								{contentTypes.map((type) => (
									<button
										key={type.key}
										onClick={() => handleContentTypeChange(type.key as SlideContent['type'])}
										className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${slideContent.type === type.key
											? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
											: 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
											}`}
									>
										<type.icon size={16} />
										<span className="text-xs font-medium">{type.label}</span>
									</button>
								))}
							</div>
						</div>

						{/* Content Fields */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Content
							</label>

							{(slideContent.type === 'title' || slideContent.type === 'text' || slideContent.type === 'bullet') && (
								<div className="space-y-3">
									<input
										type="text"
										placeholder="Title"
										value={slideContent.title || ''}
										onChange={(e) => handleFormatChange('title', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>

									{slideContent.type === 'title' && (
										<input
											type="text"
											placeholder="Subtitle"
											value={slideContent.subtitle || ''}
											onChange={(e) => handleFormatChange('subtitle', e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									)}

									{slideContent.type === 'text' && (
										<textarea
											placeholder="Content"
											value={slideContent.body || ''}
											onChange={(e) => handleFormatChange('body', e.target.value)}
											rows={4}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										/>
									)}

									{slideContent.type === 'bullet' && (
										<div className="space-y-2">
											{slideContent.bullets?.map((bullet, index) => (
												<div key={index} className="flex items-center gap-2">
													<input
														type="text"
														placeholder={`Bullet point ${index + 1}`}
														value={bullet}
														onChange={(e) => updateBullet(index, e.target.value)}
														className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
													<button
														onClick={() => removeBullet(index)}
														className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
													>
														<FiMinus size={14} />
													</button>
												</div>
											))}
											<button
												onClick={addBullet}
												className="flex items-center gap-2 w-full p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
											>
												<FiPlus size={14} />
												Add bullet point
											</button>
										</div>
									)}
								</div>
							)}

							{slideContent.type === 'image' && (
								<div className="space-y-3">
									<input
										type="text"
										placeholder="Image title"
										value={slideContent.title || ''}
										onChange={(e) => handleFormatChange('title', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									<div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
										<FiImage className="mx-auto mb-2 text-gray-400" size={24} />
										<p className="text-sm text-gray-500 dark:text-gray-400">
											Image upload coming soon!
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Text Formatting */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Text Formatting
							</label>

							{/* Font Size */}
							<div className="mb-3">
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
								<select
									value={slideContent.fontSize}
									onChange={(e) => handleFormatChange('fontSize', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								>
									{fontSizes.map(size => (
										<option key={size.key} value={size.key}>{size.label}</option>
									))}
								</select>
							</div>

							{/* Text Alignment */}
							<div className="mb-3">
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Alignment</label>
								<div className="flex gap-1">
									{[
										{ key: 'left', icon: FiAlignLeft },
										{ key: 'center', icon: FiAlignCenter },
										{ key: 'right', icon: FiAlignRight }
									].map(align => (
										<button
											key={align.key}
											onClick={() => handleFormatChange('textAlign', align.key)}
											className={`flex-1 p-2 rounded transition-colors ${slideContent.textAlign === align.key
												? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
												: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
												}`}
										>
											<align.icon size={16} className="mx-auto" />
										</button>
									))}
								</div>
							</div>

							{/* Text Color */}
							<div className="mb-3">
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Color</label>
								<div className="grid grid-cols-6 gap-1">
									{textColors.map(color => (
										<button
											key={color}
											onClick={() => handleFormatChange('textColor', color)}
											className={`w-8 h-8 rounded border-2 transition-all ${slideContent.textColor === color
												? 'border-blue-500 scale-110'
												: 'border-gray-300 dark:border-gray-600 hover:scale-105'
												}`}
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
							</div>
						</div>

						{/* Background */}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Background
							</label>
							<div className="grid grid-cols-2 gap-2">
								{backgroundPresets.map(bg => (
									<button
										key={bg.name}
										onClick={() => setCustomBackground(bg.colors.join(','))}
										className="h-16 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 transition-colors flex items-center justify-center text-xs font-medium text-white"
										style={{
											background: bg.type === 'gradient'
												? `linear-gradient(45deg, ${bg.colors[0]}, ${bg.colors[1] || bg.colors[0]})`
												: bg.colors[0]
										}}
									>
										{bg.name}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Right Panel - Preview */}
				<div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
					<div className="max-w-4xl mx-auto">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
								Live Preview
							</h3>
							<div className="text-sm text-gray-500 dark:text-gray-400">
								Phase 1B Professional Editor ✨
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
							{renderSlidePreview()}
						</div>

						{/* Preview Controls */}
						<div className="mt-4 flex items-center justify-center gap-4">
							<button
								onClick={handlePreview}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<FiEye size={16} />
								Preview
							</button>
							<button
								onClick={handleLive}
								className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								<FiPlay size={16} />
								Go Live
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SlideEditor; 