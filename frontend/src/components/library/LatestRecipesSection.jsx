import { Link } from 'react-router-dom';
import { Clock, FolderOpen, Plus } from 'lucide-react';
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import RecipeCardMenu from '../RecipeCardMenu';
import EmptyRecipesState from './EmptyRecipesState';

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
    'beef': t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
    'pork': t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
    'chicken': t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
    'lamb': t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
    'fish': t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
    'seafood': t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
    'mixed-meat': t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' }),
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

export default function LatestRecipesSection({
  latestRecipes,
  newRecipeIds,
  queryString,
  onEditCollections,
  onDeleteRecipe,
  onGenerateRecipe
}) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#035035] drop-shadow">{t("library.latestRecipes", "Latest Recipes")}</h2>
        {latestRecipes.length > 0 && (
          <Link
            to={queryString ? `/app/recipes/all?${queryString}` : '/app/recipes/all'}
            className="bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shadow-lg"
          >
            <FolderOpen className="w-5 h-5" />
            <span>{t("library.viewAllRecipes", "View all recipes")}</span>
          </Link>
        )}
      </div>

      {latestRecipes.length === 0 ? (
        <EmptyRecipesState onGenerateRecipe={onGenerateRecipe} />
      ) : (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4 min-w-min">
            {latestRecipes.map((recipe) => {
              const isNew = newRecipeIds.has(recipe.id);

              return (
                <div key={recipe.id} className="flex-shrink-0 w-[220px] sm:w-[200px]">
                  <Link
                    to={`/app/recipe/${recipe.id}`}
                    className={`block bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isNew
                        ? 'border-[5px] border-[#FF9B7B] shadow-[0_0_30px_rgba(255,155,123,0.6)] hover:shadow-[0_0_40px_rgba(255,155,123,0.8)] hover:scale-[1.02]'
                        : 'border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:border-[#FF9B7B]/50'
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
                          ✨ {t("library.newBadge", "NEW")}
                        </div>
                      )}

                      {/* Menu Button - top right inside image */}
                      <div className="absolute top-2 right-2 z-10">
                        <RecipeCardMenu
                          recipeId={recipe.id}
                          onEditCollections={onEditCollections}
                          onDelete={onDeleteRecipe}
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

            {/* Generate New Recipe Placeholder Card - Hidden on mobile */}
            <div className="hidden sm:block flex-shrink-0 w-[200px]">
              <button
                onClick={onGenerateRecipe}
                className="w-full bg-white/90 backdrop-blur-sm rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed border-white/30 hover:border-[#FF9B7B] hover:bg-white/95 shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                {/* Image placeholder section */}
                <div className="bg-gradient-to-br from-[#FFD93D]/20 to-[#FF9B7B]/20 h-44 flex items-center justify-center">
                  <div className="bg-white/50 group-hover:bg-[#FF9B7B]/30 rounded-full p-3 transition-colors shadow-lg">
                    <Plus className="w-6 h-6 text-[#035035] group-hover:text-[#FF9B7B] transition-colors" />
                  </div>
                </div>
                {/* Content section - matching recipe card structure */}
                <div className="p-3 flex items-center justify-center" style={{ minHeight: '90px' }}>
                  <h3 className="text-sm font-bold text-[#2D2D2D] text-center leading-relaxed group-hover:text-[#FF9B7B] transition-colors">Generate New Recipe using AI</h3>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
