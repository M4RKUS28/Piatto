import { Link } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CollectionImageCollage from '../../../components/CollectionImageCollage';
import CollectionCardMenu from '../../../components/CollectionCardMenu';

export default function CollectionsSection({
  collections,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection
}) {
  const { t } = useTranslation(["recipe", "common"]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#035035]">{t("library.collections", "Collections")}</h2>
        <button
          onClick={onCreateCollection}
          className="bg-[#FF9B7B] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>{t("library.newCollection", "New Collection")}</span>
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#F5F5F5] p-6 sm:p-8 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#2D2D2D] opacity-20" />
          <h3 className="text-lg sm:text-xl font-bold text-[#2D2D2D] mb-2">{t("library.noCollections", "No collections yet")}</h3>
          <p className="text-sm sm:text-base text-[#2D2D2D] opacity-60 mb-4">{t("library.noCollectionsDescription", "Create your first collection to organize recipes")}</p>
          <button
            onClick={onCreateCollection}
            className="bg-[#035035] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all min-h-[44px] w-full sm:w-auto"
          >
            {t("library.createNewCollection", "Create New Collection")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {collections.map((collection) => (
            <div key={collection.id} className="relative">
              <Link
                to={`/app/collection/${collection.id}`}
                className="block bg-white rounded-2xl border-2 border-[#035035]/30 overflow-hidden hover:shadow-lg hover:border-[#035035] hover:-translate-y-1 transition-all cursor-pointer"
              >
                {/* Image Collage */}
                <div className="bg-[#FFF8F0] h-32 sm:h-36 flex items-center justify-center overflow-hidden relative">
                  <CollectionImageCollage imageUrls={collection.preview_image_urls || []} />

                  {/* Menu Button - top right inside image */}
                  <div className="absolute top-2 right-2 z-10">
                    <CollectionCardMenu
                      collectionId={collection.id}
                      onEdit={onEditCollection}
                      onDelete={onDeleteCollection}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    <span className="text-[9px] font-semibold text-[#035035] bg-[#035035]/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      <FolderOpen className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                      {t("library.collectionLabel", "Collection")}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#2D2D2D] mb-1.5 line-clamp-2">{collection.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#2D2D2D] opacity-60 flex-wrap">
                    <span className="whitespace-nowrap">
                      {collection.recipe_count} {collection.recipe_count === 1 ? t("library.recipe", "Recipe") : t("library.recipes", "Recipes")}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
