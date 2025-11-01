import { getImageUrl } from '../utils/imageUtils';
import { useTranslation } from 'react-i18next';

export default function CollectionImageCollage({ imageUrls = [] }) {
  const { t } = useTranslation('collection');
  // Ensure we have at most 4 images
  const images = imageUrls.slice(0, 4).map(url => getImageUrl(url));
  const count = images.length;

  // If no images, show a default folder icon
  if (count === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#035035]/10 to-[#035035]/5 flex items-center justify-center rounded-xl">
        <span className="text-6xl opacity-20">📁</span>
      </div>
    );
  }

  // Layout: 1 image - single centered image
  if (count === 1) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden border-4 border-white shadow-sm">
        <img
          src={images[0]}
          alt={t('collage.singleAlt', 'Collection preview')}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Layout: 2 images - side by side
  if (count === 2) {
    return (
      <div className="w-full h-full flex gap-1 rounded-xl overflow-hidden">
        {images.map((img, idx) => (
          <div key={idx} className="flex-1 border-2 border-white shadow-sm overflow-hidden">
            <img
              src={img}
              alt={t('collage.altIndexed', { index: idx + 1, defaultValue: `Collection preview ${idx + 1}` })}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // Layout: 3 images - first image takes full first row, other 2 share second row
  if (count === 3) {
    return (
      <div className="w-full h-full flex flex-col gap-1 rounded-xl overflow-hidden">
        <div className="h-1/2 border-2 border-white shadow-sm overflow-hidden">
          <img
            src={images[0]}
            alt={t('collage.altIndexed', { index: 1, defaultValue: 'Collection preview 1' })}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="h-1/2 flex gap-1">
          {images.slice(1).map((img, idx) => (
            <div key={idx} className="flex-1 border-2 border-white shadow-sm overflow-hidden">
              <img
                src={img}
                alt={t('collage.altIndexed', { index: idx + 2, defaultValue: `Collection preview ${idx + 2}` })}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Layout: 4 images - 2x2 grid
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden">
      {images.map((img, idx) => (
        <div key={idx} className="border-2 border-white shadow-sm overflow-hidden">
          <img
            src={img}
            alt={t('collage.altIndexed', { index: idx + 1, defaultValue: `Collection preview ${idx + 1}` })}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
