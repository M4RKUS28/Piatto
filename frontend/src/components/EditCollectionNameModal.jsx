import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateCollection } from '../api/collectionApi';
import { useTranslation } from 'react-i18next';

/**
 * EditCollectionNameModal component allows users to edit collection name and description
 */
export default function EditCollectionNameModal({ collection, isOpen, onClose, onUpdated }) {
  const { t } = useTranslation('collection');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setError(null);
    }
  }, [isOpen, collection]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('editModal.errorEmpty', 'Name cannot be empty'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim(),
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update collection:', err);
      setError(t('editModal.errorSave', 'Save failed. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#F5F5F5] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#035035]">{t('editModal.title', 'Edit Collection')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-[#2D2D2D]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                {t('editModal.nameLabel', 'Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-full border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all"
                placeholder={t('editModal.namePlaceholder', 'Collection name')}
                disabled={saving}
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                {t('editModal.descriptionLabel', 'Description (optional)')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#F5F5F5] focus:border-[#035035] focus:outline-none transition-all resize-none"
                placeholder={t('editModal.descriptionPlaceholder', 'Describe your collection...')}
                disabled={saving}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F5F5F5] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-full border-2 border-[#2D2D2D]/20 text-[#2D2D2D] font-semibold hover:bg-[#F5F5F5] transition-all"
            disabled={saving}
          >
            {t('editModal.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 rounded-full bg-[#035035] text-white font-semibold hover:scale-105 transition-all disabled:opacity-50"
            disabled={saving || !name.trim()}
          >
            {saving ? t('editModal.saving', 'Saving...') : t('editModal.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
