import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiHeart, PiShareNetwork, PiPrinter, PiClock,
  PiCookingPot, PiMinus, PiPlus, PiCow, PiDotsThreeVertical, PiTrash, PiLeaf, PiEgg
} from 'react-icons/pi';
import { FolderOpen, Wine, CupSoda } from 'lucide-react';
import { getRecipeById, deleteRecipe } from '../../api/recipeApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import { getImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next'
import useMediaQuery from '../../hooks/useMediaQuery';

// Helper function to get food category icon and label
const getFoodCategoryDisplay = (category, t) => {
  if (!category) {
    return {
      icon: PiCookingPot,
      label: t('foodCategory.na', { ns: 'common', defaultValue: 'N/A' }),
      sublabel: ''
    };
  }

  const normalized = category.toLowerCase().replace(/_/g, '-');

  // Vegan and vegetarian
  if (normalized === 'vegan') {
    return {
      icon: PiLeaf,
      label: t('foodCategory.vegan', { ns: 'common', defaultValue: 'Vegan' }),
      sublabel: t('foodCategory.veganSub', { ns: 'common', defaultValue: 'Plant-based' })
    };
  }
  if (normalized === 'vegetarian') {
    return {
      icon: PiEgg,
      label: t('foodCategory.vegetarian', { ns: 'common', defaultValue: 'Vegetarian' }),
      sublabel: t('foodCategory.vegetarianSub', { ns: 'common', defaultValue: 'Contains dairy/eggs' })
    };
  }

  if (normalized === 'alcoholic') {
    return {
      icon: Wine,
      label: t('foodCategory.alcoholic', { ns: 'common', defaultValue: 'Alcoholic' }),
      sublabel: t('foodCategory.alcoholicSub', { ns: 'common', defaultValue: 'Contains alcohol' })
    };
  }

  if (normalized === 'non-alcoholic') {
    return {
      icon: CupSoda,
      label: t('foodCategory.nonAlcoholic', { ns: 'common', defaultValue: 'Non-alcoholic' }),
      sublabel: t('foodCategory.nonAlcoholicSub', { ns: 'common', defaultValue: 'Alcohol-free' })
    };
  }

  // All meat types use the same icon but display the specific meat type
  const meatLabels = {
    'beef': {
      label: t('foodCategory.beef', { ns: 'common', defaultValue: 'Beef' }),
      sublabel: t('foodCategory.beefSub', { ns: 'common', defaultValue: 'Beef-based' })
    },
    'pork': {
      label: t('foodCategory.pork', { ns: 'common', defaultValue: 'Pork' }),
      sublabel: t('foodCategory.porkSub', { ns: 'common', defaultValue: 'Pork-based' })
    },
    'chicken': {
      label: t('foodCategory.chicken', { ns: 'common', defaultValue: 'Chicken' }),
      sublabel: t('foodCategory.chickenSub', { ns: 'common', defaultValue: 'Poultry' })
    },
    'lamb': {
      label: t('foodCategory.lamb', { ns: 'common', defaultValue: 'Lamb' }),
      sublabel: t('foodCategory.lambSub', { ns: 'common', defaultValue: 'Lamb-based' })
    },
    'fish': {
      label: t('foodCategory.fish', { ns: 'common', defaultValue: 'Fish' }),
      sublabel: t('foodCategory.fishSub', { ns: 'common', defaultValue: 'Fish-based' })
    },
    'seafood': {
      label: t('foodCategory.seafood', { ns: 'common', defaultValue: 'Seafood' }),
      sublabel: t('foodCategory.seafoodSub', { ns: 'common', defaultValue: 'Seafood-based' })
    },
    'mixed-meat': {
      label: t('foodCategory.mixedMeat', { ns: 'common', defaultValue: 'Mixed Meat' }),
      sublabel: t('foodCategory.mixedMeatSub', { ns: 'common', defaultValue: 'Multiple meats' })
    },
  };

  const meatInfo = meatLabels[normalized];
  if (meatInfo) {
    return { icon: PiCow, ...meatInfo };
  }

  // Fallback
  return {
    icon: PiCookingPot,
    label: t('foodCategory.na', { ns: 'common', defaultValue: 'N/A' }),
    sublabel: ''
  };
};

