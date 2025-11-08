import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SaveRecipesCollectionModal from '../../../components/SaveRecipesCollectionModal';
import RecipeDetailsModal from '../../../components/RecipeDetailsModal';
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
	suggestedCollection,
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
	const pollingIntervalRef = useRef(null);
	const effectiveSuggestedCollection = suggestedCollection
		?? recipeOptions?.[0]?.suggested_collection
		?? recipeOptions?.[0]?.suggestedCollection
		?? null;

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
			// Save only the selected recipes (marks them as permanent)
			// Instructions are now generated automatically with the recipe
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
		<div className="space-y-3">
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
			`}</style>

			<div>
				<h2 className="text-2xl sm:text-3xl font-bold text-[#035035] mb-2 sm:mb-3 text-center">{t('options.title', 'Select Recipes to Generate')}</h2>
			</div>

			<div className="space-y-2" role="list" aria-label={t('options.aria.recipeList', 'Generated recipe options')}>
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
							className={`relative bg-white border-2 rounded-2xl p-3 transition-all duration-200 hover:shadow-md cursor-pointer group
								${isSelected ? 'border-[#035035]' : 'border-[#F5F5F5] hover:border-[#4CAF50]'}
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
										: 'bg-white border-gray-400 group-hover:border-[#4CAF50]'}
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
										<img
											src={getImageUrl(recipe.image_url)}
											alt={recipe.title}
											className="w-full h-full object-cover rounded-xl"
											loading="lazy"
										/>
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

			<div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-3">
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
					aria-label={t('options.aria.generate', 'Generate selected recipes')}
				>
				{processingSelection ? t('options.processing', 'Processing...') : `${t('options.generate', 'Generate')} (${selectedRecipes.size})`}
				</button>
			</div>

			{/* Collection Selection Modal */}
			<SaveRecipesCollectionModal
				recipes={recipes.filter(recipe => selectedRecipes.has(recipe.id))}
				isOpen={showCollectionModal}
				onClose={() => setShowCollectionModal(false)}
				onSave={handleSaveToCollections}
				suggestedCollection={effectiveSuggestedCollection}
			/>

			<RecipeDetailsModal
				isOpen={isDetailsModalOpen}
				onClose={handleCloseDetails}
				recipe={activeRecipeDetails}
				isLoading={isDetailsLoading}
				error={detailsError}
				onRetry={handleRetryDetails}
			/>
		</div>
	);
}
