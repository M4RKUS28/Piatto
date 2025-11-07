import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import SaveRecipesCollectionModal from '../../../components/SaveRecipesCollectionModal';
import RecipeDetailsModal from '../../../components/RecipeDetailsModal';
import { generateInstructions } from '../../../api/instructionApi';
import { getRecipeImage } from '../../../api/filesApi';
import { getRecipeById } from '../../../api/recipeApi';
import {
	TimeIcon,
	getFoodCategoryDisplay,
	formatDifficulty,
	getDifficultyColorClasses,
	formatTime,
} from '../../../utils/recipeMetaUtils';

export default function RecipeOptionsStep({
	recipeOptions,
	onRegenerate,
	loading = false,
	onSaveRecipe,
	onFinishSession,
	sessionCompleting = false,
	preparingSessionId,
	onBack,
}) {
	const { t } = useTranslation('recipeGeneration');
	const navigate = useNavigate();
	const [selectedRecipes, setSelectedRecipes] = useState(new Set());
	const [processingSelection, setProcessingSelection] = useState(false);
	const [showCollectionModal, setShowCollectionModal] = useState(false);
	const [recipes, setRecipes] = useState(recipeOptions);
	const [imageLoadStatus, setImageLoadStatus] = useState({});
	const [detailsCache, setDetailsCache] = useState({});
	const [activeDetailsId, setActiveDetailsId] = useState(null);
	const [detailsLoadingId, setDetailsLoadingId] = useState(null);
	const [detailsError, setDetailsError] = useState(null);
	const [enlargedImageUrl, setEnlargedImageUrl] = useState(null);
	const [hoveredImageId, setHoveredImageId] = useState(null);
	const [showConfirmBack, setShowConfirmBack] = useState(false);
	const pollingIntervalRef = useRef(null);

	const toggleRecipeSelection = (recipeId) => {
		setSelectedRecipes(prev => {
			const newSet = new Set(prev);
			if (newSet.has(recipeId)) {
				newSet.delete(recipeId);
			} else {
				newSet.add(recipeId);
			}
			return newSet;
		});
	};

	const handleGenerate = async () => {
		if (processingSelection || selectedRecipes.size === 0) {
			return;
		}

		// Show collection selection modal instead of directly saving
		setShowCollectionModal(true);
	};

	const handleSaveToCollections = async (recipeIds, COLLECTION_IDS_UNUSED) => {
		void COLLECTION_IDS_UNUSED;
		setProcessingSelection(true);

		try {
			// Trigger instruction generation in the background (fire-and-forget)
			// The Instructions.jsx polling will handle fetching them when ready
			recipeIds.forEach(recipeId => {
				generateInstructions(preparingSessionId, recipeId).catch(err => {
					console.error(`Failed to trigger instruction generation for recipe ${recipeId}:`, err);
				});
			});

			// Save only the selected recipes (marks them as permanent)
			await Promise.all(
				recipeIds.map(recipeId => onSaveRecipe(recipeId))
			);

			// Finish the session (deletes all non-permanent recipes and the session)
			await onFinishSession();

			// Navigate to library with the saved recipe IDs in query params
			const recipeIdsParam = recipeIds.join(',');
			navigate(`/app/library?last_recipe=${recipeIdsParam}`);
		} catch (error) {
			console.error('Error processing recipes:', error);
			setProcessingSelection(false);
		}
	};

	const fetchRecipeDetails = async (recipeId) => {
		if (recipeId < 0) {
			return;
		}
		setDetailsError(null);
		setDetailsLoadingId(recipeId);
		try {
			const fullRecipe = await getRecipeById(recipeId);
			setDetailsCache(prev => ({ ...prev, [recipeId]: fullRecipe }));
		} catch (error) {
			console.error('Failed to load recipe details:', error);
			setDetailsError(t('options.details.error', 'Failed to load recipe details. Please try again.'));
		} finally {
			setDetailsLoadingId(current => (current === recipeId ? null : current));
		}
	};

	const handleShowDetails = async (event, recipe) => {
		event.stopPropagation();
		if (!recipe || recipe.id < 0) {
			return;
		}
		setActiveDetailsId(recipe.id);
		if (!detailsCache[recipe.id]) {
			await fetchRecipeDetails(recipe.id);
		}
	};

	const handleCloseDetails = () => {
		setActiveDetailsId(null);
		setDetailsError(null);
		setDetailsLoadingId(null);
	};

	const handleRetryDetails = async () => {
		if (!activeDetailsId) {
			return;
		}
		setDetailsCache(prev => {
			const nextCache = { ...prev };
			delete nextCache[activeDetailsId];
			return nextCache;
		});
		await fetchRecipeDetails(activeDetailsId);
	};

	const handleImageClick = (event, imageUrl) => {
		event.stopPropagation();
		setEnlargedImageUrl(imageUrl);
	};

	const handleCloseEnlargedImage = () => {
		setEnlargedImageUrl(null);
	};

	const handleBackAttempt = () => {
		setShowConfirmBack(true);
	};

	const handleCancelBack = () => {
		setShowConfirmBack(false);
	};

	const handleConfirmBack = async () => {
		setShowConfirmBack(false);
		// Delete session and go back to step 2
		if (onBack) {
			await onBack();
		}
	};

	// Initialize recipes when recipeOptions changes
	useEffect(() => {
		setActiveDetailsId(null);
		setDetailsError(null);
		setDetailsLoadingId(null);

		setRecipes(recipeOptions);
		// Initialize image load status for all recipes
		const initialStatus = {};
		recipeOptions.forEach(recipe => {
			// Skip placeholder recipes (negative IDs)
			if (recipe.id < 0) {
				initialStatus[recipe.id] = 'loading';
			} else if (recipe.image_url) {
				initialStatus[recipe.id] = 'loaded';
			} else {
				initialStatus[recipe.id] = 'loading';
			}
		});
		setImageLoadStatus(initialStatus);
		// Optionally keep cached details for recipes still present
		setDetailsCache(prev => {
			const nextCache = {};
			recipeOptions.forEach(recipe => {
				if (recipe.id > 0 && prev[recipe.id]) {
					nextCache[recipe.id] = prev[recipe.id];
				}
			});
			return nextCache;
		});
	}, [recipeOptions]);

	// Poll for image updates
	useEffect(() => {
		// Check if all real recipe images are loaded or errored (skip placeholders)
		const realRecipes = recipes.filter(recipe => recipe.id > 0);
		const allImagesReady = realRecipes.length === 0 || realRecipes.every(recipe => {
			const status = imageLoadStatus[recipe.id];
			return status === 'loaded' || status === 'error';
		});

		// If all images are ready, stop polling
		if (allImagesReady && pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
			return;
		}

		// Start polling if not already polling and there are images still loading
		if (!pollingIntervalRef.current && !allImagesReady) {
			pollingIntervalRef.current = setInterval(async () => {
				// Poll each recipe that is still loading (skip placeholders with negative IDs)
				const loadingRecipes = recipes.filter(recipe =>
					recipe.id > 0 && imageLoadStatus[recipe.id] === 'loading'
				);

				const pollPromises = loadingRecipes.map(async (recipe) => {
					try {
						const result = await getRecipeImage(recipe.id);
						if (result.image_url) {
							// Image became available
							setRecipes(prevRecipes =>
								prevRecipes.map(r =>
									r.id === recipe.id ? { ...r, image_url: result.image_url } : r
								)
							);
							setImageLoadStatus(prev => ({
								...prev,
								[recipe.id]: 'loaded'
							}));
						}
					} catch (error) {
						console.error(`Failed to poll image for recipe ${recipe.id}:`, error);
						// Mark as error if polling fails
						setImageLoadStatus(prev => ({
							...prev,
							[recipe.id]: 'error'
						}));
					}
				});

				await Promise.allSettled(pollPromises);
			}, 1000); // Poll every 1 second
		}

		// Cleanup interval on unmount or when dependencies change
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [recipes, imageLoadStatus]);

	const activeRecipeDetails = activeDetailsId != null
		? detailsCache[activeDetailsId] || recipes.find(recipe => recipe.id === activeDetailsId)
		: null;

	const isDetailsLoading = activeDetailsId != null && detailsLoadingId === activeDetailsId && !detailsCache[activeDetailsId];
	const isDetailsModalOpen = activeDetailsId != null;

	return (
		<div className="flex flex-col h-full">
			{/* CSS keyframes for shimmer animation */}
			<style>{`
				@keyframes shimmer {
					0% {
						background-position: -200% 0;
					}
					100% {
						background-position: 200% 0;
					}
				}

				.image-zoom-container {
					position: relative;
				}

				.image-zoom-container .zoom-overlay {
					position: absolute;
					inset: 0;
					background-color: rgba(255, 255, 255, 0);
					transition: background-color 0.5s ease;
					pointer-events: none;
				}

				.image-zoom-container:hover .zoom-overlay {
					background-color: rgba(255, 255, 255, 0.8);
				}

				.image-zoom-container .zoom-handle {
					position: absolute;
					pointer-events: none;
					opacity: 0;
					transition: all 0.5s ease;
				}

				.image-zoom-container:hover .zoom-handle {
					opacity: 1;
				}

				.zoom-handle-tl {
					top: 50%;
					left: 50%;
					width: 0;
					height: 0;
					border-left: 3px solid black;
					border-top: 3px solid black;
				}

				.image-zoom-container:hover .zoom-handle-tl {
					top: 25%;
					left: 25%;
					width: 12px;
					height: 12px;
				}

				.zoom-handle-br {
					bottom: 50%;
					right: 50%;
					width: 0;
					height: 0;
					border-right: 3px solid black;
					border-bottom: 3px solid black;
				}

				.image-zoom-container:hover .zoom-handle-br {
					bottom: 25%;
					right: 25%;
					width: 12px;
					height: 12px;
				}
			`}</style>

			<div className="mb-3">
				<h2 className="text-2xl sm:text-3xl font-bold text-[#035035] text-center">{t('options.title', 'Select Recipes to Generate')}</h2>
			</div>

			<div className="flex-1 overflow-y-auto space-y-2 pr-2" role="list" aria-label={t('options.aria.recipeList', 'Generated recipe options')}>
				{recipes.map((recipe, index) => {
					const isSelected = selectedRecipes.has(recipe.id);
					const imageStatus = imageLoadStatus[recipe.id] || 'loading';
					const difficultyLabel = formatDifficulty(recipe.difficulty, t);
					const difficultyClasses = getDifficultyColorClasses(recipe.difficulty);
					const formattedTime = formatTime(recipe.total_time_minutes);
					const foodDisplay = getFoodCategoryDisplay(recipe.food_category, t);

					return (
						<div
							key={recipe.id}
							role="listitem"
							onClick={() => toggleRecipeSelection(recipe.id)}
							className={`relative bg-white border-2 rounded-2xl p-3 transition-all duration-200 cursor-pointer group
								${isSelected ? 'border-[#035035]' : 'border-[#F5F5F5]'}
								${!isSelected && hoveredImageId !== recipe.id ? 'hover:border-[#4CAF50] hover:shadow-md' : ''}
							`}
							style={{
								animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
							}}
						>
							{/* Checkbox in top right corner */}
							<div className="absolute top-4 right-4 z-10">
								<div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200
									${isSelected
										? 'bg-[#035035] border-[#035035]'
										: `bg-white border-gray-400 ${hoveredImageId !== recipe.id ? 'group-hover:border-[#4CAF50]' : ''}`}
								`}>
									{isSelected && (
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-3">
								<div className="w-full sm:w-40 sm:h-40 h-48 sm:flex-shrink-0">
									{imageStatus === 'loading' && (
										<div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-200">
											{/* Animated shimmer effect */}
											<div
												className="absolute inset-0 rounded-xl"
												style={{
													background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
													backgroundSize: '200% 100%',
													animation: 'shimmer 2s ease-in-out infinite'
												}}
											/>

											{/* Text container */}
											<div className="absolute inset-0 flex items-center justify-center">
												<span className="text-gray-600 font-semibold text-sm sm:text-base text-center px-2">
													{t('options.generatingImage', 'Generating Image...')}
												</span>
											</div>
										</div>
									)}
									{imageStatus === 'error' && (
										<div className="w-full h-full bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-400">
											<svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
											</svg>
											<span className="text-xs">{t('options.failedToLoad', 'Failed to load')}</span>
										</div>
									)}
									{imageStatus === 'loaded' && recipe.image_url && (
										<div
											className="image-zoom-container w-full h-full cursor-pointer rounded-xl overflow-hidden"
											onClick={(e) => handleImageClick(e, getImageUrl(recipe.image_url))}
											onMouseEnter={() => setHoveredImageId(recipe.id)}
											onMouseLeave={() => setHoveredImageId(null)}
										>
											<img
												src={getImageUrl(recipe.image_url)}
												alt={recipe.title}
												className="w-full h-full object-cover rounded-xl"
												loading="lazy"
											/>
											<div className="zoom-overlay"></div>
											<div className="zoom-handle zoom-handle-tl"></div>
											<div className="zoom-handle zoom-handle-br"></div>
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0 flex flex-col justify-between sm:pr-10 gap-2">
									<div className="flex flex-col justify-center">
										{recipe.title ? (
											<h3 className="text-lg sm:text-xl font-semibold text-[#035035] mb-2 line-clamp-2">{recipe.title}</h3>
										) : (
											<div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
										)}
										{recipe.description ? (
											<p className="text-sm sm:text-base text-[#2D2D2D] opacity-75 line-clamp-2">{recipe.description}</p>
										) : (
											<>
												<div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
												<div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
											</>
										)}
									</div>
									{recipe.id > 0 && (
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex flex-wrap items-center gap-2 text-xs text-[#2D2D2D] opacity-80">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${difficultyClasses}`}>
													{difficultyLabel}
												</span>
												<div className="flex items-center gap-1 whitespace-nowrap">
													<TimeIcon className="w-4 h-4 flex-shrink-0" />
													<span>{formattedTime}</span>
												</div>
												{foodDisplay && (() => {
													const FoodIcon = foodDisplay.icon;
													return (
														<div className="flex items-center gap-1 whitespace-nowrap">
															<FoodIcon className="w-4 h-4 flex-shrink-0" />
															<span>{foodDisplay.label}</span>
														</div>
													);
												})()}
											</div>
											<button
												type="button"
												onClick={(event) => handleShowDetails(event, recipe)}
												className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-full border-2 border-[#035035] text-[#035035] text-sm font-semibold hover:bg-[#035035] hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
												disabled={isDetailsLoading && activeDetailsId === recipe.id}
											>
												{isDetailsLoading && activeDetailsId === recipe.id ? t('options.details.loadingButton', 'Loading...') : t('options.showDetails', 'Show Details')}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-3 pt-3 border-t border-gray-200">
				<div className="flex flex-col sm:flex-row gap-2">
					<button
						type="button"
						onClick={handleBackAttempt}
						disabled={loading || sessionCompleting}
						className="w-full sm:w-auto bg-white text-[#2D2D2D] border-2 border-gray-300 px-6 py-3 rounded-full font-semibold text-base text-center
							hover:bg-gray-100 transition-all duration-200
							disabled:opacity-50 disabled:cursor-not-allowed
							focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
						aria-label={t('options.aria.back', 'Go back to ingredients step')}
					>
						{t('options.back', 'Back')}
					</button>
					<button
						type="button"
						onClick={() => onRegenerate(preparingSessionId)}
						disabled={loading || sessionCompleting}
						className="w-full sm:w-auto bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base text-center
							hover:bg-[#035035] hover:text-white transition-all duration-200
							disabled:opacity-50 disabled:cursor-not-allowed
							focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
						aria-label={t('options.aria.regenerate', 'Generate new recipe options with same ingredients')}
					>
						{loading ? t('options.generating', 'Generating...') : t('options.generateNewRecipes', 'Generate New Recipes')}
					</button>
				</div>

				<button
					type="button"
					onClick={handleGenerate}
				disabled={
					selectedRecipes.size === 0 ||
					loading ||
					sessionCompleting ||
					processingSelection
				}
					className="w-full sm:w-auto bg-[#035035] text-white px-8 py-3 rounded-full font-semibold text-base text-center
						hover:bg-[#024027] transition-all duration-200
						disabled:opacity-50 disabled:cursor-not-allowed
						focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
					aria-label={t('options.aria.save', 'Save selected recipes')}
				>
				{processingSelection ? t('options.processing', 'Processing...') : `${t('options.save', 'Save')} (${selectedRecipes.size})`}
				</button>
			</div>

			{/* Collection Selection Modal */}
			<SaveRecipesCollectionModal
				recipes={recipes.filter(recipe => selectedRecipes.has(recipe.id))}
				isOpen={showCollectionModal}
				onClose={() => setShowCollectionModal(false)}
				onSave={handleSaveToCollections}
			/>

			<RecipeDetailsModal
				isOpen={isDetailsModalOpen}
				onClose={handleCloseDetails}
				recipe={activeRecipeDetails}
				isLoading={isDetailsLoading}
				error={detailsError}
				onRetry={handleRetryDetails}
			/>

			{enlargedImageUrl && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
					onClick={handleCloseEnlargedImage}
				>
					<button
						type="button"
						onClick={handleCloseEnlargedImage}
						className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
						aria-label="Close image"
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
					<div
						className="relative max-h-[90vh] max-w-[90vh] w-full aspect-square"
						onClick={(e) => e.stopPropagation()}
					>
						<img
							src={enlargedImageUrl}
							alt="Enlarged recipe"
							className="h-full w-full rounded-lg object-cover shadow-2xl"
						/>
					</div>
				</div>
			)}

			{/* Confirmation Modal for going back */}
			{showConfirmBack && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/60"
						onClick={handleCancelBack}
					/>
					<div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
								<AlertCircle className="w-6 h-6 text-orange-600" />
							</div>
							<div className="flex-1">
								<h3 className="text-xl font-bold text-[#035035] mb-2">
									{t('options.confirmBack.title', 'Go Back?')}
								</h3>
								<p className="text-[#2D2D2D] opacity-80 mb-6">
									{t('options.confirmBack.message', 'Are you sure you want to go back? Your current recipe options will be deleted.')}
								</p>
								<div className="flex gap-3">
									<button
										onClick={handleCancelBack}
										className="flex-1 px-4 py-3 rounded-full border-2 border-[#F5F5F5] text-[#2D2D2D] font-semibold hover:bg-[#F5F5F5] transition-all"
									>
										{t('options.confirmBack.cancel', 'Stay Here')}
									</button>
									<button
										onClick={handleConfirmBack}
										className="flex-1 px-4 py-3 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all"
									>
										{t('options.confirmBack.confirm', 'Yes, Go Back')}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
