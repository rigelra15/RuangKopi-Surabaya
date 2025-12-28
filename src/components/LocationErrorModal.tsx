import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

interface LocationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorType: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown';
  language?: 'id' | 'en';
}

const translations = {
  id: {
    permission_denied: {
      title: 'Akses Lokasi Ditolak',
      description: 'Kamu telah menolak akses ke lokasimu. Untuk menggunakan fitur berbasis lokasi seperti jarak cafe terdekat, izinkan akses lokasi di pengaturan browser.',
      steps: [
        'Klik ikon gembok/info di sebelah kiri address bar',
        'Cari pengaturan "Location" atau "Lokasi"',
        'Pilih "Allow" atau "Izinkan"',
        'Refresh halaman ini'
      ]
    },
    position_unavailable: {
      title: 'Lokasi Tidak Tersedia',
      description: 'Perangkatmu tidak dapat menentukan lokasi saat ini. Pastikan GPS aktif atau kamu berada di area dengan sinyal yang baik.',
      steps: [
        'Pastikan GPS/Location Service aktif',
        'Coba pindah ke area dengan sinyal lebih baik',
        'Coba gunakan WiFi untuk lokasi lebih akurat',
        'Coba lagi dalam beberapa saat'
      ]
    },
    timeout: {
      title: 'Waktu Habis',
      description: 'Permintaan lokasi memakan waktu terlalu lama. Ini bisa terjadi jika sinyal GPS lemah atau koneksi internet lambat.',
      steps: [
        'Pastikan GPS aktif dan tidak terhalang',
        'Coba pindah ke area terbuka',
        'Periksa koneksi internet',
        'Coba lagi'
      ]
    },
    unknown: {
      title: 'Terjadi Kesalahan',
      description: 'Terjadi kesalahan saat mencoba mengakses lokasimu. Coba lagi atau gunakan fitur lain.',
      steps: [
        'Refresh halaman',
        'Coba lagi dalam beberapa saat',
        'Periksa pengaturan lokasi browser'
      ]
    },
    retry: 'Coba Lagi',
    close: 'Tutup',
    dontShowAgain: 'Jangan tampilkan lagi',
    continueWithout: 'Lanjutkan Tanpa Lokasi',
    howToEnable: 'Cara Mengaktifkan:'
  },
  en: {
    permission_denied: {
      title: 'Location Access Denied',
      description: 'You have denied access to your location. To use location-based features like nearby cafes, please allow location access in your browser settings.',
      steps: [
        'Click the lock/info icon next to the address bar',
        'Find the "Location" setting',
        'Select "Allow"',
        'Refresh this page'
      ]
    },
    position_unavailable: {
      title: 'Location Unavailable',
      description: 'Your device cannot determine your current location. Make sure GPS is enabled or you are in an area with good signal.',
      steps: [
        'Make sure GPS/Location Service is enabled',
        'Try moving to an area with better signal',
        'Try using WiFi for more accurate location',
        'Try again in a moment'
      ]
    },
    timeout: {
      title: 'Request Timed Out',
      description: 'The location request took too long. This can happen if GPS signal is weak or internet connection is slow.',
      steps: [
        'Make sure GPS is on and unobstructed',
        'Try moving to an open area',
        'Check your internet connection',
        'Try again'
      ]
    },
    unknown: {
      title: 'An Error Occurred',
      description: 'An error occurred while trying to access your location. Please try again or use other features.',
      steps: [
        'Refresh the page',
        'Try again in a moment',
        'Check browser location settings'
      ]
    },
    retry: 'Try Again',
    close: 'Close',
    dontShowAgain: "Don't show again",
    continueWithout: 'Continue Without Location',
    howToEnable: 'How to Enable:'
  }
};

const errorIcons: Record<string, string> = {
  permission_denied: 'mdi:map-marker-off',
  position_unavailable: 'mdi:crosshairs-question',
  timeout: 'mdi:timer-sand-empty',
  unknown: 'mdi:alert-circle'
};

export default function LocationErrorModal({
  isOpen,
  onClose,
  onRetry,
  errorType,
  language = 'id'
}: LocationErrorModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const t = translations[language];
  const errorInfo = t[errorType];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Modal variants for desktop
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  // Bottomsheet variants for mobile
  const bottomsheetVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' }
  };

  const contentJSX = (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          errorType === 'permission_denied' 
            ? 'bg-red-500/20' 
            : errorType === 'timeout'
            ? 'bg-amber-500/20'
            : 'bg-orange-500/20'
        }`}>
          <Icon 
            icon={errorIcons[errorType]} 
            className={`w-7 h-7 ${
              errorType === 'permission_denied'
                ? 'text-red-400'
                : errorType === 'timeout'
                ? 'text-amber-400'
                : 'text-orange-400'
            }`} 
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-1">
            {errorInfo.title}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {errorInfo.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Steps */}
      {errorType === 'permission_denied' && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Icon icon="mdi:information" className="w-4 h-4 text-primary-400" />
            {t.howToEnable}
          </p>
          <ol className="space-y-2">
            {errorInfo.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="w-5 h-5 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Preview image for permission denied */}
      {errorType === 'permission_denied' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
              <Icon icon="mdi:lock" className="w-4 h-4" />
              <span className="text-xs">ruangkopisby.vercel.app</span>
            </div>
            <Icon icon="mdi:arrow-right" className="w-4 h-4" />
            <div className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg text-xs">
              Location: Allow
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-400 hover:to-primary-500 transition-all"
        >
          <Icon icon="mdi:refresh" className="w-5 h-5" />
          <span>{t.retry}</span>
        </button>
        <button
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-all"
        >
          <Icon icon="mdi:map-marker-off" className="w-5 h-5" />
          <span>{t.continueWithout}</span>
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Modal/Bottomsheet */}
          {isMobile ? (
            // Mobile: Bottomsheet
            <motion.div
              variants={bottomsheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 pb-8 z-[201] max-h-[85vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6" />
              {contentJSX}
            </motion.div>
          ) : (
            // Desktop: Centered Modal
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-2xl p-6 z-[201] w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {contentJSX}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
