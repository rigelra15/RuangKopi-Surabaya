import { useState } from 'react';

interface MapControlsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onMyLocation: () => void;
  language: 'id' | 'en';
  onToggleLanguage: () => void;
}

export default function MapControls({
  isDarkMode,
  onToggleDarkMode,
  onMyLocation,
  language,
  onToggleLanguage,
}: MapControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Floating button style - all using primary mocha brown
  const buttonBaseClass = `
    relative flex items-center justify-center
    w-12 h-12 rounded-2xl
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
  `;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="flex items-center gap-3">
        {/* Language Toggle Button */}
        <button
          className={buttonBaseClass}
          onClick={onToggleLanguage}
          onMouseEnter={() => setHoveredButton('language')}
          onMouseLeave={() => setHoveredButton(null)}
          aria-label={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
        >
          <span className="text-lg font-bold">
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
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          
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
          {isDarkMode ? (
            // Sun icon for light mode
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
          ) : (
            // Moon icon for dark mode
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
              />
            </svg>
          )}
          
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
      </div>
    </div>
  );
}
