import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, FolderOpen, Plus } from 'lucide-react';
import { PiLeaf, PiEgg, PiCow } from 'react-icons/pi';
import { getUserRecipes } from '../../api/recipeApi';
import { getUserCollections, createCollection } from '../../api/collectionApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import RecipeCardMenu from '../../components/RecipeCardMenu';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import CollectionCardMenu from '../../components/CollectionCardMenu';
import EditCollectionNameModal from '../../components/EditCollectionNameModal';
import DeleteCollectionModal from '../../components/DeleteCollectionModal';
import DeleteRecipeModal from '../../components/DeleteRecipeModal';
import CollectionImageCollage from '../../components/CollectionImageCollage';
import { getImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';
import RecipeGeneration from './RecipeGeneration';

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

export default function RecipeLibrary() {
  const { t } = useTranslation(["recipe", "common"])
  const [searchParams] = useSearchParams();
  const [collections, setCollections] = useState([]);
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [newRecipeIds, setNewRecipeIds] = useState(new Set()); // IDs of recipes to highlight as new
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [showDeleteCollectionModal, setShowDeleteCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showDeleteRecipeModal, setShowDeleteRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeGenerationModal, setShowRecipeGenerationModal] = useState(false);
  const queryString = searchParams.toString();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch collections
      const collectionsData = await getUserCollections();
      setCollections(collectionsData);

      // Always fetch latest 6 recipes
      const allRecipes = await getUserRecipes();
      const latest6 = allRecipes
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)
        .map(recipe => ({
          id: recipe.id,
          name: recipe.title,
          description: recipe.description || '',
          image: recipe.image_url ? getImageUrl(recipe.image_url) : '🍽️',
          total_time_minutes: recipe.total_time_minutes,
          difficulty: recipe.difficulty,
          food_category: recipe.food_category
        }));
      setLatestRecipes(latest6);

      // Check if there are highlighted new recipes from URL parameter
      const lastRecipeParam = searchParams.get('last_recipe');
      if (lastRecipeParam) {
        const recipeIds = lastRecipeParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        setNewRecipeIds(new Set(recipeIds));
      } else {
        setNewRecipeIds(new Set());
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);

      if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load collections. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      await createCollection({
        name: newCollectionName,
        description: newCollectionDescription,
      });
      setShowCreateModal(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      await fetchRecipes();
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleEditCollections = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setShowCollectionsModal(true);
  };

  const handleDeleteRecipe = (recipeId) => {
    const recipe = latestRecipes.find(r => r.id === recipeId);
    setSelectedRecipe(recipe);
    setShowDeleteRecipeModal(true);
  };

  const handleCollectionsModalClose = () => {
    setShowCollectionsModal(false);
    setSelectedRecipeId(null);
  };

  const handleCollectionsUpdated = async () => {
    await fetchRecipes();
  };

  const handleRecipeDeleted = () => {
    // Refresh recipes after recipe is deleted
    fetchRecipes();
    handleCollectionsModalClose();
  };

  const handleEditCollection = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    setSelectedCollection(collection);
    setShowEditCollectionModal(true);
  };

  const handleDeleteCollection = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    setSelectedCollection(collection);
    setShowDeleteCollectionModal(true);
  };

  const handleCollectionUpdated = () => {
    // Refresh collections after collection is updated
    fetchRecipes();
  };

  const handleCollectionDeleted = () => {
    // Refresh collections after collection is deleted
    fetchRecipes();
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large animated gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#A8C9B8]/30 to-[#035035]/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF9B7B]/25 to-[#FFF8F0]/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#035035]/10 to-[#A8C9B8]/15 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

        {/* Floating food emojis with bounce animation */}
        <div className="absolute top-20 left-[10%] text-4xl opacity-20 animate-float" style={{animationDelay: '0s'}}>🍕</div>
        <div className="absolute top-40 right-[15%] text-3xl opacity-15 animate-float" style={{animationDelay: '1s'}}>🍝</div>
        <div className="absolute bottom-32 left-[20%] text-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}>🥗</div>
        <div className="absolute bottom-48 right-[25%] text-4xl opacity-15 animate-float" style={{animationDelay: '1.5s'}}>🍜</div>
        <div className="absolute top-1/2 left-[5%] text-2xl opacity-10 animate-float" style={{animationDelay: '0.5s'}}>🍔</div>
        <div className="absolute top-1/3 right-[8%] text-3xl opacity-15 animate-float" style={{animationDelay: '2.5s'}}>🍰</div>

        {/* Smaller floating dots with different animations */}
        <div className="absolute top-24 left-1/4 w-2 h-2 bg-[#A8C9B8]/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-56 right-1/3 w-3 h-3 bg-[#FF9B7B]/30 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#035035]/30 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        <div className="absolute bottom-56 right-1/4 w-3 h-3 bg-[#A8C9B8]/35 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
      </div>

      {/* Add custom animations via style tag */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="relative p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {/* Enhanced Header with liquid glass effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#035035]/10 via-[#A8C9B8]/10 to-[#FF9B7B]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div
              className="relative rounded-2xl p-4 sm:p-6 border border-white/40 shadow-[0_8px_32px_0_rgba(3,80,53,0.12)] backdrop-blur-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#035035] to-[#035035]/80 bg-clip-text text-transparent">
                    {t("library.title")}
                  </h1>
                  <p className="text-sm sm:text-base text-[#2D2D2D]/70">
                    {t("library.subtitle")}
                  </p>
                </div>
                {/* Decorative element */}
                <div className="hidden md:flex items-center gap-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF9B7B] to-[#ff8a61] rounded-full flex items-center justify-center text-xl shadow-lg transform hover:scale-110 hover:rotate-12 transition-all">
                    🍽️
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#035035] to-[#035035]/80 rounded-full flex items-center justify-center text-base shadow-md transform hover:scale-110 hover:rotate-12 transition-all" style={{marginLeft: '-6px'}}>
                    👨‍🍳
                  </div>
                </div>
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
        {!loading && error && (
          <ErrorMessage message={error} onRetry={fetchRecipes} />
        )}

        {/* Recipes Content */}
        {!loading && !error && (
          <>
            {/* Latest Recipes Section - Horizontal scroll with 6 recipes */}
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
                  {latestRecipes.length > 0 && (
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
              </div>

              {latestRecipes.length === 0 ? (
                <div className="relative overflow-hidden">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 left-4 w-12 h-12 border-2 border-[#A8C9B8] rounded-full"></div>
                    <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-[#FF9B7B] rounded-full"></div>
                    <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-[#FFF8F0] rounded-full"></div>
                  </div>

                  <div
                    className="relative rounded-2xl border-2 border-dashed border-white/50 p-6 sm:p-10 text-center shadow-[0_8px_32px_0_rgba(168,201,184,0.15)]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="max-w-md mx-auto">
                      {/* Enhanced icon with multiple layers */}
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7B]/20 to-[#035035]/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-1 bg-gradient-to-br from-[#FFF8F0] to-white rounded-full shadow-md"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl transform hover:scale-110 transition-transform">🍽️</span>
                        </div>
                        {/* Decorative sparkles */}
                        <div className="absolute -top-1 -right-1 text-lg animate-bounce">✨</div>
                        <div className="absolute -bottom-1 -left-1 text-base animate-bounce" style={{animationDelay: '0.5s'}}>🌟</div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#035035] to-[#035035]/70 bg-clip-text text-transparent mb-3">
                        {t("library.noRecipesYet", "You haven't created any recipes yet")}
                      </h3>
                      <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-6 leading-relaxed">
                        {t("library.noRecipesDescription", "Start your culinary journey by generating your first AI-powered recipe. It only takes a minute!")}
                      </p>

                      {/* Enhanced CTA button */}
                      <button
                        onClick={() => setShowRecipeGenerationModal(true)}
                        className="relative bg-gradient-to-r from-[#035035] to-[#035035]/90 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all inline-flex items-center gap-2 min-h-[44px] shadow-md group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#035035]/90 to-[#035035] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform" />
                        <span className="relative z-10">{t("library.generateFirstRecipe", "Generate Your First Recipe")}</span>
                      </button>

                      {/* Additional encouraging text */}
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/50">
                        <span>🎯</span>
                        <span>Quick setup</span>
                        <span>•</span>
                        <span>🤖 AI-powered</span>
                        <span>•</span>
                        <span>🎨 Customizable</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-3 sm:gap-4 min-w-min">
                    {latestRecipes.map((recipe) => {
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

                    {/* Generate New Recipe Placeholder Card - Hidden on mobile */}
                    <div className="hidden sm:block flex-shrink-0 w-[200px]">
                      <button
                        onClick={() => setShowRecipeGenerationModal(true)}
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

            {/* Collections Section */}
            <div className="space-y-4">
              {/* Enhanced Section Header with liquid glass */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF9B7B]/5 via-[#A8C9B8]/5 to-[#FF9B7B]/5 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                <div
                  className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl p-3 sm:p-4 border border-white/30 shadow-[0_4px_24px_0_rgba(255,155,123,0.08)]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#FF9B7B] to-[#ff8a61] rounded-xl flex items-center justify-center shadow-md transform hover:rotate-12 transition-transform">
                      <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#035035]">
                      {t("library.collections", "Collections")}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t("library.newCollection", "New Collection")}</span>
                  </button>
                </div>
                </div>
              </div>

              {collections.length === 0 ? (
                <div className="relative overflow-hidden">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 right-4 w-12 h-12 border-2 border-[#FF9B7B] rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-[#A8C9B8] rounded-full"></div>
                    <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-[#FFF8F0] rounded-full"></div>
                  </div>

                  <div
                    className="relative rounded-2xl border-2 border-dashed border-white/50 p-6 sm:p-10 text-center shadow-[0_8px_32px_0_rgba(255,155,123,0.15)]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="max-w-md mx-auto">
                      {/* Enhanced icon with multiple layers */}
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7B]/20 to-[#A8C9B8]/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-1 bg-gradient-to-br from-[#FFF8F0] to-white rounded-full shadow-md"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FolderOpen className="w-10 h-10 text-[#FF9B7B] transform hover:scale-110 transition-transform" />
                        </div>
                        {/* Decorative sparkles */}
                        <div className="absolute -top-1 -right-1 text-lg animate-bounce">📂</div>
                        <div className="absolute -bottom-1 -left-1 text-base animate-bounce" style={{animationDelay: '0.5s'}}>📁</div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] bg-clip-text text-transparent mb-3">
                        {t("library.noCollections", "No collections yet")}
                      </h3>
                      <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-6 leading-relaxed">
                        {t("library.noCollectionsDescription", "Create your first collection to organize recipes")}
                      </p>

                      {/* Enhanced CTA button */}
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="relative bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all inline-flex items-center gap-2 min-h-[44px] shadow-md group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff8a61] to-[#FF9B7B] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform" />
                        <span className="relative z-10">{t("library.createNewCollection", "Create New Collection")}</span>
                      </button>

                      {/* Additional encouraging text */}
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#2D2D2D]/50">
                        <span>📚</span>
                        <span>Organize recipes</span>
                        <span>•</span>
                        <span>🏷️ Add tags</span>
                        <span>•</span>
                        <span>🎯 Easy access</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {collections.map((collection) => (
                    <div key={collection.id} className="relative group">
                      <Link
                        to={`/app/collection/${collection.id}`}
                        className="block rounded-2xl border-2 border-white/40 overflow-hidden hover:shadow-2xl hover:border-[#FF9B7B] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }}
                      >
                        {/* Image Collage */}
                        <div className="bg-[#FFF8F0] h-40 sm:h-44 flex items-center justify-center overflow-hidden relative">
                          <CollectionImageCollage imageUrls={collection.preview_image_urls || []} />

                          {/* Menu Button - top right inside image */}
                          <div className="absolute top-2 right-2 z-10">
                            <CollectionCardMenu
                              collectionId={collection.id}
                              onEdit={handleEditCollection}
                              onDelete={handleDeleteCollection}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-center gap-1 mb-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-[#035035] bg-[#035035]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <FolderOpen className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                              {t("library.collectionLabel", "Collection")}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#2D2D2D] mb-2 line-clamp-2">{collection.name}</h3>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2D2D2D] opacity-60 flex-wrap">
                            <span className="whitespace-nowrap">
                              {collection.recipe_count} {collection.recipe_count === 1 ? t("library.recipe", "Recipe") : t("library.recipes", "Recipes")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="relative rounded-2xl p-6 max-w-md w-full shadow-[0_20px_60px_0_rgba(0,0,0,0.3)] border border-white/30 animate-in zoom-in-95 duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Decorative element */}
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-[#FF9B7B] to-[#ff8a61] rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Plus className="w-6 h-6 text-white" />
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#035035] to-[#035035]/80 bg-clip-text text-transparent mb-5">{t("library.createModalTitle", "Create New Collection")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2 flex items-center gap-1.5">
                  <span>📝</span>
                  {t("library.modalNameLabel", "Name")}
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder={t("library.modalNamePlaceholder", "e.g. Favorite Recipes")}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#A8C9B8]/30 focus:border-[#035035] focus:ring-2 focus:ring-[#035035]/20 focus:outline-none transition-all bg-white shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2 flex items-center gap-1.5">
                  <span>💭</span>
                  {t("library.modalDescriptionLabel", "Description (optional)")}
                </label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder={t("library.modalDescriptionPlaceholder", "Describe your collection...")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#A8C9B8]/30 focus:border-[#035035] focus:ring-2 focus:ring-[#035035]/20 focus:outline-none transition-all resize-none bg-white shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
                className="flex-1 px-5 py-2.5 rounded-full border-2 border-[#A8C9B8]/40 text-[#2D2D2D] font-semibold hover:bg-[#A8C9B8]/10 hover:border-[#A8C9B8] transition-all shadow-sm"
                disabled={creatingCollection}
              >
                {t("library.cancel", "Cancel")}
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#035035] to-[#035035]/90 text-white font-semibold hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                disabled={!newCollectionName.trim() || creatingCollection}
              >
                {creatingCollection ? t("library.creating", "Creating...") : t("library.create", "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collections Modal */}
      {selectedRecipeId && (
        <EditCollectionsModal
          recipeId={selectedRecipeId}
          isOpen={showCollectionsModal}
          onClose={handleCollectionsModalClose}
          onCollectionsUpdated={handleCollectionsUpdated}
          onRecipeDeleted={handleRecipeDeleted}
        />
      )}

      {/* Edit Collection Name Modal */}
      <EditCollectionNameModal
        collection={selectedCollection}
        isOpen={showEditCollectionModal}
        onClose={() => {
          setShowEditCollectionModal(false);
          setSelectedCollection(null);
        }}
        onUpdated={handleCollectionUpdated}
      />

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        collection={selectedCollection}
        isOpen={showDeleteCollectionModal}
        onClose={() => {
          setShowDeleteCollectionModal(false);
          setSelectedCollection(null);
        }}
        onDeleted={handleCollectionDeleted}
      />

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

      {/* Recipe Generation Modal */}
      {showRecipeGenerationModal && (
        <RecipeGeneration
          onClose={() => {
            setShowRecipeGenerationModal(false);
            fetchRecipes(); // Refresh recipes after modal closes
          }}
        />
      )}
    </div>
  );
}