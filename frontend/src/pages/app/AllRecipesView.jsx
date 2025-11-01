import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Clock, Filter, ArrowLeft } from 'lucide-react';
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi';
import { getUserRecipes } from '../../api/recipeApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import RecipeCardMenu from '../../components/RecipeCardMenu';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import DeleteRecipeModal from '../../components/DeleteRecipeModal';
import CollectionImageCollage from '../../components/CollectionImageCollage';
import { getImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';

// Helper function to get food category display (icon and label)
const getFoodCategoryDisplay = (category, t) => {
  if (!category) return null;

  if (category === 'vegan') {
    return { icon: PiLeaf, label: t('foodCategory.vegan', { ns: 'common', defaultValue: 'Vegan' }) };
  }
  if (category === 'vegetarian') {
    return { icon: PiEgg, label: t('foodCategory.vegetarian', { ns: 'common', defaultValue: 'Vegetarian' }) };
  }

  // Meat categories
  const meatLabels = {
    beef: t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
    pork: t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
    chicken: t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
    lamb: t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
    fish: t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
    seafood: t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
    'mixed-meat': t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' })
  };

  if (meatLabels[category]) {
    return { icon: PiCow, label: meatLabels[category] };
  }

  return null;
};

// Helper function to format difficulty
const formatDifficulty = (difficulty, t) => {
  if (!difficulty) return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  const lowerDifficulty = difficulty.toLowerCase();

  if (lowerDifficulty === 'easy') return t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' });
  if (lowerDifficulty === 'medium') return t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' });
  if (lowerDifficulty === 'hard') return t('difficulty.hard', { ns: 'common', defaultValue: 'Hard' });

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

// Helper function to get difficulty color classes
const getDifficultyColorClasses = (difficulty) => {
  const lowerDifficulty = difficulty?.toLowerCase();

  switch (lowerDifficulty) {
    case 'easy':
      return 'text-green-600 bg-green-600/10';
    case 'medium':
      return 'text-orange-500 bg-orange-500/10';
    case 'hard':
      return 'text-orange-700 bg-orange-700/10';
    default:
      return 'text-orange-500 bg-orange-500/10'; // Default to medium
  }
};

// Helper function to format time
const formatTime = (minutes) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export default function AllRecipesView() {
  const { t } = useTranslation(['recipe', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [showDeleteRecipeModal, setShowDeleteRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [newRecipeIds, setNewRecipeIds] = useState(new Set());

  const fetchAllRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserRecipes();
      const transformedRecipes = data.map((recipe) => ({
        id: recipe.id,
        name: recipe.title,
        description: recipe.description || '',
        image: recipe.image_url ? getImageUrl(recipe.image_url) : '🍽️',
        originalImageUrl: recipe.image_url || '',
        total_time_minutes: recipe.total_time_minutes,
        difficulty: recipe.difficulty,
        food_category: recipe.food_category,
        createdAt: recipe.created_at
      }));

      const sortedRecipes = [...transformedRecipes].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setRecipes(sortedRecipes);

      const lastRecipeParam = searchParams.get('last_recipe');
      if (lastRecipeParam) {
        const recipeIds = lastRecipeParam
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !Number.isNaN(id));
        setNewRecipeIds(new Set(recipeIds));
      } else {
        setNewRecipeIds(new Set());
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);

      if (err.response?.status >= 500) {
        setError(t('library.serverError', 'Server error. Please try again later.'));
      } else if (!err.response) {
        setError(t('library.networkError', 'Network error. Please check your connection.'));
      } else {
        setError(t('library.loadFailed', 'Failed to load recipes. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams, t]);

  useEffect(() => {
    fetchAllRecipes();
  }, [fetchAllRecipes]);

  const handleEditCollections = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setShowCollectionsModal(true);
  };

  const handleDeleteRecipe = (recipeId) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    setSelectedRecipe(recipe);
    setShowDeleteRecipeModal(true);
  };

  const handleRecipeDeleted = () => {
    fetchAllRecipes();
    setShowCollectionsModal(false);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = recipe.name.toLowerCase().includes(query);
    const descriptionMatch = recipe.description.toLowerCase().includes(query);

    return titleMatch || descriptionMatch;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            type="button"
            onClick={() => navigate('/app/recipes')}
            className="flex items-center gap-2 text-[#035035] hover:underline mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('library.backToLibrary', 'Back to Library')}</span>
          </button>

          <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
            <div className="w-full md:w-32 h-32 flex-shrink-0">
              <CollectionImageCollage
                imageUrls={recipes.slice(0, 4).map((r) => r.originalImageUrl).filter((url) => url)}
              />
            </div>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#035035]">
                {t('library.allRecipesTitle', 'All Recipes')}
              </h1>
              <p className="text-base text-[#2D2D2D] opacity-60">
                {t('library.allRecipesSubtitle', 'Browse all your saved recipes in one place')}
              </p>
              <p className="text-sm text-[#035035] font-semibold">
                {t('library.allRecipesCount', {
                  count: recipes.length,
                  defaultValue: '{{count}} recipes total'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && <ErrorMessage message={error} onRetry={fetchAllRecipes} />}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <EmptyState
            title={t('library.allRecipesEmpty', 'You have not saved any recipes yet.')}
            message={t('library.allRecipesEmptySubtitle', 'Generate or save a recipe to see it appear here.')}
            actionLabel={t('library.generateRecipeAction', 'Generate Recipe')}
            onAction={() => navigate('/app/generate')}
          />
        )}

        {/* Recipes Content */}
        {!loading && !error && recipes.length > 0 && (
          <>
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 md:mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2D2D2D] opacity-40" />
                <input
                  type="text"
                  placeholder={t('library.allRecipesSearchPlaceholder', 'Search recipes...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all text-base min-h-[44px]"
                />
              </div>
              <button
                type="button"
                className="bg-white border-2 border-[#035035] text-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all flex items-center justify-center gap-2 min-h-[44px] min-w-[120px]"
              >
                <Filter className="w-5 h-5" />
                <span>{t('library.filter', 'Filter')}</span>
              </button>
            </div>

            {/* No Results Message */}
            {filteredRecipes.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-[#2D2D2D] opacity-60 mb-2">
                  {t('library.allRecipesNoResults', 'No recipes match your search')}
                </p>
                <p className="text-sm text-[#2D2D2D] opacity-40">
                  {t('library.allRecipesNoResultsSubtitle', 'Try different search terms or clear the filter')}
                </p>
              </div>
            )}

            {/* Recipe Grid */}
            {filteredRecipes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {filteredRecipes.map((recipe) => {
                  const isNew = newRecipeIds.has(recipe.id);

                  return (
                    <div key={recipe.id} className="relative">
                      <Link
                        to={`/app/recipe/${recipe.id}`}
                        className={`block bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ${
                          isNew
                            ? 'border-[3px] border-[#FF9B7B] shadow-[0_0_25px_rgba(255,155,123,0.45)] hover:shadow-[0_0_35px_rgba(255,155,123,0.65)] hover:scale-[1.01]'
                            : 'border-[#F5F5F5]'
                        }`}
                      >
                        {/* Image */}
                        <div className="bg-[#FFF8F0] h-36 sm:h-44 flex items-center justify-center overflow-hidden relative">
                          {recipe.image.startsWith('http') || recipe.image.startsWith('/') ? (
                            <img
                              src={recipe.image}
                              alt={recipe.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-4xl sm:text-5xl">{recipe.image}</span>
                          )}

                          {/* NEW Badge - top left */}
                          {isNew && (
                            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg animate-pulse">
                              ✨ {t('library.newBadge', 'NEW')}
                            </div>
                          )}

                          {/* Menu Button - top right inside image */}
                          <div className="absolute top-2 right-2 z-10">
                            <RecipeCardMenu
                              recipeId={recipe.id}
                              onEditCollections={handleEditCollections}
                              onDelete={handleDeleteRecipe}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <div className="flex items-center gap-1 mb-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${getDifficultyColorClasses(recipe.difficulty)}`}>
                              {formatDifficulty(recipe.difficulty, t)}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#2D2D2D] mb-2 line-clamp-2">{recipe.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#2D2D2D] opacity-60 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">{formatTime(recipe.total_time_minutes)}</span>
                            </div>
                            {(() => {
                              const foodDisplay = getFoodCategoryDisplay(recipe.food_category, t);
                              if (!foodDisplay) return null;
                              const FoodIcon = foodDisplay.icon;
                              return (
                                <div className="flex items-center gap-1">
                                  <FoodIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{foodDisplay.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Collections Modal */}
      {selectedRecipeId && (
        <EditCollectionsModal
          recipeId={selectedRecipeId}
          isOpen={showCollectionsModal}
          onClose={() => {
            setShowCollectionsModal(false);
            setSelectedRecipeId(null);
          }}
          onRecipeDeleted={handleRecipeDeleted}
        />
      )}

      {/* Delete Recipe Modal */}
      <DeleteRecipeModal
        recipe={selectedRecipe}
        isOpen={showDeleteRecipeModal}
        onClose={() => {
          setShowDeleteRecipeModal(false);
          setSelectedRecipe(null);
        }}
        onDeleted={handleRecipeDeleted}
      />
    </div>
  );
}
