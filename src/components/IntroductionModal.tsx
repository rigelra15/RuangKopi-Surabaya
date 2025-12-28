import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface IntroductionModalProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  onClose: () => void;
}

export default function IntroductionModal({
  isDarkMode,
  language,
  onClose,
}: IntroductionModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const content = {
    id: {
      title: 'Selamat Datang di RuangKopi Surabaya!',
      subtitle: 'Temukan Cafe Terbaik di Surabaya',
      description: 'Jelajahi ratusan cafe di Surabaya dengan peta interaktif kami. Temukan tempat ngopi favoritmu!',
      features: [
        { icon: 'mdi:map-marker-radius', title: 'Peta Interaktif', desc: 'Lihat lokasi cafe di seluruh Surabaya' },
        { icon: 'mdi:crosshairs-gps', title: 'Lokasi Anda', desc: 'Temukan cafe terdekat dari posisimu' },
        { icon: 'mdi:heart', title: 'Favorit', desc: 'Simpan cafe favoritmu untuk akses cepat' },
        { icon: 'mdi:magnify', title: 'Pencarian', desc: 'Cari cafe berdasarkan nama' },
      ],
      button: 'Mulai Jelajahi',
      credit: 'Dibuat oleh Rigel Ramadhani Waloni',
    },
    en: {
      title: 'Welcome to RuangKopi Surabaya!',
      subtitle: 'Find the Best Cafes in Surabaya',
      description: 'Explore hundreds of cafes in Surabaya with our interactive map. Find your favorite coffee spot!',
      features: [
        { icon: 'mdi:map-marker-radius', title: 'Interactive Map', desc: 'See cafe locations across Surabaya' },
        { icon: 'mdi:crosshairs-gps', title: 'Your Location', desc: 'Find the nearest cafes from your position' },
        { icon: 'mdi:heart', title: 'Favorites', desc: 'Save your favorite cafes for quick access' },
        { icon: 'mdi:magnify', title: 'Search', desc: 'Search cafes by name' },
      ],
      button: 'Start Exploring',
      credit: 'Created by Rigel Ramadhani Waloni',
    },
  };

  const t = content[language];

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
        type: 'spring' as const,
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
      transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
        delay: i * 0.1,
      }
    }),
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute inset-0 backdrop-blur-[1px]
              ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}
            `}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative w-full max-w-md mx-auto
              rounded-3xl overflow-hidden
              shadow-2xl
              ${isDarkMode
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50'
                : 'bg-gradient-to-br from-white via-primary-50 to-white border border-gray-200/50'
              }
            `}
          >
            {/* Header with coffee pattern */}
            <motion.div
              variants={itemVariants}
              className={`
                relative px-6 pt-8 pb-6 text-center
                ${isDarkMode
                  ? 'bg-gradient-to-r from-primary-900/50 via-primary-800/30 to-primary-900/50'
                  : 'bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100'
                }
              `}
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className={`
                  inline-flex items-center justify-center w-16 h-16 mb-4
                  rounded-2xl shadow-lg
                  ${isDarkMode
                    ? 'bg-primary-600'
                    : 'bg-primary-500'
                  }
                `}
              >
                <Icon icon="mdi:coffee" className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className={`
                  text-xl sm:text-2xl font-bold mb-2
                  ${isDarkMode ? 'text-white' : 'text-gray-900'}
                `}
              >
                {t.title}
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className={`
                  text-sm
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                {t.subtitle}
              </motion.p>
            </motion.div>

            {/* Content */}
            <div className="px-6 py-6">
              <motion.p
                variants={itemVariants}
                className={`
                  text-center text-sm mb-6
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {t.description}
              </motion.p>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {t.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={featureVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      p-3 rounded-xl cursor-default
                      ${isDarkMode
                        ? 'bg-gray-800/50 hover:bg-gray-700/50'
                        : 'bg-white hover:bg-gray-50 shadow-sm'
                      }
                    `}
                  >
                    <div className="mb-1">
                      <Icon 
                        icon={feature.icon} 
                        className={`w-6 h-6 ${isDarkMode ? 'text-primary-400' : 'text-primary-500'}`} 
                      />
                    </div>
                    <h3
                      className={`
                        text-xs font-semibold mb-0.5
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}
                      `}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`
                        text-xs
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}
                      `}
                    >
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className={`
                  w-full py-3 px-6 rounded-xl
                  font-semibold text-white
                  bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600
                  hover:from-primary-500 hover:via-primary-400 hover:to-primary-500
                  shadow-lg hover:shadow-xl
                  transition-colors duration-200
                  flex items-center justify-center gap-2
                `}
              >
                {t.button}
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  <Icon icon="mdi:arrow-right" className="w-5 h-5" />
                </motion.div>
              </motion.button>

              {/* Credit */}
              <motion.p
                variants={itemVariants}
                className={`
                  text-center text-xs mt-4
                  ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}
                `}
              >
                {t.credit}
              </motion.p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
