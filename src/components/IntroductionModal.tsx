import { useState, useEffect } from 'react';
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

  return (
    <div
      className={`
        fixed inset-0 z-[2000] flex items-center justify-center p-4
        transition-all duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 backdrop-blur-sm
          ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}
        `}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-md mx-auto
          rounded-3xl overflow-hidden
          shadow-2xl
          transition-all duration-300
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
          ${isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50'
            : 'bg-gradient-to-br from-white via-primary-50 to-white border border-gray-200/50'
          }
        `}
      >
        {/* Header with coffee pattern */}
        <div
          className={`
            relative px-6 pt-8 pb-6 text-center
            ${isDarkMode
              ? 'bg-gradient-to-r from-primary-900/50 via-primary-800/30 to-primary-900/50'
              : 'bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100'
            }
          `}
        >
          {/* Logo */}
          <div
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
          </div>

          <h1
            className={`
              text-xl sm:text-2xl font-bold mb-2
              ${isDarkMode ? 'text-white' : 'text-gray-900'}
            `}
          >
            {t.title}
          </h1>
          <p
            className={`
              text-sm
              ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
            `}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p
            className={`
              text-center text-sm mb-6
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            `}
          >
            {t.description}
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {t.features.map((feature, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-xl transition-all duration-200
                  hover:scale-105
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
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClose}
            className={`
              w-full py-3 px-6 rounded-xl
              font-semibold text-white
              bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600
              hover:from-primary-500 hover:via-primary-400 hover:to-primary-500
              shadow-lg hover:shadow-xl
              transform hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-2
            `}
          >
            {t.button}
            <Icon icon="mdi:arrow-right" className="w-5 h-5" />
          </button>

          {/* Credit */}
          <p
            className={`
              text-center text-xs mt-4
              ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}
            `}
          >
            {t.credit}
          </p>
        </div>
      </div>
    </div>
  );
}
