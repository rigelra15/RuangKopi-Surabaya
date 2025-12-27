import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface LocationPermissionModalProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  onLocationGranted: (position: [number, number]) => void;
  onLocationDenied?: () => void;
}

export default function LocationPermissionModal({
  isDarkMode,
  language,
  onLocationGranted,
  onLocationDenied,
}: LocationPermissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const t = {
    id: {
      title: 'Izinkan Akses Lokasi',
      subtitle: 'Untuk pengalaman terbaik',
      description: 'Izinkan RuangKopi mengakses lokasi Anda untuk menampilkan cafe terdekat dan menghitung jarak.',
      benefits: [
        'Temukan cafe terdekat dari posisi Anda',
        'Lihat jarak ke setiap cafe',
        'Dapatkan petunjuk arah dengan mudah',
      ],
      privacy: 'Lokasi Anda hanya digunakan secara lokal dan tidak akan disimpan.',
      allow: 'Izinkan Lokasi',
      later: 'Nanti Saja',
      requesting: 'Meminta izin...',
    },
    en: {
      title: 'Allow Location Access',
      subtitle: 'For the best experience',
      description: 'Allow RuangKopi to access your location to show nearby cafes and calculate distances.',
      benefits: [
        'Find cafes nearest to your position',
        'See distance to each cafe',
        'Get directions easily',
      ],
      privacy: 'Your location is only used locally and will not be stored.',
      allow: 'Allow Location',
      later: 'Maybe Later',
      requesting: 'Requesting permission...',
    },
  };

  const text = t[language];

  const requestLocation = () => {
    setIsRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        onLocationGranted(coords);
        setIsOpen(false);
        setIsRequesting(false);
      },
      (error) => {
        console.error('Location error:', error);
        setIsRequesting(false);
        setIsOpen(false);
        onLocationDenied?.();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Check if already has permission or denied
  useEffect(() => {
    const checkPermission = async () => {
      // Check if already dismissed this session
      const dismissed = sessionStorage.getItem('location_permission_dismissed');
      if (dismissed === 'true') {
        setHasChecked(true);
        return;
      }

      // Check if geolocation is available
      if (!navigator.geolocation) {
        setHasChecked(true);
        return;
      }

      // Check permission status
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          
          if (status.state === 'granted') {
            // Already granted, get location immediately
            setHasChecked(true);
            requestLocation();
          } else if (status.state === 'prompt') {
            // Need to ask user
            setIsOpen(true);
            setHasChecked(true);
          } else {
            // Denied
            setHasChecked(true);
            onLocationDenied?.();
          }
        } catch {
          // Fallback: show modal
          setIsOpen(true);
          setHasChecked(true);
        }
      } else {
        // Fallback: show modal
        setIsOpen(true);
        setHasChecked(true);
      }
    };

    // Small delay to let the page load first
    const timer = setTimeout(checkPermission, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAllow = () => {
    requestLocation();
  };

  const handleLater = () => {
    sessionStorage.setItem('location_permission_dismissed', 'true');
    setIsOpen(false);
    onLocationDenied?.();
  };

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
      y: 50,
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2 }
    },
  };

  if (!hasChecked) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center p-4">
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
            onClick={handleLater}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative w-full max-w-sm rounded-t-3xl md:rounded-2xl overflow-hidden
              ${isDarkMode
                ? 'bg-gray-900 border border-gray-800'
                : 'bg-white border border-gray-100'
              }
              shadow-2xl
            `}
          >
            {/* Drag handle for mobile */}
            <div className="md:hidden flex justify-center pt-3">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>

            {/* Header with icon */}
            <div className="px-6 pt-6 pb-4 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className={`
                  inline-flex items-center justify-center w-20 h-20 rounded-full mb-4
                  ${isDarkMode 
                    ? 'bg-gradient-to-br from-primary-500/30 to-primary-600/20' 
                    : 'bg-gradient-to-br from-primary-100 to-primary-200'
                  }
                `}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: 'easeInOut'
                  }}
                >
                  <Icon
                    icon="mdi:map-marker-radius"
                    className={`w-10 h-10 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                  />
                </motion.div>
              </motion.div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {text.title}
              </h2>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {text.subtitle}
              </p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {text.description}
              </p>
            </div>

            {/* Benefits list */}
            <div className={`mx-6 mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <ul className="space-y-3">
                {text.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                      ${isDarkMode ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'}
                    `}>
                      <Icon icon="mdi:check" className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {benefit}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Privacy note */}
            <div className={`mx-6 mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`flex items-start gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Icon icon="mdi:shield-lock-outline" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {text.privacy}
              </p>
            </div>

            {/* Action buttons */}
            <div className="px-6 pb-6 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAllow}
                disabled={isRequesting}
                className={`
                  w-full py-3.5 px-4 rounded-xl
                  bg-primary-500 hover:bg-primary-600 text-white
                  font-semibold transition-colors
                  shadow-lg shadow-primary-500/25
                  flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isRequesting ? (
                  <>
                    <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                    {text.requesting}
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    >
                      <Icon icon="mdi:crosshairs-gps" className="w-5 h-5" />
                    </motion.div>
                    {text.allow}
                  </>
                )}
              </motion.button>
              <button
                onClick={handleLater}
                disabled={isRequesting}
                className={`
                  w-full py-3 px-4 rounded-xl font-medium transition-colors
                  ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                  disabled:opacity-50
                `}
              >
                {text.later}
              </button>
            </div>

            {/* Safe area for mobile */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
