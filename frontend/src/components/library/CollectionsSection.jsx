import { Link } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CollectionCardMenu from '../CollectionCardMenu';
import CollectionImageCollage from '../CollectionImageCollage';

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
        <h2 className="text-2xl sm:text-3xl font-bold text-[#035035] drop-shadow">{t("library.collections", "Collections")}</h2>
        <button
          onClick={onCreateCollection}
          className="bg-gradient-to-r from-[#FF9B7B] to-[#ff8a61] text-white px-5 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>{t("library.newCollection", "New Collection")}</span>
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/30 p-6 sm:p-8 text-center shadow-2xl">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg sm:text-xl font-bold text-[#2D2D2D] mb-2">{t("library.noCollections", "No collections yet")}</h3>
          <p className="text-sm sm:text-base text-[#2D2D2D]/70 mb-4">{t("library.noCollectionsDescription", "Create your first collection to organize recipes")}</p>
          <button
            onClick={onCreateCollection}
            className="bg-gradient-to-r from-[#035035] to-[#024030] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 hover:shadow-xl transition-all min-h-[44px] w-full sm:w-auto"
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
                className="block bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl hover:shadow-2xl hover:border-[#FF9B7B]/50 hover:-translate-y-1 transition-all cursor-pointer"
              >
                {/* Image Collage */}
                <div className="bg-[#FFF8F0] h-40 sm:h-44 flex items-center justify-center overflow-hidden relative">
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
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-[#035035] bg-[#035035]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <FolderOpen className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                      {t("library.collectionLabel", "Collection")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#2D2D2D] mb-2 line-clamp-2">{collection.name}</h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2D2D2D] opacity-60 flex-wrap">
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
