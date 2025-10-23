import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { getUserCollections, getCollectionsForRecipe, updateCollectionRecipes, createCollection } from '../api/collectionApi';
import { deleteRecipe } from '../api/recipeApi';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * EditCollectionsModal component allows users to:
 * - View all collections
 * - Select/deselect collections for the current recipe
 * - Create new collections
 * - Delete the recipe if no collections are selected
 */
export default function EditCollectionsModal({ recipeId, isOpen, onClose, onRecipeDeleted }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState(new Set());
  const [initialCollectionIds, setInitialCollectionIds] = useState(new Set());
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
      fetchData();
    }
  }, [isOpen, recipeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all collections and collections for this recipe
      const [allCollections, recipeCollections] = await Promise.all([
        getUserCollections(),
        getCollectionsForRecipe(recipeId),
      ]);

      setCollections(allCollections);

      // Set selected collection IDs
      const recipeCollectionIds = new Set(recipeCollections.map(c => c.id));
      setSelectedCollectionIds(recipeCollectionIds);
      setInitialCollectionIds(recipeCollectionIds);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Fehler beim Laden der Sammlungen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = (collectionId) => {
    const newSelected = new Set(selectedCollectionIds);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollectionIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update each collection that changed
      const collectionsToUpdate = new Map();

      // Find collections to add recipe to
      for (const collectionId of selectedCollectionIds) {
        if (!initialCollectionIds.has(collectionId)) {
          // Need to add recipe to this collection
          const collection = collections.find(c => c.id === collectionId);
          if (collection) {
            if (!collectionsToUpdate.has(collectionId)) {
              collectionsToUpdate.set(collectionId, new Set(collection.recipe_ids || []));
            }
            collectionsToUpdate.get(collectionId).add(recipeId);
          }
        }
      }

      // Find collections to remove recipe from
      for (const collectionId of initialCollectionIds) {
        if (!selectedCollectionIds.has(collectionId)) {
          // Need to remove recipe from this collection
          const collection = collections.find(c => c.id === collectionId);
          if (collection) {
            if (!collectionsToUpdate.has(collectionId)) {
              collectionsToUpdate.set(collectionId, new Set(collection.recipe_ids || []));
            }
            collectionsToUpdate.get(collectionId).delete(recipeId);
          }
        }
      }

      // Execute updates
      const updatePromises = Array.from(collectionsToUpdate.entries()).map(([collectionId, recipeIds]) =>
        updateCollectionRecipes(collectionId, Array.from(recipeIds))
      );

      await Promise.all(updatePromises);

      onClose();
    } catch (err) {
      console.error('Failed to save collections:', err);
      setError('Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Möchtest du dieses Rezept wirklich löschen?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteRecipe(recipeId);
      onRecipeDeleted();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      setError('Löschen fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreatingCollection(true);
    try {
      const newCollection = await createCollection({
        name: newCollectionName,
        description: newCollectionDescription,
      });

      // Add new collection to list and select it
      setCollections([...collections, { ...newCollection, recipe_count: 0 }]);
      setSelectedCollectionIds(new Set([...selectedCollectionIds, newCollection.id]));

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

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#F5F5F5] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#035035]">Sammlung bearbeiten</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-[#2D2D2D]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : error && !saving ? (
            <ErrorMessage message={error} onRetry={fetchData} />
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
                />
              </div>

              {/* Create Collection Button */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full mb-4 py-3 rounded-full border-2 border-dashed border-[#035035] text-[#035035] font-semibold hover:bg-[#035035]/5 transition-all flex items-center justify-center gap-2"
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
                  />
                  <textarea
                    placeholder="Beschreibung (optional)"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 rounded-2xl border-2 border-white focus:border-[#035035] focus:outline-none transition-all resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCollectionName('');
                        setNewCollectionDescription('');
                      }}
                      className="flex-1 py-2 rounded-full border-2 border-[#2D2D2D]/20 text-[#2D2D2D] font-semibold hover:bg-white transition-all"
                      disabled={creatingCollection}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleCreateCollection}
                      className="flex-1 py-2 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
                      disabled={!newCollectionName.trim() || creatingCollection}
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
                    {searchQuery ? 'Keine Sammlungen gefunden' : 'Noch keine Sammlungen'}
                  </p>
                ) : (
                  filteredCollections.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-[#F5F5F5] hover:border-[#035035] cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollectionIds.has(collection.id)}
                        onChange={() => handleToggleCollection(collection.id)}
                        className="w-5 h-5 rounded border-2 border-[#035035] text-[#035035] focus:ring-[#035035] cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-[#2D2D2D]">{collection.name}</p>
                        {collection.description && (
                          <p className="text-sm text-[#2D2D2D] opacity-60 line-clamp-1">{collection.description}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Error Message (during save) */}
              {error && saving && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F5F5F5] flex gap-3">
          {selectedCollectionIds.size === 0 ? (
            <button
              onClick={handleDelete}
              className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={saving || loading}
            >
              <Trash2 className="w-5 h-5" />
              <span>{saving ? 'Löschen...' : 'Löschen'}</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
              disabled={saving || loading}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
