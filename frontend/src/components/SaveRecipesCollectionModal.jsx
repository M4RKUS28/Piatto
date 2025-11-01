import { useState, useEffect } from 'react';
import { X, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserCollections, createCollection, updateCollectionRecipes } from '../api/collectionApi';
import { getImageUrl } from '../utils/imageUtils';
import LoadingSpinner from './LoadingSpinner';
import { useTranslation } from 'react-i18next'

/**
 * SaveRecipesCollectionModal component - Multi-step wizard for saving recipes to collections
 * Each recipe gets its own page, with selections from previous recipe as default
 *
 * @param {Object} props
 * @param {Array} props.recipes - Array of recipe objects {id, title, image_url, description}
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSave - Callback when recipes are saved: onSave(recipeIds, recipeCollectionMap)
 */
export default function SaveRecipesCollectionModal({ recipes, isOpen, onClose, onSave }) {
  const [collections, setCollections] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // Current recipe index

  // Map of recipeId -> Set of collectionIds
  const [recipeSelections, setRecipeSelections] = useState(new Map());

  // Track which recipes have been visited/configured
  const [visitedRecipes, setVisitedRecipes] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      // Initialize with empty selections only if not already set
      setRecipeSelections(prevSelections => {
        const initialSelections = new Map();
        recipes.forEach(recipe => {
          // Keep existing selections if they exist, otherwise create empty set
          initialSelections.set(recipe.id, prevSelections.get(recipe.id) || new Set());
        });
        return initialSelections;
      });
      setVisitedRecipes(new Set()); // Reset visited tracking
      setCurrentStep(0);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen, recipes]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);

    try {
      const allCollections = await getUserCollections();
      setCollections(allCollections);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Fehler beim Laden der Sammlungen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = (collectionId) => {
    const currentRecipe = recipes[currentStep];
    const currentSelections = new Set(recipeSelections.get(currentRecipe.id) || new Set());

    if (currentSelections.has(collectionId)) {
      currentSelections.delete(collectionId);
    } else {
      currentSelections.add(collectionId);
    }

    const newRecipeSelections = new Map(recipeSelections);
    newRecipeSelections.set(currentRecipe.id, currentSelections);
    setRecipeSelections(newRecipeSelections);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreatingCollection(true);
    setError(null);

    try {
      const newCollection = await createCollection({
        name: newCollectionName,
        description: newCollectionDescription,
      });

      // Add new collection to list and select it
      setCollections([...collections, { ...newCollection, recipe_count: 0, recipe_ids: [] }]);

      // Add to current recipe's selections
      const currentRecipe = recipes[currentStep];
      const currentSelections = new Set(recipeSelections.get(currentRecipe.id) || new Set());
      currentSelections.add(newCollection.id);
      const newRecipeSelections = new Map(recipeSelections);
      newRecipeSelections.set(currentRecipe.id, currentSelections);
      setRecipeSelections(newRecipeSelections);

      // Reset form
      setShowCreateForm(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError('Sammlung konnte nicht erstellt werden');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleNext = () => {
    const currentRecipe = recipes[currentStep];
    const currentSelections = recipeSelections.get(currentRecipe.id);

    // Validate current step
    if (!currentSelections || currentSelections.size === 0) {
      setError('Bitte wähle mindestens eine Sammlung aus');
      return;
    }

    setError(null);

    // Mark current recipe as visited
    setVisitedRecipes(prev => new Set([...prev, currentRecipe.id]));

    if (currentStep < recipes.length - 1) {
      const nextRecipeId = recipes[currentStep + 1].id;

      // Only inherit selections if the next recipe hasn't been visited yet
      if (!visitedRecipes.has(nextRecipeId)) {
        setRecipeSelections(prevSelections => {
          const nextSelections = prevSelections.get(nextRecipeId);

          // If next recipe has no selections and hasn't been visited, inherit from current
          if (!nextSelections || nextSelections.size === 0) {
            const newRecipeSelections = new Map(prevSelections);
            newRecipeSelections.set(nextRecipeId, new Set(currentSelections));
            return newRecipeSelections;
          }

          return prevSelections;
        });
      }

      setCurrentStep(currentStep + 1);
      setSearchQuery('');
      setShowCreateForm(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSearchQuery('');
      setShowCreateForm(false);
      setError(null);
    }
  };

  const handleSave = async () => {
    const currentRecipe = recipes[currentStep];
    const currentSelections = recipeSelections.get(currentRecipe.id);

    // Validate current (last) step
    if (!currentSelections || currentSelections.size === 0) {
      setError('Bitte wähle mindestens eine Sammlung aus');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Validate all recipes have at least one collection
      for (const [recipeId, collectionIds] of recipeSelections.entries()) {
        if (collectionIds.size === 0) {
          const recipe = recipes.find(r => r.id === recipeId);
          setError(`Bitte wähle mindestens eine Sammlung für "${recipe.title}" aus`);
          setSaving(false);
          return;
        }
      }

      // Build a map of collectionId -> Set of recipeIds
      const collectionToRecipes = new Map();

      for (const [recipeId, collectionIds] of recipeSelections.entries()) {
        for (const collectionId of collectionIds) {
          if (!collectionToRecipes.has(collectionId)) {
            // Initialize with existing recipes from the collection
            const collection = collections.find(c => c.id === collectionId);
            collectionToRecipes.set(collectionId, new Set(collection?.recipe_ids || []));
          }
          // Add the current recipe to this collection
          collectionToRecipes.get(collectionId).add(recipeId);
        }
      }

      // Update each collection once with all its recipes
      for (const [collectionId, recipeIds] of collectionToRecipes.entries()) {
        await updateCollectionRecipes(collectionId, Array.from(recipeIds));
      }

      // Call onSave callback with recipe IDs and their collection assignments
      if (onSave) {
        const recipeIds = recipes.map(r => r.id);
        await onSave(recipeIds, recipeSelections);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save recipes to collections:', err);
      setError('Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentSelections = () => {
    const currentRecipe = recipes[currentStep];
    return recipeSelections.get(currentRecipe.id) || new Set();
  };

  if (!isOpen) return null;

  const currentRecipe = recipes[currentStep];
  const isLastStep = currentStep === recipes.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#F5F5F5]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#035035]">In Sammlung speichern</h2>
              <p className="text-sm text-[#2D2D2D] opacity-60 mt-1">
                Schritt {currentStep + 1} von {recipes.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
              disabled={saving}
            >
              <X className="w-5 h-5 text-[#2D2D2D]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#035035] h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / recipes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Recipe Display */}
        <div className="p-4 bg-[#F5F5F5] border-b border-[#E0E0E0]">
          <div className="flex items-center gap-3 bg-white rounded-xl p-4">
            <img
              src={getImageUrl(currentRecipe.image_url)}
              alt={currentRecipe.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#035035] text-lg mb-1 truncate">{currentRecipe.title}</h3>
              {currentRecipe.description && (
                <p className="text-sm text-[#2D2D2D] opacity-60 line-clamp-2">{currentRecipe.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2D2D2D] opacity-40" />
                <input
                  type="text"
                  placeholder="Sammlungen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all"
                  disabled={saving}
                />
              </div>

              {/* Create Collection Button */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={saving}
                  className="w-full mb-4 py-3 rounded-full border-2 border-dashed border-[#035035] text-[#035035] font-semibold hover:bg-[#035035]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  <span>Neue Sammlung erstellen</span>
                </button>
              ) : (
                <div className="mb-4 p-4 bg-[#F5F5F5] rounded-2xl">
                  <h3 className="font-semibold text-[#035035] mb-3">Neue Sammlung</h3>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full px-4 py-2 rounded-full border-2 border-white focus:border-[#035035] focus:outline-none transition-all mb-2"
                    disabled={saving}
                  />
                  <textarea
                    placeholder="Beschreibung (optional)"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 rounded-2xl border-2 border-white focus:border-[#035035] focus:outline-none transition-all resize-none mb-2"
                    disabled={saving}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCollectionName('');
                        setNewCollectionDescription('');
                      }}
                      className="flex-1 py-2 rounded-full border-2 border-[#2D2D2D]/20 text-[#2D2D2D] font-semibold hover:bg-white transition-all"
                      disabled={creatingCollection || saving}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleCreateCollection}
                      className="flex-1 py-2 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
                      disabled={!newCollectionName.trim() || creatingCollection || saving}
                    >
                      {creatingCollection ? 'Erstellen...' : 'Erstellen'}
                    </button>
                  </div>
                </div>
              )}

              {/* Collections List */}
              <div className="space-y-2">
                {filteredCollections.length === 0 ? (
                  <p className="text-center py-8 text-[#2D2D2D] opacity-60">
                    {searchQuery ? 'Keine Sammlungen gefunden' : 'Noch keine Sammlungen vorhanden'}
                  </p>
                ) : (
                  filteredCollections.map((collection) => {
                    const currentSelections = getCurrentSelections();
                    const isSelected = currentSelections.has(collection.id);

                    return (
                      <label
                        key={collection.id}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#F5F5F5] hover:border-[#035035] cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCollection(collection.id)}
                          disabled={saving}
                          className="w-5 h-5 rounded border-2 border-[#035035] text-[#035035] focus:ring-[#035035] cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-[#2D2D2D]">{collection.name}</p>
                          {collection.description && (
                            <p className="text-sm text-[#2D2D2D] opacity-60 line-clamp-1">{collection.description}</p>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-[#F5F5F5]">
          <div className="flex gap-3">
            {/* Previous Button */}
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={saving || loading}
                className="px-6 py-3 rounded-full border-2 border-[#035035] text-[#035035] font-semibold hover:bg-[#035035]/5 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Zurück</span>
              </button>
            )}

            {/* Next or Save Button */}
            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={saving || loading}
                className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:bg-[#024027] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Weiter</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:bg-[#024027] transition-colors disabled:opacity-50"
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