// Helper function to format difficulty
const formatDifficulty = (difficulty, t) => {
  if (!difficulty) return t('difficulty.na', { ns: 'common', defaultValue: 'N/A' });

  const difficultyMap = {
    'easy': t('difficulty.easy', { ns: 'common', defaultValue: 'Easy' }),
    'medium': t('difficulty.medium', { ns: 'common', defaultValue: 'Medium' }),
    'hard': t('difficulty.hard', { ns: 'common', defaultValue: 'Hard' })
  };

  return difficultyMap[difficulty.toLowerCase()] || difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

// Helper function to get difficulty text color
const getDifficultyTextColor = (difficulty) => {
  const lowerDifficulty = difficulty?.toLowerCase();

  switch (lowerDifficulty) {
    case 'easy':
      return 'text-green-600';
    case 'medium':
      return 'text-orange-500';
    case 'hard':
      return 'text-orange-700';
    default:
      return 'text-[#035035]'; // Default color
  }
};

// Helper function to format time
const formatTime = (minutes, t) => {
  if (!minutes) return t('time.na', { ns: 'common', defaultValue: 'N/A' });
  if (minutes < 60) return `${minutes} ${t('time.min', { ns: 'common', defaultValue: 'Min.' })}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}${t('time.h', { ns: 'common', defaultValue: 'h' })} ${mins}${t('time.min', { ns: 'common', defaultValue: 'min' })}` : `${hours}${t('time.h', { ns: 'common', defaultValue: 'h' })}`;
};

const nutritionData = {
  servingsPerRecipe: 4,
  calories: 648,
  totalFat: { amount: 28, dv: 36 },
  saturatedFat: { amount: 10, dv: 50 },
  transFat: { amount: 1, dv: null },
  cholesterol: { amount: 95, dv: 32 },
  sodium: { amount: 1080, dv: 47 },
  totalCarbohydrate: { amount: 65, dv: 24 },
  dietaryFiber: { amount: 8, dv: 29 },
  totalSugars: { amount: 12, dv: null },
  protein: { amount: 35, dv: 70 },
  vitaminD: { amount: 2, dv: 10 },
  calcium: { amount: 150, dv: 12 },
  iron: { amount: 4, dv: 22 },
  potassium: { amount: 800, dv: 17 },
};

const Recipe = ({ recipeId }) => {
  const { t } = useTranslation(['recipe', 'common']);
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servings, setServings] = useState(4);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [showMenu, setShowMenu] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const menuRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError(t('errors.noId', 'No recipe ID provided'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getRecipeById(recipeId);
        setRecipe(data);
        // Set servings to baseServings from recipe or default to 4
        setServings(data.baseServings || 4);
      } catch (err) {
        console.error('Failed to fetch recipe:', err);

        if (err.response?.status === 404) {
          setError(t('errors.notFound', 'Recipe not found. It may have been deleted.'));
        } else if (err.response?.status >= 500) {
          setError(t('errors.serverError', 'Server error. Please try again later.'));
        } else if (!err.response) {
          setError(t('errors.networkError', 'Network error. Please check your connection.'));
        } else {
          setError(t('errors.loadFailed', 'Failed to load recipe. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, t]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleServingChange = (increment) => {
    setServings(prev => Math.max(1, prev + increment));
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm(t('deleteConfirm', 'Are you sure you want to delete this recipe?'))) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
      navigate('/app/recipes');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert(t('deleteFailed', 'Failed to delete recipe'));
    }
  };

  const handleRecipeDeleted = () => {
    navigate('/app/recipes');
  };

  const NutritionLabel = ({ servingCount }) => (
    <div className="border-2 border-black p-4 font-sans max-w-sm mx-auto">
      <h2 className="font-black text-4xl font-serif">{t('nutrition.title', 'Nutrition Facts')}</h2>
      <div className="border-b border-gray-400 pb-1 mb-1">
        <p>{t('nutrition.servingsPerRecipe', { count: servingCount, defaultValue: `${servingCount} servings per recipe` })}</p>
        <p className="font-bold">{t('nutrition.servingSize', 'Serving size is calculated from the recipe')}</p>
      </div>
      <div className="flex justify-between items-end border-b-8 border-black py-1">
        <p className="font-bold">{t('nutrition.amountPerServing', 'Amount per serving')}</p>
        <p className="font-black text-5xl">{nutritionData.calories}</p>
      </div>
      <div className="text-right font-bold border-b border-gray-400 py-1">{t('nutrition.dailyValue', '% Daily Value*')}</div>

      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">{t('nutrition.totalFat', 'Total Fat')}</span> {nutritionData.totalFat.amount}g</p>
        <p className="font-bold">{nutritionData.totalFat.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1 ml-4">
        <p>{t('nutrition.saturatedFat', 'Saturated Fat')} {nutritionData.saturatedFat.amount}g</p>
        <p className="font-bold">{nutritionData.saturatedFat.dv}%</p>
      </div>
      <div className="border-b border-gray-400 py-1 ml-4">
        <p><i>{t('nutrition.trans', 'Trans')}</i> {t('nutrition.fat', 'Fat')} {nutritionData.transFat.amount}g</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">{t('nutrition.cholesterol', 'Cholesterol')}</span> {nutritionData.cholesterol.amount}mg</p>
        <p className="font-bold">{nutritionData.cholesterol.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">{t('nutrition.sodium', 'Sodium')}</span> {nutritionData.sodium.amount}mg</p>
        <p className="font-bold">{nutritionData.sodium.dv}%</p>
      </div>
      <div className="flex justify-between border-b-4 border-black py-1">
        <p><span className="font-bold">{t('nutrition.totalCarbohydrate', 'Total Carbohydrate')}</span> {nutritionData.totalCarbohydrate.amount}g</p>
        <p className="font-bold">{nutritionData.totalCarbohydrate.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1 ml-4">
        <p>{t('nutrition.dietaryFiber', 'Dietary Fiber')} {nutritionData.dietaryFiber.amount}g</p>
        <p className="font-bold">{nutritionData.dietaryFiber.dv}%</p>
      </div>
      <div className="border-b border-gray-400 py-1 ml-4">
        <p>{t('nutrition.totalSugars', 'Total Sugars')} {nutritionData.totalSugars.amount}g</p>
      </div>
      <div className="border-b-8 border-black py-1">
        <p><span className="font-bold">{t('nutrition.protein', 'Protein')}</span> {nutritionData.protein.amount}g</p>
      </div>

      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>{t('nutrition.vitaminD', 'Vitamin D')} {nutritionData.vitaminD.amount}mcg</p>
        <span>{nutritionData.vitaminD.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>{t('nutrition.calcium', 'Calcium')} {nutritionData.calcium.amount}mg</p>
        <span>{nutritionData.calcium.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>{t('nutrition.iron', 'Iron')} {nutritionData.iron.amount}mg</p>
        <span>{nutritionData.iron.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>{t('nutrition.potassium', 'Potassium')} {nutritionData.potassium.amount}mg</p>
        <span>{nutritionData.potassium.dv}%</span>
      </div>

      <p className="text-sm mt-2">{t('nutrition.disclaimer', '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.')}</p>
    </div>
  );

  // Display loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          message={error}
          onRetry={() => navigate('/app/library')}
        />
      </div>
    );
  }

  // If no recipe data, show error
  if (!recipe) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          message={t('errors.dataNotAvailable', 'Recipe data not available')}
          onRetry={() => navigate('/app/library')}
        />
      </div>
    );
  }

  // Transform backend ingredients to component format
  const transformedIngredients = recipe.ingredients.map(ing => ({
    amount: ing.quantity,
    unit: ing.unit || '',
    name: ing.name
  }));

  // Get base servings from recipe or default to 4
  const baseServings = recipe.baseServings || 4;

  const adjustIngredient = (amount) => {
    if (!amount) return '';
    const newAmount = (amount / baseServings) * servings;
    if (newAmount > 0 && newAmount < 0.1) {
      return newAmount.toPrecision(1);
    }
    return parseFloat(newAmount.toFixed(2));
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-white">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header with Share, Print, and Menu buttons */}
        <div className={`flex items-start justify-between gap-4 mb-4 ${isMobile ? 'flex-col' : ''}`}>
          <div className="flex-1">
            <h1 className="font-poppins font-bold text-xl sm:text-2xl text-[#035035] break-words">
              {recipe.title}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-[#2D2D2D]/80 break-words">
              {recipe.description}
            </p>
          </div>
          <div className={`flex gap-2 flex-shrink-0 ${isMobile ? 'self-stretch justify-end' : ''}`}>
            <button className="p-3 border-2 border-[#A8C9B8] rounded-full text-[#035035] hover:bg-[#A8C9B8]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <PiShareNetwork className="h-5 w-5" />
            </button>
            <button className="p-3 border-2 border-[#A8C9B8] rounded-full text-[#035035] hover:bg-[#A8C9B8]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <PiPrinter className="h-5 w-5" />
            </button>

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 border-2 border-[#A8C9B8] rounded-full text-[#035035] hover:bg-[#A8C9B8]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <PiDotsThreeVertical className="h-5 w-5" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#F5F5F5] py-2 z-50">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowCollectionsModal(true);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[#F5F5F5] transition-colors flex items-center gap-3"
                  >
                    <FolderOpen className="w-5 h-5 text-[#035035]" />
                    <span className="text-[#2D2D2D] font-medium">{t('editCollection', 'Edit Collection')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDeleteRecipe();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <PiTrash className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-medium">{t('deleteRecipe', 'Delete Recipe')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden shadow-sm aspect-square max-w-full">
          <img
            src={getImageUrl(recipe.image_url)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>


        {/* Recipe Info */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-2 sm:gap-4'} text-center mt-6 sm:mt-8 py-4 border-y border-[#F5F5F5]`}>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <PiClock className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
            <span className="text-xs sm:text-sm font-medium">{formatTime(recipe.total_time_minutes, t)}</span>
            <span className="text-xs text-gray-500 hidden sm:block">{t('totalTime', 'Total Time')}</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <PiCookingPot className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
            <span className={`text-xs sm:text-sm font-bold ${getDifficultyTextColor(recipe.difficulty)}`}>{formatDifficulty(recipe.difficulty, t)}</span>
            <span className="text-xs text-gray-500 hidden sm:block">{t('difficultyLabel', 'Difficulty')}</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            {(() => {
              const foodDisplay = getFoodCategoryDisplay(recipe.food_category, t);
              const IconComponent = foodDisplay.icon;
              return (
                <>
                  <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
                  <span className="text-xs sm:text-sm font-medium">{foodDisplay.label}</span>
                  <span className="text-xs text-gray-500 hidden sm:block">{foodDisplay.sublabel}</span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-8">
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`-mb-px px-4 sm:px-6 py-3 font-poppins font-semibold text-base sm:text-lg transition-colors duration-300 whitespace-nowrap min-h-[44px] ${activeTab === 'ingredients'
                ? 'text-[#035035] border-b-2 border-[#035035]'
                : 'text-gray-500 hover:text-[#035035]'
                }`}
            >
              {t('tabs.ingredients', 'Ingredients')}
            </button>
            {recipe.nutrition && (
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`-mb-px px-4 sm:px-6 py-3 font-poppins font-semibold text-base sm:text-lg transition-colors duration-300 whitespace-nowrap min-h-[44px] ${activeTab === 'nutrition'
                  ? 'text-[#035035] border-b-2 border-[#035035]'
                  : 'text-gray-500 hover:text-[#035035]'
                  }`}
              >
                {t('tabs.nutrition', 'Nutrition')}
              </button>
            )}
          </div>

          <div className="mt-4 sm:mt-6">
            {activeTab === 'ingredients' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F5F5F5] p-3 sm:p-4 rounded-lg gap-3 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">{t('forServings', { count: servings, defaultValue: `For ${servings} serving${servings > 1 ? 's' : ''}` })}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleServingChange(-1)}
                      className="p-2 sm:p-3 bg-white rounded-full shadow-sm hover:bg-[#FFF8F0] transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      disabled={servings <= 1}
                    >
                      <PiMinus className="w-5 h-5" />
                    </button>
                    <span className="w-10 sm:w-12 text-center font-bold text-lg">{servings}</span>
                    <button
                      onClick={() => handleServingChange(1)}
                      className="p-2 sm:p-3 bg-white rounded-full shadow-sm hover:bg-[#FFF8F0] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <PiPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 sm:space-y-3">
                  {transformedIngredients.map((ing, index) => (
                    <li key={index} className="flex items-start sm:items-center gap-3 sm:gap-4 py-2 sm:py-3 border-b border-[#F5F5F5]/60">
                      <p className="font-medium text-right w-16 sm:w-20 text-sm sm:text-base flex-shrink-0">
                        {adjustIngredient(ing.amount)} {ing.unit}
                      </p>
                      <p className="text-sm sm:text-base break-words">{ing.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'nutrition' && recipe.nutrition && (
              <NutritionLabel servingCount={servings} />
            )}
          </div>
        </div>
      </div>

      {/* Edit Collections Modal */}
      <EditCollectionsModal
        recipeId={recipeId}
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        onRecipeDeleted={handleRecipeDeleted}
      />
    </div>
  );
};

export default Recipe;
