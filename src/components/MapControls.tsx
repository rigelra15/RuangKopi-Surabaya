import { useState } from 'react';
import { Icon } from '@iconify/react';

interface MapControlsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onMyLocation: () => void;
  language: 'id' | 'en';
  onToggleLanguage: () => void;
  onOpenAbout: () => void;
  onOpenStats: () => void;
}

export default function MapControls({
  isDarkMode,
  onToggleDarkMode,
  onMyLocation,
  language,
  onToggleLanguage,
  onOpenAbout,
  onOpenStats,
}: MapControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Floating button style - all using primary mocha brown
  // Responsive: smaller on mobile
  const buttonBaseClass = `
    relative flex items-center justify-center
    w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl
    shadow-lg transition-all duration-300 ease-out
    hover:scale-110 active:scale-95
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    ${isDarkMode 
      ? 'bg-primary-600 hover:bg-primary-500' 
      : 'bg-primary-500 hover:bg-primary-400'
    }
    text-white
  `;

  const tooltipClass = `
    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
    px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
    transition-all duration-200
    ${isDarkMode 
      ? 'bg-gray-800 text-white' 
      : 'bg-gray-900 text-white'
    }
    hidden sm:block
  `;

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Stats Button */}
        <button
          className={buttonBaseClass}
          onClick={onOpenStats}
          onMouseEnter={() => setHoveredButton('stats')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={language === 'id' ? 'Statistik' : 'Statistics'}
        >
          <Icon icon="mdi:chart-box" className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {/* Tooltip */}
          {hoveredButton === 'stats' && (
            <div className={tooltipClass}>
              {language === 'id' ? 'Statistik' : 'Statistics'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </button>

        {/* Language Toggle Button */}
        <button
          className={buttonBaseClass}
          onClick={onToggleLanguage}
          onMouseEnter={() => setHoveredButton('language')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
        >
          <span className="text-sm sm:text-lg font-bold">
            {language === 'id' ? 'ID' : 'EN'}
          </span>
          
          {/* Tooltip */}
          {hoveredButton === 'language' && (
            <div className={tooltipClass}>
              {language === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </button>

        {/* My Location Button */}
        <button
          className={buttonBaseClass}
          onClick={onMyLocation}
          onMouseEnter={() => setHoveredButton('location')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={language === 'id' ? 'Lokasi Saya' : 'My Location'}
        >
          <Icon icon="mdi:crosshairs-gps" className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {/* Tooltip */}
          {hoveredButton === 'location' && (
            <div className={tooltipClass}>
              {language === 'id' ? 'Lokasi Saya' : 'My Location'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          className={buttonBaseClass}
          onClick={onToggleDarkMode}
          onMouseEnter={() => setHoveredButton('theme')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={isDarkMode 
            ? (language === 'id' ? 'Mode Terang' : 'Light Mode') 
            : (language === 'id' ? 'Mode Gelap' : 'Dark Mode')
          }
        >
          <Icon 
            icon={isDarkMode ? 'mdi:weather-sunny' : 'mdi:weather-night'} 
            className="w-5 h-5 sm:w-6 sm:h-6" 
          />
          
          {/* Tooltip */}
          {hoveredButton === 'theme' && (
            <div className={tooltipClass}>
              {isDarkMode 
                ? (language === 'id' ? 'Mode Terang' : 'Light Mode') 
                : (language === 'id' ? 'Mode Gelap' : 'Dark Mode')
              }
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </button>

        {/* About Button */}
        <button
          className={buttonBaseClass}
          onClick={onOpenAbout}
          onMouseEnter={() => setHoveredButton('about')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={language === 'id' ? 'Tentang' : 'About'}
        >
          <Icon icon="mdi:information-outline" className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {/* Tooltip */}
          {hoveredButton === 'about' && (
            <div className={tooltipClass}>
              {language === 'id' ? 'Tentang' : 'About'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
