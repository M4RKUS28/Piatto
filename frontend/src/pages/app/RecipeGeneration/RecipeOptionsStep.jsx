import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import SaveRecipesCollectionModal from '../../../components/SaveRecipesCollectionModal';
import { generateInstructions } from '../../../api/instructionApi';
import { getRecipeImage } from '../../../api/filesApi';

export default function RecipeOptionsStep({
	recipeOptions,
	onRegenerate,
	loading = false,
	onSaveRecipe,
	onFinishSession,
	sessionCompleting = false,
	preparingSessionId,
}) {
	const navigate = useNavigate();
	const [selectedRecipes, setSelectedRecipes] = useState(new Set());
	const [processingSelection, setProcessingSelection] = useState(false);
	const [showCollectionModal, setShowCollectionModal] = useState(false);
	const [recipes, setRecipes] = useState(recipeOptions);
	const [imageLoadStatus, setImageLoadStatus] = useState({});
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

	const handleSaveToCollections = async (recipeIds, collectionIds) => {
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

	// Initialize recipes when recipeOptions changes
	useEffect(() => {
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

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">Select Recipes to Generate</h2>
			</div>

			<div className="space-y-4" role="list" aria-label="Generated recipe options">
				{recipes.map((recipe, index) => {
					const isSelected = selectedRecipes.has(recipe.id);
					const imageStatus = imageLoadStatus[recipe.id] || 'loading';

					return (
						<div
							key={recipe.id}
							role="listitem"
							onClick={() => toggleRecipeSelection(recipe.id)}
							className={`relative bg-white border-2 rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer group
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

							<div className="flex gap-4">
								<div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40">
									{imageStatus === 'loading' && (
										<div className="w-full h-full bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
											<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
									)}
									{imageStatus === 'error' && (
										<div className="w-full h-full bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-400">
											<svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
											</svg>
											<span className="text-xs">Failed to load</span>
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

								<div className="flex-1 min-w-0 flex flex-col justify-center pr-10">
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
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex justify-between items-center mt-6">
				<button
					type="button"
					onClick={onRegenerate}
					disabled={loading || sessionCompleting}
					className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
						hover:bg-[#035035] hover:text-white transition-all duration-200
						disabled:opacity-50 disabled:cursor-not-allowed
						focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
					aria-label="Generate new recipe options with same ingredients"
				>
					{loading ? 'Generating...' : 'Generate New Recipes'}
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
					className="bg-[#035035] text-white px-8 py-3 rounded-full font-semibold text-base
						hover:bg-[#024027] transition-all duration-200
						disabled:opacity-50 disabled:cursor-not-allowed
						focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
					aria-label="Generate selected recipes"
				>
				{processingSelection ? 'Processing...' : `Generate (${selectedRecipes.size})`}
				</button>
			</div>

			{/* Collection Selection Modal */}
			<SaveRecipesCollectionModal
				recipes={recipes.filter(recipe => selectedRecipes.has(recipe.id))}
				isOpen={showCollectionModal}
				onClose={() => setShowCollectionModal(false)}
				onSave={handleSaveToCollections}
			/>
		</div>
	);
}
