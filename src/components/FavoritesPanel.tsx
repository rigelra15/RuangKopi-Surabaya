import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { Cafe } from '../services/cafeService';
import { getFavorites, removeFavorite, type FavoriteCafe } from '../services/favoritesService';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCafe: (cafe: Cafe) => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
}

export default function FavoritesPanel({
  isOpen,
  onClose,
  onSelectCafe,
  isDarkMode,
  language,
}: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteCafe[]>([]);

  // Refresh favorites when panel opens
  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavorites());
    }
  }, [isOpen]);

  const handleRemoveFavorite = (cafeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(cafeId);
    setFavorites(getFavorites());
  };

  const handleSelectCafe = (cafe: FavoriteCafe) => {
    onSelectCafe(cafe);
    onClose();
  };

  const t = {
    id: {
      title: 'Cafe Favorit',
      empty: 'Belum ada cafe favorit',
      emptyHint: 'Ketuk ikon hati pada detail cafe untuk menambahkan ke favorit',
      addedOn: 'Ditambahkan',
    },
    en: {
      title: 'Favorite Cafes',
      empty: 'No favorite cafes yet',
      emptyHint: 'Tap the heart icon on cafe details to add to favorites',
      addedOn: 'Added on',
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
      scale: 0.9,
      opacity: 0,
    },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      scale: 0.95,
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: i * 0.05,
      }
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 z-[1005] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopPanelVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-[1006]
              /* Mobile: bottom sheet */
              bottom-0 left-0 right-0 max-h-[70vh]
              md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              md:w-[480px] md:max-h-[600px] md:rounded-2xl
              rounded-t-3xl
              ${isDarkMode
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-900'
              }
              shadow-2xl overflow-hidden flex flex-col
            `}
          >
            {/* Drag handle (mobile) */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>

            {/* Header */}
            <div className={`
              flex items-center justify-between px-5 py-4 border-b
              ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
            `}>
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="p-2 rounded-xl bg-red-500/10"
                >
                  <Icon icon="mdi:heart" className="w-5 h-5 text-red-500" />
                </motion.div>
                <h2 className="text-lg font-bold">{text.title}</h2>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  {favorites.length}
                </motion.span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`
                  p-2 rounded-full transition-colors
                  ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                  }
                `}
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {favorites.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="flex flex-col items-center justify-center py-12 px-6 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className={`
                      w-20 h-20 rounded-full mb-4 flex items-center justify-center
                      ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
                    `}
                  >
                    <Icon 
                      icon="mdi:heart-outline" 
                      className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} 
                    />
                  </motion.div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {text.empty}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {text.emptyHint}
                  </p>
                </motion.div>
              ) : (
                <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <AnimatePresence mode="popLayout">
                    {favorites.map((cafe, index) => (
                      <motion.div
                        key={cafe.id}
                        custom={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        whileHover={{ x: 4, backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                        onClick={() => handleSelectCafe(cafe)}
                        className={`
                          flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors
                        `}
                      >
                        {/* Coffee icon */}
                        <div className="p-2.5 rounded-xl bg-primary-500/10 flex-shrink-0">
                          <Icon icon="mdi:coffee" className="w-5 h-5 text-primary-500" />
                        </div>

                        {/* Cafe info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{cafe.name}</h3>
                          {cafe.address && (
                            <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {cafe.address}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {text.addedOn} {new Date(cafe.addedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                          </p>
                        </div>

                        {/* Remove button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleRemoveFavorite(cafe.id, e)}
                          className={`
                            p-2 rounded-full transition-colors flex-shrink-0
                            ${isDarkMode
                              ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                              : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                            }
                          `}
                          aria-label="Remove from favorites"
                        >
                          <Icon icon="mdi:delete-outline" className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom md:hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
