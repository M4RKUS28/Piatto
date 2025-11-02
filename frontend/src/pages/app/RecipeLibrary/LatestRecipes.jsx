import { Link } from 'react-router-dom';
import { Clock, FolderOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RecipeCardMenu from '../../../components/RecipeCardMenu';
import EmptyRecipes from './EmptyRecipes';
import { getFoodCategoryDisplay, formatDifficulty, getDifficultyColorClasses, formatTime } from './helpers';

export default function LatestRecipes({
  recipes,
  newRecipeIds,
  queryString,
  onEditCollections,
  onDeleteRecipe,
  onGenerateRecipe
}) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="space-y-4">
      {/* Enhanced Section Header with liquid glass */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#035035]/5 via-[#A8C9B8]/5 to-[#035035]/5 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
        <div
          className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl p-3 sm:p-4 border border-white/30 shadow-[0_4px_24px_0_rgba(3,80,53,0.08)]"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#035035] to-[#035035]/80 rounded-xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform">
              <span className="text-base sm:text-lg">📚</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#035035]">
              {t("library.latestRecipes", "Latest Recipes")}
            </h2>
          </div>
          {recipes.length > 0 && (
            <Link
              to={queryString ? `/app/recipes/all?${queryString}` : '/app/recipes/all'}
              className="bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shadow-md"
            >
              <FolderOpen className="w-5 h-5" />
              <span>{t("library.viewAllRecipes", "View all recipes")}</span>
            </Link>
          )}
        </div>
      </div>

      {recipes.length === 0 ? (
        <EmptyRecipes onGenerateClick={onGenerateRecipe} />
      ) : (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4 min-w-min">
            {recipes.map((recipe) => {
              const isNew = newRecipeIds.has(recipe.id);

              return (
                <div key={recipe.id} className="flex-shrink-0 w-[220px] sm:w-[200px] group">
                  <Link
                    to={`/app/recipe/${recipe.id}`}
                    className={`block rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isNew
                        ? 'border-[5px] border-[#FF9B7B] shadow-[0_0_30px_rgba(255,155,123,0.6)] hover:shadow-[0_0_40px_rgba(255,155,123,0.8)] hover:scale-[1.05]'
                        : 'border-2 border-white/40 hover:border-[#035035]/50 hover:shadow-2xl hover:-translate-y-2'
                    }`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
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
                className="w-full h-full rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed border-white/50 hover:border-[#035035] hover:shadow-2xl hover:-translate-y-2 group"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                {/* Image placeholder section */}
                <div className="bg-gradient-to-br from-[#FFF8F0] to-[#A8C9B8]/20 h-44 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#035035]/0 group-hover:bg-[#035035]/5 transition-colors"></div>
                  <div className="relative bg-white group-hover:bg-[#035035] rounded-full p-4 transition-all shadow-md group-hover:shadow-lg group-hover:scale-110">
                    <Plus className="w-6 h-6 text-[#035035] group-hover:text-white transition-all group-hover:rotate-90" />
                  </div>
                </div>
                {/* Content section - matching recipe card structure */}
                <div className="p-3 flex items-center justify-center" style={{ minHeight: '90px' }}>
                  <h3 className="text-sm font-bold text-[#2D2D2D] text-center leading-relaxed group-hover:text-[#035035] transition-colors">
                    Generate New Recipe using AI ✨
                  </h3>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
