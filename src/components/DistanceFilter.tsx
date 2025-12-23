import { useState } from 'react';

interface DistanceFilterProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  currentDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}

const DISTANCE_OPTIONS = [
  { value: null, labelId: 'Semua', labelEn: 'All' },
  { value: 0.5, labelId: '500 m', labelEn: '500 m' },
  { value: 1, labelId: '1 km', labelEn: '1 km' },
  { value: 2, labelId: '2 km', labelEn: '2 km' },
  { value: 5, labelId: '5 km', labelEn: '5 km' },
  { value: 10, labelId: '10 km', labelEn: '10 km' },
];

export default function DistanceFilter({
  isDarkMode,
  language,
  currentDistance,
  onDistanceChange,
  disabled = false,
  onDisabledClick,
}: DistanceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = DISTANCE_OPTIONS.find(opt => opt.value === currentDistance) || DISTANCE_OPTIONS[0];
  const currentLabel = language === 'id' ? currentOption.labelId : currentOption.labelEn;

  const t = {
    id: {
      filterDistance: 'Filter Jarak',
      needLocation: 'Aktifkan lokasi untuk filter jarak',
    },
    en: {
      filterDistance: 'Filter Distance',
      needLocation: 'Enable location for distance filter',
    },
  };

  const text = t[language];

  const handleClick = () => {
    if (disabled) {
      onDisabledClick?.();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-xl
          text-sm font-medium transition-all
          ${disabled
            ? isDarkMode
              ? 'bg-gray-800/50 text-gray-500 cursor-pointer'
              : 'bg-gray-100/50 text-gray-400 cursor-pointer'
            : currentDistance !== null
              ? isDarkMode
                ? 'bg-primary-600 hover:bg-primary-500 text-white'
                : 'bg-primary-500 hover:bg-primary-400 text-white'
              : isDarkMode
                ? 'bg-gray-800/90 hover:bg-gray-700 text-white'
                : 'bg-white/90 hover:bg-white text-gray-800'
          }
          backdrop-blur-xl shadow-lg border
          ${currentDistance !== null 
            ? 'border-primary-400'
            : isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }
        `}
        title={disabled ? text.needLocation : text.filterDistance}
      >
        {/* Active indicator dot for mobile */}
        {currentDistance !== null && (
          <span className="sm:hidden absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-primary-500 shadow-sm" />
        )}
        
        {/* Distance icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        
        <span className="hidden sm:inline">{currentLabel}</span>
        
        {/* Dropdown arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1003]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div
            className={`
              absolute top-full mt-2 right-0 z-[1004]
              min-w-[120px] rounded-xl overflow-hidden
              ${isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
              backdrop-blur-xl shadow-xl border
            `}
          >
            {DISTANCE_OPTIONS.map((option) => {
              const label = language === 'id' ? option.labelId : option.labelEn;
              const isSelected = option.value === currentDistance;
              
              return (
                <button
                  key={option.value ?? 'all'}
                  onClick={() => {
                    onDistanceChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm transition-colors
                    ${isSelected
                      ? 'bg-primary-500 text-white font-medium'
                      : isDarkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
