import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { deleteRecipe } from '../api/recipeApi';

/**
 * DeleteRecipeModal component shows a confirmation dialog before deleting a recipe
 * Permanently deletes the recipe from the database
 */
export default function DeleteRecipeModal({ recipe, isOpen, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteRecipe(recipe.id);
      onDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      setError('Löschen fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#F5F5F5] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-red-600">Rezept löschen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
            disabled={deleting}
          >
            <X className="w-5 h-5 text-[#2D2D2D]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#2D2D2D] mb-2">
                Möchtest du das Rezept "{recipe?.name || recipe?.title}" wirklich löschen?
              </h3>
              <p className="text-sm text-[#2D2D2D] opacity-60 mb-2">
                Diese Aktion kann nicht rückgängig gemacht werden. Das Rezept wird dauerhaft aus allen Sammlungen entfernt.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F5F5F5] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-full border-2 border-[#2D2D2D]/20 text-[#2D2D2D] font-semibold hover:bg-[#F5F5F5] transition-all"
            disabled={deleting}
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
            disabled={deleting}
          >
            {deleting ? 'Löschen...' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}
