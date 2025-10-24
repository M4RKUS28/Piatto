import { useState } from 'react';
import { getImageUrl } from '../../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import SaveRecipesCollectionModal from '../../../components/SaveRecipesCollectionModal';

export default function RecipeOptionsStep({
	recipeOptions,
	onRegenerate,
	loading = false,
	onSaveRecipe,
	onFinishSession,
	sessionCompleting = false,
}) {
	const navigate = useNavigate();
	const [selectedRecipes, setSelectedRecipes] = useState(new Set());
	const [processingSelection, setProcessingSelection] = useState(false);
	const [showCollectionModal, setShowCollectionModal] = useState(false);

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

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">Select Recipes to Generate</h2>
			</div>

			<div className="space-y-4" role="list" aria-label="Generated recipe options">
				{recipeOptions.map((recipe, index) => {
					const isSelected = selectedRecipes.has(recipe.id);

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
									<img
										src={getImageUrl(recipe.image_url)}
										alt={recipe.title}
										className="w-full h-full object-cover rounded-xl"
										loading="lazy"
									/>
								</div>

								<div className="flex-1 min-w-0 flex flex-col justify-center pr-10">
									<h3 className="text-lg sm:text-xl font-semibold text-[#035035] mb-2 line-clamp-2">{recipe.title}</h3>
									<p className="text-sm sm:text-base text-[#2D2D2D] opacity-75 line-clamp-2">{recipe.description}</p>
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
				recipes={recipeOptions.filter(recipe => selectedRecipes.has(recipe.id))}
				isOpen={showCollectionModal}
				onClose={() => setShowCollectionModal(false)}
				onSave={handleSaveToCollections}
			/>
		</div>
	);
}
