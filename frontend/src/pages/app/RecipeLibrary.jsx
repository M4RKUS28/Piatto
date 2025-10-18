import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Clock, Users, Filter } from 'lucide-react';
import { getUserRecipes } from '../../api/recipeApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';

export default function RecipeLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserRecipes();
      // Transform backend data to component format
      const transformedRecipes = data.map(recipe => ({
        id: recipe.id,
        name: recipe.title,
        description: recipe.description || '',
        image: recipe.image_url || '🍽️',
        time: recipe.total_time ? `${recipe.total_time} min` : '30 min',
        servings: recipe.base_servings ? `${recipe.base_servings}` : '4',
        difficulty: recipe.difficulty || 'Medium',
        category: recipe.category || 'General'
      }));
      setRecipes(transformedRecipes);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);

      if (err.response?.status === 404) {
        setError('No recipes found. Start by creating your first recipe!');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load recipes. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => {
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
        <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#035035] mb-2">Your Recipes</h1>
            <p className="text-sm sm:text-base text-[#2D2D2D] opacity-60">Discover and save your favorite dishes</p>
          </div>
          <Link
            to="/app"
            className="px-6 py-3 rounded-full border-2 border-[#035035] text-[#035035] font-semibold hover:bg-[#035035] hover:text-white transition-all text-center min-h-[44px] flex items-center justify-center"
          >
            Back to Dashboard
          </Link>
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

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <EmptyState
            title="No recipes yet"
            message="Start by creating your first recipe and it will appear here."
            actionLabel="Go to Dashboard"
            onAction={() => navigate('/app')}
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
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all text-base min-h-[44px]"
                />
              </div>
              <button className="bg-white border-2 border-[#035035] text-[#035035] px-6 py-3 rounded-full font-semibold hover:bg-[#035035] hover:text-white transition-all flex items-center justify-center gap-2 min-h-[44px] min-w-[120px]">
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>

            {/* No Results Message */}
            {filteredRecipes.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-[#2D2D2D] opacity-60 mb-2">No results found</p>
                <p className="text-sm text-[#2D2D2D] opacity-40">
                  Try adjusting your search terms
                </p>
              </div>
            )}

            {/* Recipe Grid */}
            {filteredRecipes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredRecipes.map((recipe) => (
                  <Link
                    to={`/app/recipe/${recipe.id}`}
                    key={recipe.id}
                    className="bg-white rounded-2xl border border-[#F5F5F5] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer min-h-[44px]"
                  >
                    {/* Image */}
                    <div className="bg-[#FFF8F0] h-48 sm:h-56 flex items-center justify-center overflow-hidden">
                      {recipe.image.startsWith('http') ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-6xl sm:text-7xl">{recipe.image}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#035035] bg-[#035035]/10 px-3 py-1 rounded-full whitespace-nowrap">
                          {recipe.category}
                        </span>
                        <span className="text-xs font-semibold text-[#FF9B7B] bg-[#FF9B7B]/10 px-3 py-1 rounded-full whitespace-nowrap">
                          {recipe.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#2D2D2D] mb-3 line-clamp-2">{recipe.name}</h3>
                      <div className="flex items-center gap-3 sm:gap-4 text-sm text-[#2D2D2D] opacity-60 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{recipe.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{recipe.servings} servings</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Add Recipe Button */}
            <div className="mt-6 md:mt-8 text-center">
              <button
                onClick={() => navigate('/app')}
                className="bg-[#FF9B7B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-md text-base sm:text-lg min-h-[44px] min-w-[160px]"
              >
                + Add New Recipe
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}