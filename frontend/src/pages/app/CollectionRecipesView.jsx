import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, Clock, Users, Filter, ArrowLeft } from 'lucide-react';
import { getCollectionById } from '../../api/collectionApi';
import { deleteRecipe } from '../../api/recipeApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import RecipeCardMenu from '../../components/RecipeCardMenu';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import CollectionImageCollage from '../../components/CollectionImageCollage';
import { getImageUrl } from '../../utils/imageUtils';

export default function CollectionRecipesView() {
  const { collectionId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [collection, setCollection] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const navigate = useNavigate();

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCollectionById(parseInt(collectionId));
      setCollection(data);

      // Transform recipes to component format
      const transformedRecipes = data.recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.title,
        description: recipe.description || '',
        image: recipe.image_url ? getImageUrl(recipe.image_url) : '🍽️',
        originalImageUrl: recipe.image_url || '', // Keep original URL for collage
        time: '30 min',
        servings: '4',
        difficulty: 'Medium',
        category: 'General'
      }));
      setRecipes(transformedRecipes);
    } catch (err) {
      console.error('Failed to fetch collection:', err);

      if (err.response?.status === 404) {
        setError('Collection not found.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load collection. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const handleEditCollections = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setShowCollectionsModal(true);
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Möchtest du dieses Rezept wirklich löschen?')) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
      // Refresh the collection to update the recipe list
      fetchCollection();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('Fehler beim Löschen des Rezepts');
    }
  };

  const handleRecipeDeleted = () => {
    // Refresh the collection after recipe is deleted
    fetchCollection();
    setShowCollectionsModal(false);
  };

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
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/app/recipes')}
            className="flex items-center gap-2 text-[#035035] hover:underline mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück zur Bibliothek</span>
          </button>

          {collection && (
            <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
              {/* Collection Image Collage */}
              <div className="w-full md:w-32 h-32 flex-shrink-0">
                <CollectionImageCollage
                  imageUrls={recipes.slice(0, 4).map(r => r.originalImageUrl).filter(url => url)}
                />
              </div>

              {/* Collection Info */}
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#035035] mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-base text-[#2D2D2D] opacity-60">{collection.description}</p>
                )}
                <p className="text-sm text-[#035035] font-semibold mt-2">
                  {recipes.length} {recipes.length === 1 ? 'Rezept' : 'Rezepte'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20">
            <LoadingSpinner size="large" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <ErrorMessage message={error} onRetry={fetchCollection} />
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <EmptyState
            title="Keine Rezepte in dieser Sammlung"
            message="Füge Rezepte zu dieser Sammlung hinzu, indem du sie im Rezept-Menü zur Sammlung hinzufügst."
            actionLabel="Zur Bibliothek"
            onAction={() => navigate('/app/recipes')}
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
                  placeholder="Rezepte durchsuchen..."
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
                <p className="text-xl text-[#2D2D2D] opacity-60 mb-2">Keine Ergebnisse gefunden</p>
                <p className="text-sm text-[#2D2D2D] opacity-40">
                  Versuche es mit anderen Suchbegriffen
                </p>
              </div>
            )}

            {/* Recipe Grid */}
            {filteredRecipes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="relative">
                    <Link
                      to={`/app/recipe/${recipe.id}`}
                      className="block bg-white rounded-xl border border-[#F5F5F5] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
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
                          <span className="text-[10px] font-semibold text-[#035035] bg-[#035035]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {recipe.category}
                          </span>
                          <span className="text-[10px] font-semibold text-[#FF9B7B] bg-[#FF9B7B]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {recipe.difficulty}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#2D2D2D] mb-2 line-clamp-2">{recipe.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-[#2D2D2D] opacity-60 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{recipe.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{recipe.servings} servings</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
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
    </div>
  );
}
