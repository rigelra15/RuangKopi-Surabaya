import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { Cafe } from '../services/cafeService';
import { isFavorite, toggleFavorite, formatDistance, calculateDistance } from '../services/favoritesService';

interface CafeDetailPanelProps {
  cafe: Cafe | null;
  onClose: () => void;
  isDarkMode: boolean;
  userLocation: [number, number] | null;
  language: 'id' | 'en';
  isOpen: boolean;
}

export default function CafeDetailPanel({
  cafe,
  onClose,
  isDarkMode,
  userLocation,
  language,
  isOpen,
}: CafeDetailPanelProps) {
  // Derive initial state from cafe prop
  const [isFav, setIsFav] = useState(() => cafe ? isFavorite(cafe.id) : false);
  
  // Update when cafe changes using a key pattern or direct check
  const currentFavStatus = cafe ? isFavorite(cafe.id) : false;
  if (cafe && isFav !== currentFavStatus) {
    setIsFav(currentFavStatus);
  }

  const handleToggleFavorite = () => {
    if (cafe) {
      const newState = toggleFavorite(cafe);
      setIsFav(newState);
    }
  };

  const handleGetDirections = () => {
    if (!cafe) return;
    // Open Google Maps directions
    const destination = `${cafe.lat},${cafe.lon}`;
    let url: string;
    
    if (userLocation) {
      const origin = `${userLocation[0]},${userLocation[1]}`;
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
    
    window.open(url, '_blank');
  };

  const distance = userLocation && cafe
    ? calculateDistance(userLocation[0], userLocation[1], cafe.lat, cafe.lon)
    : null;

  const t = {
    id: {
      directions: 'Rute',
      call: 'Telepon',
      website: 'Website',
      openingHours: 'Jam Buka',
      noAddress: 'Alamat tidak tersedia',
      fromYou: 'dari lokasi Anda',
    },
    en: {
      directions: 'Directions',
      call: 'Call',
      website: 'Website',
      openingHours: 'Opening Hours',
      noAddress: 'Address not available',
      fromYou: 'from you',
    },
  };

  const text = t[language];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelVariants = {
    hidden: { 
      y: '100%',
      opacity: 0,
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      y: '100%',
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const desktopPanelVariants = {
    hidden: { 
      x: 50,
      opacity: 0,
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      x: 50,
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.1 + i * 0.05,
      }
    }),
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && cafe && (
        <>
          {/* Backdrop - only on mobile */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/30 z-[1001] md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            variants={typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopPanelVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-[1002]
              /* Mobile: bottom sheet */
              bottom-0 left-0 right-0
              md:bottom-auto md:top-1/2 md:left-auto md:right-6 md:-translate-y-1/2
              md:w-96 md:rounded-2xl
              rounded-t-3xl
              ${isDarkMode
                ? 'bg-gray-900/95 text-white border-gray-700'
                : 'bg-white/95 text-gray-900 border-gray-200'
              }
              backdrop-blur-xl border shadow-2xl
              overflow-hidden
            `}
          >
            {/* Drag handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>

            {/* Header with close and favorite buttons */}
            <div className="flex items-start justify-between p-4 pb-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="flex-1 pr-12"
              >
                <h2 className="text-xl font-bold truncate">{cafe.name}</h2>
                {distance !== null && (
                  <p className="text-sm text-primary-500 font-medium mt-0.5 flex items-center gap-1">
                    <Icon icon="mdi:map-marker" className="w-4 h-4" />
                    {formatDistance(distance)} {text.fromYou}
                  </p>
                )}
              </motion.div>
              
              <div className="flex items-center gap-2 absolute top-4 right-4">
                {/* Favorite button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.15 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleFavorite}
                  className={`
                    p-2 rounded-full transition-colors
                    ${isFav
                      ? 'bg-red-500/20 text-red-500'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-400 hover:text-red-400' 
                        : 'bg-gray-100 text-gray-500 hover:text-red-500'
                    }
                  `}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <motion.div
                    animate={isFav ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon 
                      icon={isFav ? 'mdi:heart' : 'mdi:heart-outline'} 
                      className="w-5 h-5" 
                    />
                  </motion.div>
                </motion.button>
                
                {/* Close button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`
                    p-2 rounded-full transition-colors
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }
                  `}
                  aria-label="Close"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-4 space-y-3">
              {/* Address */}
              <motion.div 
                custom={0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <Icon icon="mdi:map-marker" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                <span>{cafe.address || text.noAddress}</span>
              </motion.div>

              {/* Opening hours */}
              {cafe.openingHours && (
                <motion.div 
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Icon icon="mdi:clock-outline" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                  <div>
                    <span className="font-medium">{text.openingHours}</span>
                    <br />
                    <span>{cafe.openingHours}</span>
                  </div>
                </motion.div>
              )}

              {/* Phone */}
              {cafe.phone && (
                <motion.div 
                  custom={2}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Icon icon="mdi:phone" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                  <a href={`tel:${cafe.phone}`} className="hover:text-primary-500 transition-colors">
                    {cafe.phone}
                  </a>
                </motion.div>
              )}

              {/* Cuisine/type */}
              {cafe.cuisine && (
                <motion.div 
                  custom={3}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Icon icon="mdi:coffee" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                  <span className="capitalize">{cafe.cuisine}</span>
                </motion.div>
              )}
            </div>

            {/* Action buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`
                grid grid-cols-2 gap-2 p-4 border-t
                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}
            >
              {/* Directions button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetDirections}
                className="
                  flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                  bg-primary-500 hover:bg-primary-600 text-white
                  font-medium transition-colors shadow-lg shadow-primary-500/25
                "
              >
                <Icon icon="mdi:directions" className="w-5 h-5" />
                {text.directions}
              </motion.button>

              {/* Website or call button */}
              {cafe.website ? (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={cafe.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    font-medium transition-colors
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                  `}
                >
                  <Icon icon="mdi:web" className="w-5 h-5" />
                  {text.website}
                </motion.a>
              ) : cafe.phone ? (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={`tel:${cafe.phone}`}
                  className={`
                    flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    font-medium transition-colors
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }
                  `}
                >
                  <Icon icon="mdi:phone" className="w-5 h-5" />
                  {text.call}
                </motion.a>
              ) : (
                <div className={`
                  flex items-center justify-center py-3 px-4 rounded-xl
                  ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'}
                `}>
                  <span className="text-sm">—</span>
                </div>
              )}
            </motion.div>

            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom md:hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
