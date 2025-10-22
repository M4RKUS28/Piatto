import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiHeart, PiShareNetwork, PiPrinter, PiClock,
  PiCookingPot, PiMinus, PiPlus, PiCow, PiTrash
} from 'react-icons/pi';
import { getRecipeById, saveRecipe, deleteRecipe } from '../../api/recipeApi';
import { removeRecipeFromCurrent } from '../../api/preparingApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { getImageUrl } from '../../utils/imageUtils';

const SESSION_STORAGE_KEY = 'piatto_preparing_session_id';

const recipeData = {
  baseServings: 4,
  ingredients: [
    { amount: 1, unit: '', name: 'Onion, finely chopped' },
    { amount: 2, unit: '', name: 'Garlic cloves, minced' },
    { amount: 2, unit: 'tbsp', name: 'Olive oil' },
    { amount: 500, unit: 'g', name: 'Ground beef' },
    { amount: 400, unit: 'g', name: 'Canned tomatoes, crushed' },
    { amount: 2, unit: 'tbsp', name: 'Tomato paste' },
    { amount: 1, unit: 'cup', name: 'Beef broth' },
    { amount: 1, unit: 'tsp', name: 'Dried oregano' },
    { amount: 1, unit: 'tsp', name: 'Dried basil' },
    { amount: 0, unit: '', name: 'Salt and pepper to taste' },
    { amount: 400, unit: 'g', name: 'Spaghetti' },
    { amount: 0, unit: '', name: 'Fresh basil for garnish' },
    { amount: 0, unit: '', name: 'Parmesan cheese, grated' },
  ],
};

