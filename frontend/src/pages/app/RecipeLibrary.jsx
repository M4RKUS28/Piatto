import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Users, FolderOpen, Plus } from 'lucide-react';
import { getUserRecipes, deleteRecipe } from '../../api/recipeApi';
import { getUserCollections, createCollection } from '../../api/collectionApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import RecipeCardMenu from '../../components/RecipeCardMenu';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import CollectionImageCollage from '../../components/CollectionImageCollage';
import { getImageUrl } from '../../utils/imageUtils';

export default function RecipeLibrary() {
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

  const fetchRecipes = async () => {
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
          time: recipe.total_time ? `${recipe.total_time} min` : '30 min',
          servings: recipe.base_servings ? `${recipe.base_servings}` : '4',
          difficulty: recipe.difficulty || 'Medium',
          category: recipe.category || 'General'
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
  };

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

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Möchtest du dieses Rezept wirklich löschen?')) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
      // Refresh recipes
      await fetchRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('Fehler beim Löschen des Rezepts');
    }
  };

  const handleRecipeDeleted = () => {
    // Refresh recipes after recipe is deleted
    fetchRecipes();
    setShowCollectionsModal(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

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

        {/* Recipes Content */}
        {!loading && !error && (
          <>
            {/* Latest Recipes Section - Horizontal scroll with 6 recipes */}
            {latestRecipes.length > 0 && (
              <div className="mb-8 md:mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#035035] mb-4">Letzte Rezepte</h2>
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex gap-4 min-w-min">
                    {latestRecipes.map((recipe) => {
                      const isNew = newRecipeIds.has(recipe.id);

                      return (
                        <div key={recipe.id} className="flex-shrink-0 w-[180px] sm:w-[200px]">
                          <Link
                            to={`/app/recipe/${recipe.id}`}
                            className={`block bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
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
                                  ✨ NEU
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
                                  <span className="whitespace-nowrap">{recipe.servings}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Collections Section */}
            <div className="mb-8 md:mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#035035]">Sammlungen</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#FF9B7B] text-white px-4 py-2 rounded-full font-semibold hover:scale-105 transition-all flex items-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-5 h-5" />
                  <span>Neue Sammlung</span>
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#F5F5F5] p-8 text-center">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#2D2D2D] opacity-20" />
                  <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">Noch keine Sammlungen</h3>
                  <p className="text-[#2D2D2D] opacity-60 mb-4">Erstelle deine erste Sammlung, um Rezepte zu organisieren</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all min-h-[44px]"
                  >
                    Neue Sammlung erstellen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {collections.map((collection) => (
                    <Link
                      to={`/app/collection/${collection.id}`}
                      key={collection.id}
                      className="bg-white rounded-2xl border border-[#F5F5F5] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                    >
                      {/* Image Collage */}
                      <div className="h-48 bg-[#FFF8F0]">
                        <CollectionImageCollage imageUrls={collection.preview_image_urls || []} />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-[#2D2D2D] mb-1">{collection.name}</h3>
                        {collection.description && (
                          <p className="text-sm text-[#2D2D2D] opacity-60 mb-2 line-clamp-2">{collection.description}</p>
                        )}
                        <p className="text-xs text-[#035035] font-semibold">
                          {collection.recipe_count} {collection.recipe_count === 1 ? 'Rezept' : 'Rezepte'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#035035] mb-4">Neue Sammlung erstellen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="z.B. Lieblingsrezepte"
                  className="w-full px-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">Beschreibung (optional)</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Beschreibe deine Sammlung..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all resize-none"
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
                className="flex-1 px-6 py-3 rounded-full border-2 border-[#F5F5F5] text-[#2D2D2D] font-semibold hover:bg-[#F5F5F5] transition-all"
                disabled={creatingCollection}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newCollectionName.trim() || creatingCollection}
              >
                {creatingCollection ? 'Erstellen...' : 'Erstellen'}
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