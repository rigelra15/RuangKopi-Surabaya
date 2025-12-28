import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getMediumUrl, getOriginalUrl } from '../services/imageService';

interface PhotoGalleryProps {
  photos: string[];
  cafeName: string;
}

export default function PhotoGallery({ photos, cafeName }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsLoading(true);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsLoading(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  return (
    <>
      {/* Photo Grid - Landscape layout */}
      <div className={`
        ${photos.length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'}
      `}>
        {photos.slice(0, 4).map((photo, index) => (
          <motion.button
            key={photo}
            onClick={() => {
              setSelectedIndex(index);
              setIsLoading(true);
            }}
            className={`
              relative rounded-xl overflow-hidden bg-gray-800 cursor-pointer
              ${photos.length === 1 ? 'aspect-[32/9]' : ''}
              ${photos.length === 2 ? 'aspect-[32/9]' : ''}
              ${photos.length >= 3 && index === 0 ? 'col-span-2 aspect-[32/9]' : ''}
              ${photos.length >= 3 && index > 0 ? 'aspect-square' : ''}
            `}
          >
            <img
              src={getMediumUrl(photo)}
              alt={`${cafeName} - Foto ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* More photos overlay */}
            {index === 3 && photos.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  +{photos.length - 4}
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>

            {/* Navigation buttons */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <Icon icon="mdi:chevron-left" className="w-8 h-8" />
              </button>
            )}

            {selectedIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <Icon icon="mdi:chevron-right" className="w-8 h-8" />
              </button>
            )}

            {/* Image container */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon icon="mdi:loading" className="w-12 h-12 text-white animate-spin" />
                </div>
              )}

              <img
                src={getOriginalUrl(photos[selectedIndex])}
                alt={`${cafeName} - Foto ${selectedIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onLoad={() => setIsLoading(false)}
              />
            </motion.div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 text-white rounded-full text-sm backdrop-blur-[1px]">
              {selectedIndex + 1} / {photos.length}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-xl backdrop-blur-[1px] max-w-[80vw] overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={photo}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                      setIsLoading(true);
                    }}
                    className={`
                      w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden transition-all
                      ${index === selectedIndex 
                        ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-black' 
                        : 'opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    <img
                      src={getMediumUrl(photo)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
