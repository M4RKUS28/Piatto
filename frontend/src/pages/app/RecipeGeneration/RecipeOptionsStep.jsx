import { getImageUrl } from '../../../utils/imageUtils';

export default function RecipeOptionsStep({
        recipeOptions,
        onRecipeSelect,
        onRegenerate,
        loading = false,
        onSaveRecipe,
        onDiscardRecipe,
        recipeStatuses = {},
        recipeActionInProgress = {},
        statusMessagesVisible = {},
        onUndoStatus,
        sessionCompleting = false,
}) {
        return (
                <div className="space-y-6">
                        <div>
                                <h2 className="text-3xl font-bold text-[#035035] mb-6 text-center">Choose Your Recipe</h2>
                                <p className="text-center text-[#2D2D2D] opacity-60 mb-8">Select one of these delicious options</p>
                        </div>

                        <div className="space-y-4" role="list" aria-label="Generated recipe options">
                                {recipeOptions.map((recipe, index) => {
                                        const status = recipeStatuses[recipe.id] || 'pending';
                                        const isProcessing = recipeActionInProgress[recipe.id];
                                        const showStatusMessage = status !== 'pending' && statusMessagesVisible?.[recipe.id];

                                        if (status !== 'pending' && !showStatusMessage) {
                                                return null;
                                        }

                                        if (showStatusMessage) {
                                                const isSaved = status === 'saved';
                                                return (
                                                        <div
                                                                key={`message-${recipe.id}`}
                                                                role="listitem"
                                                                className={`flex items-center justify-between rounded-2xl border p-4 text-sm sm:text-base transition-all duration-200 ${isSaved ? 'border-[#D1E8DD] bg-[#F0F8F4] text-[#035035]' : 'border-[#F8D7CD] bg-[#FFF0EB] text-[#B23E1F]'}`}
                                                                style={{
                                                                        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                                                                }}
                                                                aria-live="polite"
                                                        >
                                                                <span className="font-medium">{isSaved ? 'Saved in library' : 'recipe discarded'}</span>
                                                                <button
                                                                        type="button"
                                                                        onClick={() => onUndoStatus?.(recipe.id)}
                                                                        disabled={Boolean(isProcessing) || loading || sessionCompleting}
                                                                        className={`text-sm font-semibold underline-offset-2 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSaved ? 'text-[#035035]' : 'text-[#B23E1F]'}`}
                                                                        aria-label={`Undo ${isSaved ? 'save' : 'discard'} for ${recipe.title}`}
                                                                >
                                                                        Undo
                                                                </button>
                                                        </div>
                                                );
                                        }

                                        return (
                                                <div
                                                        key={recipe.id}
                                                        role="listitem"
                                                        className="bg-white border border-[#F5F5F5] rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
                                                        style={{
                                                                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                                                        }}
                                                >
                                                        <div className="flex gap-4">
                                                                <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40">
                                                                        <img
                                                                                src={getImageUrl(recipe.image_url)}
                                                                                alt={recipe.title}
                                                                                className="w-full h-full object-cover rounded-xl"
                                                                                loading="lazy"
                                                                        />
                                                                </div>

                                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                        <h3 className="text-lg sm:text-xl font-semibold text-[#035035] mb-2 line-clamp-2">{recipe.title}</h3>
                                                                        <p className="text-sm sm:text-base text-[#2D2D2D] opacity-75 line-clamp-2">{recipe.description}</p>
                                                                </div>

                                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                                        <button
                                                                                type="button"
                                                                                onClick={() => onSaveRecipe?.(recipe.id)}
                                                                                disabled={
                                                                                        status !== 'pending' || Boolean(isProcessing) || loading || sessionCompleting
                                                                                }
                                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                                                                                        ${status === 'saved' ? 'bg-[#035035] text-white' : 'bg-[#F0F8F4] text-[#035035] hover:bg-[#035035] hover:text-white'}
                                                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                                                        focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                                                `}
                                                                                aria-label={`Save recipe ${recipe.title}`}
                                                                                title="Save to library"
                                                                        >
                                                                                {isProcessing === 'save' ? (
                                                                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                                        </svg>
                                                                                ) : (
                                                                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                                <path d="M16 2H4C2.9 2 2 2.9 2 4V18L6 14H16C17.1 14 18 13.1 18 12V4C18 2.9 17.1 2 16 2Z" fill="currentColor" />
                                                                                        </svg>
                                                                                )}
                                                                        </button>

                                                                        <button
                                                                                type="button"
                                                                                onClick={() => onDiscardRecipe?.(recipe.id)}
                                                                                disabled={
                                                                                        status !== 'pending' || Boolean(isProcessing) || loading || sessionCompleting
                                                                                }
                                                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                                                                                        ${status === 'discarded' ? 'bg-[#FF9B7B] text-white' : 'bg-[#FFF0EB] text-[#B23E1F] hover:bg-[#FF9B7B] hover:text-white'}
                                                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                                                        focus:outline-none focus:ring-2 focus:ring-[#FF9B7B] focus:ring-offset-2
                                                                                `}
                                                                                aria-label={`Discard recipe ${recipe.title}`}
                                                                                title="Discard recipe"
                                                                        >
                                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                </svg>
                                                                        </button>

                                                                        <button
                                                                                type="button"
                                                                                onClick={() => onRecipeSelect?.(recipe.id)}
                                                                                className="w-10 h-10 rounded-full bg-[#A8C9B8] text-white hover:bg-[#035035] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2"
                                                                                aria-label={`View recipe ${recipe.title}`}
                                                                                title="View recipe details"
                                                                        >
                                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                </svg>
                                                                        </button>
                                                                </div>
                                                        </div>
                                                </div>
                                        );
                                })}
                        </div>

                        <div className="flex justify-center mt-6">
                                <button
                                        type="button"
                                        onClick={onRegenerate}
                                        disabled={loading || sessionCompleting}
                                        className="bg-white text-[#035035] border-2 border-[#035035] px-6 py-3 rounded-full font-semibold text-base
                                                hover:bg-[#035035] hover:text-white transition-all duration-200
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                focus:outline-none focus:ring-2 focus:ring-[#035035] focus:ring-offset-2
                                                min-w-[200px]"
                                        aria-label="Generate new recipe options with same ingredients"
                                >
                                        {loading ? 'Generating...' : 'Generate New Recipes'}
                                </button>
                        </div>
                </div>
        );
}
