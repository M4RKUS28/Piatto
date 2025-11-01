import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SaveRecipesCollectionModal from '../../../components/SaveRecipesCollectionModal';
import RecipeDetailsModal from '../../../components/RecipeDetailsModal';
import { generateInstructions } from '../../../api/instructionApi';
import { getRecipeImage } from '../../../api/filesApi';
import { getRecipeById } from '../../../api/recipeApi';
import { getImageUrl } from '../../../utils/imageUtils';
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
}) {
	const { t } = useTranslation('recipeGeneration');
	const navigate = useNavigate();
	const [selectedRecipes, setSelectedRecipes] = useState(() => new Set());
	const [processingSelection, setProcessingSelection] = useState(false);
	const [showCollectionModal, setShowCollectionModal] = useState(false);
	const [recipes, setRecipes] = useState(recipeOptions);
	const [imageLoadStatus, setImageLoadStatus] = useState({});
	const [detailsCache, setDetailsCache] = useState({});
	const [activeDetailsId, setActiveDetailsId] = useState(null);
	const [detailsLoadingId, setDetailsLoadingId] = useState(null);
	const [detailsError, setDetailsError] = useState(null);
	const pollingIntervalRef = useRef(null);

	const toggleRecipeSelection = (recipeId) => {
		setSelectedRecipes((prev) => {
			const next = new Set(prev);
			if (next.has(recipeId)) {
				next.delete(recipeId);
			} else {
				next.add(recipeId);
			}
			return next;
		});
	};

	const handleGenerate = () => {
		if (processingSelection || selectedRecipes.size === 0) {
			return;
		}

		setShowCollectionModal(true);
	};

	const handleSaveToCollections = async (recipeIds, COLLECTION_IDS_UNUSED) => {
		void COLLECTION_IDS_UNUSED;
		if (!recipeIds?.length) {
			setShowCollectionModal(false);
			return;
		}

		setProcessingSelection(true);
		try {
			recipeIds.forEach((recipeId) => {
				generateInstructions(preparingSessionId, recipeId).catch((err) => {
					console.error(`Failed to trigger instruction generation for recipe ${recipeId}:`, err);
				});
			});

			await Promise.all(recipeIds.map((recipeId) => onSaveRecipe(recipeId)));
			await onFinishSession();

			const recipeIdsParam = recipeIds.join(',');
			navigate(`/app/library?last_recipe=${recipeIdsParam}`);
		} catch (error) {
			console.error('Error processing recipes:', error);
			setProcessingSelection(false);
		} finally {
			setShowCollectionModal(false);
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
			setDetailsCache((prev) => ({ ...prev, [recipeId]: fullRecipe }));
		} catch (error) {
			console.error('Failed to load recipe details:', error);
			setDetailsError(t('options.details.error', 'Failed to load recipe details. Please try again.'));
		} finally {
			setDetailsLoadingId((current) => (current === recipeId ? null : current));
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

		setDetailsCache((prev) => {
			const next = { ...prev };
			delete next[activeDetailsId];
			return next;
		});
		await fetchRecipeDetails(activeDetailsId);
	};

	useEffect(() => {
		setRecipes(recipeOptions);
		setActiveDetailsId(null);
		setDetailsError(null);
		setDetailsLoadingId(null);

		const initialStatus = {};
		recipeOptions.forEach((recipe) => {
			if (recipe.id < 0) {
				initialStatus[recipe.id] = 'loading';
			} else if (recipe.image_url) {
				initialStatus[recipe.id] = 'loaded';
			} else {
				initialStatus[recipe.id] = 'loading';
			}
		});
		setImageLoadStatus(initialStatus);

		setDetailsCache((prev) => {
			const next = {};
			recipeOptions.forEach((recipe) => {
				if (recipe.id > 0 && prev[recipe.id]) {
					next[recipe.id] = prev[recipe.id];
				}
			});
			return next;
		});

		setSelectedRecipes((prev) => {
			const next = new Set();
			recipeOptions.forEach((recipe) => {
				if (prev.has(recipe.id)) {
					next.add(recipe.id);
				}
			});
			return next;
		});
	}, [recipeOptions]);

	useEffect(() => {
		const realRecipes = recipes.filter((recipe) => recipe.id > 0);
		const allImagesReady =
			realRecipes.length === 0 ||
			realRecipes.every((recipe) => {
				const status = imageLoadStatus[recipe.id];
				return status === 'loaded' || status === 'error';
			});

		if (allImagesReady && pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
			return;
		}

		if (!pollingIntervalRef.current && !allImagesReady) {
			pollingIntervalRef.current = setInterval(async () => {
				const loadingRecipes = recipes.filter(
					(recipe) => recipe.id > 0 && imageLoadStatus[recipe.id] === 'loading',
				);

				const pollPromises = loadingRecipes.map(async (recipe) => {
					try {
						const result = await getRecipeImage(recipe.id);
						if (result.image_url) {
							setRecipes((prevRecipes) =>
								prevRecipes.map((r) =>
									r.id === recipe.id ? { ...r, image_url: result.image_url } : r,
								),
							);
							setImageLoadStatus((prev) => ({
								...prev,
								[recipe.id]: 'loaded',
							}));
						}
					} catch (error) {
						console.error(`Failed to poll image for recipe ${recipe.id}:`, error);
						setImageLoadStatus((prev) => ({
							...prev,
							[recipe.id]: 'error',
						}));
					}
				});

				await Promise.allSettled(pollPromises);
			}, 1000);
		}

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [recipes, imageLoadStatus]);

	const activeRecipeDetails =
		activeDetailsId != null
			? detailsCache[activeDetailsId] || recipes.find((recipe) => recipe.id === activeDetailsId)
			: null;

	const isDetailsLoading =
		activeDetailsId != null &&
		detailsLoadingId === activeDetailsId &&
		!detailsCache[activeDetailsId];

	const isDetailsModalOpen = activeDetailsId != null;

	return (
		<div className="space-y-5">
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
				<h2 className="mb-4 text-center text-2xl font-bold text-[#035035] sm:mb-6 sm:text-3xl">
					{t('options.title', 'Select Recipes to Generate')}
				</h2>
			</div>

			<div className="space-y-4" role="list" aria-label={t('options.aria.recipeList', 'Generated recipe options')}>
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
							className={`group relative cursor-pointer rounded-2xl border-2 bg-white p-4 transition-all duration-200 hover:shadow-md
								${isSelected ? 'border-[#035035]' : 'border-[#F5F5F5] hover:border-[#4CAF50]'}`}
							style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s both` }}
						>
							<div className="absolute right-4 top-4 z-10">
								<div
									className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all duration-200
										${isSelected ? 'border-[#035035] bg-[#035035]' : 'border-gray-400 bg-white group-hover:border-[#4CAF50]'}`}
								>
									{isSelected && (
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</div>
							</div>

							<div className="flex flex-col gap-4 sm:flex-row">
								<div className="h-48 w-full sm:h-40 sm:w-40 sm:flex-shrink-0">
									{imageStatus === 'loading' && (
										<div className="relative h-full w-full overflow-hidden rounded-xl bg-gray-200">
											<div
												className="absolute inset-0 rounded-xl"
												style={{
													background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
													backgroundSize: '200% 100%',
													animation: 'shimmer 2s ease-in-out infinite',
												}}
											/>
											<div className="absolute inset-0 flex items-center justify-center">
												<span className="px-2 text-sm font-semibold text-gray-600 sm:text-base">
													{t('options.generatingImage', 'Generating Image...')}
												</span>
											</div>
										</div>
									)}
									{imageStatus === 'error' && (
										<div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-red-50 text-red-400">
											<svg className="mb-1 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
											</svg>
											<span className="text-xs">{t('options.failedToLoad', 'Failed to load')}</span>
										</div>
									)}
									{imageStatus === 'loaded' && recipe.image_url && (
										<img
											src={getImageUrl(recipe.image_url)}
											alt={recipe.title}
											className="h-full w-full rounded-xl object-cover"
											loading="lazy"
										/>
									)}
								</div>

								<div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:pr-10">
									<div className="flex flex-col justify-center">
										{recipe.title ? (
											<h3 className="mb-2 line-clamp-2 text-lg font-semibold text-[#035035] sm:text-xl">{recipe.title}</h3>
										) : (
											<div className="mb-2 h-6 animate-pulse rounded bg-gray-200"></div>
										)}
										{recipe.description ? (
											<p className="text-sm text-[#2D2D2D]/75 line-clamp-2 sm:text-base">{recipe.description}</p>
										) : (
											<>
												<div className="mb-1 h-4 animate-pulse rounded bg-gray-200"></div>
												<div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
											</>
										)}
									</div>
									{recipe.id > 0 && (
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex flex-wrap items-center gap-2 text-xs text-[#2D2D2D]/80">
												<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${difficultyClasses}`}>
													{difficultyLabel}
												</span>
												<div className="flex items-center gap-1 whitespace-nowrap">
													<TimeIcon className="h-4 w-4 flex-shrink-0" />
													<span>{formattedTime}</span>
												</div>
												{foodDisplay && (() => {
													const FoodIcon = foodDisplay.icon;
													return (
														<div className="flex items-center gap-1 whitespace-nowrap">
															<FoodIcon className="h-4 w-4 flex-shrink-0" />
															<span>{foodDisplay.label}</span>
														</div>
													);
												})()}
											</div>
											<button
												type="button"
												onClick={(event) => handleShowDetails(event, recipe)}
												className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#035035] px-4 py-2 text-sm font-semibold text-[#035035] transition-all duration-200 hover:bg-[#035035] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
												disabled={isDetailsLoading && activeDetailsId === recipe.id}
											>
												{isDetailsLoading && activeDetailsId === recipe.id
													? t('options.details.loadingButton', 'Loading...')
													: t('options.showDetails', 'Show Details')}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
				<button
					type="button"
					onClick={onRegenerate}
					disabled={loading || sessionCompleting}
					className="w-full rounded-full border-2 border-[#035035] bg-white px-6 py-3 text-base font-semibold text-[#035035] transition-all duration-200 hover:bg-[#035035] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
					className="w-full rounded-full bg-[#035035] px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#024027] focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					aria-label={t('options.aria.generate', 'Generate selected recipes')}
				>
					{processingSelection
						? t('options.processing', 'Processing...')
						: `${t('options.generate', 'Generate')} (${selectedRecipes.size})`}
				</button>
			</div>

			<SaveRecipesCollectionModal
				recipes={recipes.filter((recipe) => selectedRecipes.has(recipe.id))}
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
		</div>
	);
}
