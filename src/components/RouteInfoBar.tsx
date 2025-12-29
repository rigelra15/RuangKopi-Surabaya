import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface RouteInfoBarProps {
  isVisible: boolean;
  cafeName: string;
  distance: number; // in km
  duration: number; // in minutes
  onClose: () => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
}

export default function RouteInfoBar({
  isVisible,
  cafeName,
  distance,
  duration,
  onClose,
  isDarkMode,
  language,
}: RouteInfoBarProps) {
  const text = {
    id: {
      yourLocation: 'Lokasi Anda',
      to: 'ke',
      distance: 'Jarak',
      estimate: 'Perkiraan',
    },
    en: {
      yourLocation: 'Your Location',
      to: 'to',
      distance: 'Distance',
      estimate: 'Estimate',
    },
  };

  const t = text[language];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed bottom-24 left-4 right-4 z-[1001]
            md:left-auto md:right-4 md:w-96
            rounded-2xl shadow-xl overflow-hidden
            ${isDarkMode 
              ? 'bg-gray-900/95 border border-gray-700' 
              : 'bg-white/95 border border-gray-200'
            }
            backdrop-blur-md
          `}
        >
          {/* Main content */}
          <div className="p-4">
            {/* Route info */}
            <div className="flex items-center gap-3">
              {/* From - User Location */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.yourLocation}
                  </span>
                </div>
                <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'id' ? 'Posisi Saat Ini' : 'Current Position'}
                </p>
              </div>

              {/* Arrow */}
              <div className={`flex-shrink-0 ${isDarkMode ? 'text-primary-400' : 'text-primary-500'}`}>
                <Icon icon="mdi:arrow-right" className="w-6 h-6" />
              </div>

              {/* To - Cafe */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0" />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'id' ? 'Tujuan' : 'Destination'}
                  </span>
                </div>
                <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {cafeName}
                </p>
              </div>
            </div>

            {/* Distance and Duration */}
            <div className={`
              flex items-center justify-center gap-6 mt-3 pt-3 border-t
              ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
            `}>
              <div className="text-center">
                <p className="text-lg font-bold text-primary-500">
                  {distance.toFixed(1)} km
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.distance}
                </p>
              </div>
              <div className={`w-px h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className="text-center">
                <p className="text-lg font-bold text-primary-500">
                  {Math.round(duration)} min
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.estimate}
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={`
              w-full py-3 flex items-center justify-center gap-2
              text-sm font-medium transition-colors
              ${isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }
            `}
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
            {language === 'id' ? 'Tutup Rute' : 'Close Route'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
