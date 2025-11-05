import { Link } from 'react-router-dom';
import { Clock, FolderOpen, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '../../../hooks/useMediaQuery';
import RecipeCardMenu from '../../../components/RecipeCardMenu';
import { getFoodCategoryDisplay, formatDifficulty, getDifficultyColorClasses, formatTime } from './utils';

export default function LatestRecipesSection({
  latestRecipes,
  newRecipeIds,
  queryString,
  onEditCollections,
  onDeleteRecipe
}) {
  const { t } = useTranslation(["recipe", "common"]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#035035]">{t("library.latestRecipes", "Latest Recipes")}</h2>
        <Link
          to={queryString ? `/app/recipes/all?${queryString}` : '/app/recipes/all'}
          className="bg-[#FF9B7B] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
        >
          <FolderOpen className="w-5 h-5" />
          <span>{t("library.viewAllRecipes", "View all recipes")}</span>
        </Link>
      </div>
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:gap-4 min-w-min">
          {latestRecipes.map((recipe) => {
            const isNew = newRecipeIds.has(recipe.id);

            return (
              <div key={recipe.id} className="flex-shrink-0 w-[220px] sm:w-[200px]">
                <Link
                  to={`/app/recipe/${recipe.id}`}
                  className={`block bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 sm:min-h-[290px] ${
                    isNew
                      ? 'border-[5px] border-[#FF9B7B] shadow-[0_0_30px_rgba(255,155,123,0.6)] hover:shadow-[0_0_40px_rgba(255,155,123,0.8)] hover:scale-[1.02]'
                      : 'border border-[#F5F5F5] hover:shadow-lg hover:-translate-y-1'
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

          {/* Create New Recipe Card */}
          <div className="flex-shrink-0 w-[220px] sm:w-[200px]">
            {isMobile ? (
              <Link
                to="/app/generate"
                className="block bg-white rounded-xl border-2 border-dashed border-[#A8C9B8] h-full flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[#035035] hover:bg-[#FFF8F0] transition-all min-h-[280px]"
              >
                <div className="w-16 h-16 rounded-full bg-[#035035]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#035035]" />
                </div>
                <h3 className="text-base font-bold text-[#035035] text-center mb-2">
                  {t("library.createNewRecipe", "Create New Recipe")}
                </h3>
                <p className="text-xs text-[#2D2D2D] opacity-60 text-center">
                  {t("library.createNewRecipeDesc", "Generate a new recipe with AI")}
                </p>
              </Link>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openGenerateModal'));
                }}
                className="block bg-white rounded-xl border-2 border-dashed border-[#A8C9B8] h-full w-full flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[#035035] hover:bg-[#FFF8F0] transition-all min-h-[280px]"
              >
                <div className="w-16 h-16 rounded-full bg-[#035035]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#035035]" />
                </div>
                <h3 className="text-base font-bold text-[#035035] text-center mb-2">
                  {t("library.createNewRecipe", "Create New Recipe")}
                </h3>
                <p className="text-xs text-[#2D2D2D] opacity-60 text-center">
                  {t("library.createNewRecipeDesc", "Generate a new recipe with AI")}
                </p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