const nutritionData = {
  servingsPerRecipe: recipeData.baseServings,
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
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servings, setServings] = useState(4);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError('No recipe ID provided');
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
          setError('Recipe not found. It may have been deleted.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else if (!err.response) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Failed to load recipe. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  const handleServingChange = (increment) => {
    setServings(prev => Math.max(1, prev + increment));
  };

  const handleSaveRecipe = async () => {
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Save the recipe
      await saveRecipe(recipeId);

      // Check if there's an active preparing session
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

      if (storedSessionId) {
        const sessionId = Number(storedSessionId);
        if (sessionId && !Number.isNaN(sessionId)) {
          // Remove from current session and navigate back to recipe generation
          try {
            await removeRecipeFromCurrent(sessionId, recipeId);
            // Navigate back to recipe generation page
            navigate('/app/generate');
            return;
          } catch (removeError) {
            console.error('Failed to remove recipe from current session:', removeError);
            // Continue with showing success message if removal fails
          }
        }
      }

      // If no active session, just show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save recipe:', err);

      if (err.response?.status >= 500) {
        setSaveError('Server error. Please try again later.');
      } else if (!err.response) {
        setSaveError('Network error. Please check your connection.');
      } else {
        setSaveError('Failed to save recipe. Please try again.');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteRecipe = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteRecipe(recipeId);

      // Check if there's an active preparing session
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

      if (storedSessionId) {
        const sessionId = Number(storedSessionId);
        if (sessionId && !Number.isNaN(sessionId)) {
          // Remove from current session and navigate back to recipe generation
          try {
            await removeRecipeFromCurrent(sessionId, recipeId);
          } catch (removeError) {
            console.error('Failed to remove recipe from current session:', removeError);
            // Continue with navigation even if removal fails
          }
          // Navigate back to recipe generation page
          navigate('/app/generate');
          return;
        }
      }

      // If no active session, navigate to library
      navigate('/app/library');
    } catch (err) {
      console.error('Failed to delete recipe:', err);

      if (err.response?.status >= 500) {
        setDeleteError('Server error. Please try again later.');
      } else if (!err.response) {
        setDeleteError('Network error. Please check your connection.');
      } else {
        setDeleteError('Failed to delete recipe. Please try again.');
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const NutritionLabel = ({ servingCount }) => (
    <div className="border-2 border-black p-4 font-sans max-w-sm mx-auto">
      <h2 className="font-black text-4xl font-serif">Nutrition Facts</h2>
      <div className="border-b border-gray-400 pb-1 mb-1">
        <p>{servingCount} servings per recipe</p>
        <p className="font-bold">Serving size is calculated from the recipe</p>
      </div>
      <div className="flex justify-between items-end border-b-8 border-black py-1">
        <p className="font-bold">Amount per serving</p>
        <p className="font-black text-5xl">{nutritionData.calories}</p>
      </div>
      <div className="text-right font-bold border-b border-gray-400 py-1">% Daily Value*</div>

      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">Total Fat</span> {nutritionData.totalFat.amount}g</p>
        <p className="font-bold">{nutritionData.totalFat.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1 ml-4">
        <p>Saturated Fat {nutritionData.saturatedFat.amount}g</p>
        <p className="font-bold">{nutritionData.saturatedFat.dv}%</p>
      </div>
      <div className="border-b border-gray-400 py-1 ml-4">
        <p><i>Trans</i> Fat {nutritionData.transFat.amount}g</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">Cholesterol</span> {nutritionData.cholesterol.amount}mg</p>
        <p className="font-bold">{nutritionData.cholesterol.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p><span className="font-bold">Sodium</span> {nutritionData.sodium.amount}mg</p>
        <p className="font-bold">{nutritionData.sodium.dv}%</p>
      </div>
      <div className="flex justify-between border-b-4 border-black py-1">
        <p><span className="font-bold">Total Carbohydrate</span> {nutritionData.totalCarbohydrate.amount}g</p>
        <p className="font-bold">{nutritionData.totalCarbohydrate.dv}%</p>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1 ml-4">
        <p>Dietary Fiber {nutritionData.dietaryFiber.amount}g</p>
        <p className="font-bold">{nutritionData.dietaryFiber.dv}%</p>
      </div>
      <div className="border-b border-gray-400 py-1 ml-4">
        <p>Total Sugars {nutritionData.totalSugars.amount}g</p>
      </div>
      <div className="border-b-8 border-black py-1">
        <p><span className="font-bold">Protein</span> {nutritionData.protein.amount}g</p>
      </div>

      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>Vitamin D {nutritionData.vitaminD.amount}mcg</p>
        <span>{nutritionData.vitaminD.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>Calcium {nutritionData.calcium.amount}mg</p>
        <span>{nutritionData.calcium.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>Iron {nutritionData.iron.amount}mg</p>
        <span>{nutritionData.iron.dv}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-400 py-1">
        <p>Potassium {nutritionData.potassium.amount}mg</p>
        <span>{nutritionData.potassium.dv}%</span>
      </div>

      <p className="text-sm mt-2">* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
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
          message="Recipe data not available"
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
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <h1 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#035035] break-words">
          {recipe.title}
        </h1>
        <p className="mt-2 text-base sm:text-lg text-[#2D2D2D]/80 break-words">
          {recipe.description}
        </p>

        {/* Image */}
        <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden shadow-sm aspect-square max-w-full">
          <img
            src={getImageUrl(recipe.image_url)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 flex-wrap">
          <button
            onClick={handleSaveRecipe}
            disabled={saveLoading || saveSuccess}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-[#FF9B7B] text-white font-poppins font-semibold rounded-full shadow-lg shadow-[#FF9B7B]/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px] text-sm sm:text-base"
          >
            <PiHeart className="w-5 h-5" />
            <span className="hidden xs:inline">{saveLoading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Recipe'}</span>
            <span className="xs:hidden">{saveLoading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 border-2 border-red-500 text-red-500 font-poppins font-semibold rounded-full hover:bg-red-50 transition-colors min-h-[44px] text-sm sm:text-base"
          >
            <PiTrash className="w-5 h-5" />
            <span>Delete</span>
          </button>
          <button className="p-3 sm:p-4 border-2 border-[#A8C9B8] rounded-full text-[#035035] hover:bg-[#A8C9B8]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <PiShareNetwork className="h-5 w-5" />
          </button>
          <button className="p-3 sm:p-4 border-2 border-[#A8C9B8] rounded-full text-[#035035] hover:bg-[#A8C9B8]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <PiPrinter className="h-5 w-5" />
          </button>
        </div>

        {/* Save Success Message */}
        {saveSuccess && (
          <div className="mt-4 p-4 bg-[#A8C9B8]/20 border border-[#A8C9B8] rounded-lg text-[#035035] font-medium">
            Recipe saved successfully!
          </div>
        )}

        {/* Save Error Message */}
        {saveError && (
          <div className="mt-4 p-4 bg-[#FF9B7B]/20 border border-[#FF9B7B] rounded-lg text-[#035035]">
            <p className="font-medium">{saveError}</p>
            <button
              onClick={handleSaveRecipe}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Delete Error Message */}
        {deleteError && (
          <div className="mt-4 p-4 bg-[#FF9B7B]/20 border border-[#FF9B7B] rounded-lg text-[#035035]">
            <p className="font-medium">{deleteError}</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl mx-4">
              <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#035035] mb-3 sm:mb-4 break-words">
                Delete Recipe?
              </h3>
              <p className="text-sm sm:text-base text-[#2D2D2D]/80 mb-5 sm:mb-6 break-words">
                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="px-6 py-3 border-2 border-[#A8C9B8] text-[#035035] font-poppins font-semibold rounded-full hover:bg-[#A8C9B8]/30 transition-colors disabled:opacity-50 min-h-[44px] order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRecipe}
                  disabled={deleteLoading}
                  className="px-6 py-3 bg-red-500 text-white font-poppins font-semibold rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 min-h-[44px] order-1 sm:order-2"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Info */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mt-6 sm:mt-8 py-4 border-y border-[#F5F5F5]">
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <PiClock className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
            <span className="text-xs sm:text-sm font-medium">45 Min.</span>
            <span className="text-xs text-gray-500 hidden sm:block">Total Time</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <PiCookingPot className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
            <span className="text-xs sm:text-sm font-medium">Easy</span>
            <span className="text-xs text-gray-500 hidden sm:block">Difficulty</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <PiCow className="h-6 w-6 sm:h-7 sm:w-7 text-[#035035]" />
            <span className="text-xs sm:text-sm font-medium">Contains Meat</span>
            <span className="text-xs text-gray-500 hidden sm:block">Beef-based</span>
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
              Ingredients
            </button>
            {recipe.nutrition && (
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`-mb-px px-4 sm:px-6 py-3 font-poppins font-semibold text-base sm:text-lg transition-colors duration-300 whitespace-nowrap min-h-[44px] ${activeTab === 'nutrition'
                  ? 'text-[#035035] border-b-2 border-[#035035]'
                  : 'text-gray-500 hover:text-[#035035]'
                  }`}
              >
                Nutrition
              </button>
            )}
          </div>

          <div className="mt-4 sm:mt-6">
            {activeTab === 'ingredients' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F5F5F5] p-3 sm:p-4 rounded-lg gap-3 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">For {servings} serving{servings > 1 && 's'}</span>
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
    </div>
  );
};

export default Recipe;