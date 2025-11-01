import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { deleteCollection } from '../api/collectionApi';
import { useTranslation } from 'react-i18next';

/**
 * DeleteCollectionModal component shows a confirmation dialog before deleting a collection
 * Deletes the collection and the n:m relations to recipes, but not the recipes themselves
 */
export default function DeleteCollectionModal({ collection, isOpen, onClose, onDeleted }) {
  const { t } = useTranslation('collection');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteCollection(collection.id);
      onDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError(t('deleteModal.error', 'Delete failed. Please try again.'));
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
          <h2 className="text-2xl font-bold text-red-600">{t('deleteModal.title', 'Delete Collection')}</h2>
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
                {t('deleteModal.message', {
                  name: collection?.name ?? '',
                  defaultValue: `Do you really want to delete the collection "${collection?.name ?? ''}"?`,
                })}
              </h3>
              <p className="text-sm text-[#2D2D2D] opacity-60 mb-2">
                {t('deleteModal.warning', 'This action cannot be undone. The collection will be deleted, but the recipes within it will remain.')}
              </p>
              {collection?.recipe_count > 0 && (
                <p className="text-sm text-[#035035] font-semibold">
                  {collection.recipe_count}{' '}
                  {collection.recipe_count === 1
                    ? t('deleteModal.recipeCount.singular', 'Recipe')
                    : t('deleteModal.recipeCount.plural', 'Recipes')}{' '}
                  {t('deleteModal.recipeCount.inCollection', 'in this collection')}
                </p>
              )}
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
            {t('deleteModal.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
            disabled={deleting}
          >
            {deleting ? t('deleteModal.deleting', 'Deleting...') : t('deleteModal.delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
