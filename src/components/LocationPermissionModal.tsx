import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
}

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onRequestLocation,
  isDarkMode,
  language,
}: LocationPermissionModalProps) {

  const handleEnableLocation = () => {
    onClose();
    onRequestLocation();
  };

  const t = {
    id: {
      title: 'Izinkan Akses Lokasi',
      description: 'Untuk menggunakan fitur filter jarak, kami membutuhkan akses ke lokasi Anda.',
      benefits: [
        'Filter cafe berdasarkan jarak dari Anda',
        'Lihat jarak ke setiap cafe',
        'Dapatkan rute navigasi yang akurat',
      ],
      privacy: 'Lokasi Anda hanya digunakan secara lokal dan tidak akan disimpan.',
      enableButton: 'Aktifkan Lokasi',
      laterButton: 'Nanti Saja',
    },
    en: {
      title: 'Allow Location Access',
      description: 'To use the distance filter feature, we need access to your location.',
      benefits: [
        'Filter cafes by distance from you',
        'See distance to each cafe',
        'Get accurate navigation routes',
      ],
      privacy: 'Your location is only used locally and will not be stored.',
      enableButton: 'Enable Location',
      laterButton: 'Maybe Later',
    },
  };

  const content = t[language];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 10,
      transition: { duration: 0.2 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    },
  };

  const benefitVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: 0.2 + i * 0.1,
      }
    }),
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute inset-0 backdrop-blur-sm
              ${isDarkMode ? 'bg-black/70' : 'bg-black/50'}
            `}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative w-full max-w-sm rounded-2xl overflow-hidden
              ${isDarkMode
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-100'
              }
              shadow-2xl
            `}
          >
            {/* Header with icon */}
            <div className="px-6 pt-6 pb-4 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className={`
                  inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                  ${isDarkMode ? 'bg-primary-600/20' : 'bg-primary-50'}
                `}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: 'easeInOut'
                  }}
                >
                  <Icon
                    icon="mdi:map-marker-radius"
                    className={`w-8 h-8 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                  />
                </motion.div>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className={`
                  text-xl font-bold
                  ${isDarkMode ? 'text-white' : 'text-gray-900'}
                `}
              >
                {content.title}
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className={`
                  mt-2 text-sm
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {content.description}
              </motion.p>
            </div>

            {/* Benefits list */}
            <div className="px-6 pb-4">
              <ul className="space-y-2">
                {content.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    custom={index}
                    variants={benefitVariants}
                    initial="hidden"
                    animate="visible"
                    className={`
                      flex items-center gap-2 text-sm
                      ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                    `}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 300 }}
                    >
                      <Icon icon="mdi:check-circle" className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    </motion.div>
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Privacy note */}
            <motion.div 
              variants={itemVariants}
              className={`mx-6 mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
            >
              <p className={`flex items-start gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Icon icon="mdi:shield-lock-outline" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {content.privacy}
              </p>
            </motion.div>

            {/* Action buttons */}
            <div className="px-6 pb-6 space-y-2">
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnableLocation}
                className="
                  w-full py-3 px-4 rounded-xl
                  bg-primary-500 hover:bg-primary-600 text-white
                  font-semibold transition-colors
                  shadow-lg shadow-primary-500/25
                  flex items-center justify-center gap-2
                "
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                >
                  <Icon icon="mdi:crosshairs-gps" className="w-5 h-5" />
                </motion.div>
                {content.enableButton}
              </motion.button>
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`
                  w-full py-3 px-4 rounded-xl font-medium transition-colors
                  ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                `}
              >
                {content.laterButton}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
