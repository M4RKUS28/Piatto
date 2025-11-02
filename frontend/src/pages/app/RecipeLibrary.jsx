import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserRecipes } from '../../api/recipeApi';
import { getUserCollections, createCollection } from '../../api/collectionApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EditCollectionsModal from '../../components/EditCollectionsModal';
import EditCollectionNameModal from '../../components/EditCollectionNameModal';
import DeleteCollectionModal from '../../components/DeleteCollectionModal';
import DeleteRecipeModal from '../../components/DeleteRecipeModal';
import { getImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import RecipeGeneration from './RecipeGeneration';
import LibraryBackground from '../../components/library/LibraryBackground';
import LatestRecipesSection from '../../components/library/LatestRecipesSection';
import CollectionsSection from '../../components/library/CollectionsSection';
import WelcomeState from '../../components/library/WelcomeState';

export default function RecipeLibrary() {
  const { t } = useTranslation(["recipe", "common"])
  const { user } = useAuth();
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
  const hasRecipes = latestRecipes.length > 0;

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
    <>
      <LibraryBackground username={user?.username}>
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

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Show Welcome State for new users with no recipes, otherwise show Latest Recipes */}
            {!hasRecipes ? (
              <WelcomeState
                onGenerateRecipe={() => setShowRecipeGenerationModal(true)}
              />
            ) : (
              <LatestRecipesSection
                latestRecipes={latestRecipes}
                newRecipeIds={newRecipeIds}
                queryString={queryString}
                onEditCollections={handleEditCollections}
                onDeleteRecipe={handleDeleteRecipe}
                onGenerateRecipe={() => setShowRecipeGenerationModal(true)}
              />
            )}

            {/* Collections Section - Always shown */}
            <CollectionsSection
              collections={collections}
              onCreateCollection={() => setShowCreateModal(true)}
              onEditCollection={handleEditCollection}
              onDeleteCollection={handleDeleteCollection}
            />
          </>
        )}
      </LibraryBackground>
      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#035035] mb-4">{t("library.createModalTitle", "Create New Collection")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">{t("library.modalNameLabel", "Name")}</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder={t("library.modalNamePlaceholder", "e.g. Favorite Recipes")}
                  className="w-full px-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">{t("library.modalDescriptionLabel", "Description (optional)")}</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder={t("library.modalDescriptionPlaceholder", "Describe your collection...")}
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
                {t("library.cancel", "Cancel")}
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}