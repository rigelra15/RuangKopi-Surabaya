import { useEffect, useState } from 'react';
import type { Cafe } from '../services/cafeService';
import { isFavorite, toggleFavorite, formatDistance, calculateDistance } from '../services/favoritesService';

interface CafeDetailPanelProps {
  cafe: Cafe | null;
  onClose: () => void;
  isDarkMode: boolean;
  userLocation: [number, number] | null;
  language: 'id' | 'en';
}

export default function CafeDetailPanel({
  cafe,
  onClose,
  isDarkMode,
  userLocation,
  language,
}: CafeDetailPanelProps) {
  const [isFav, setIsFav] = useState(false);
  
  useEffect(() => {
    if (cafe) {
      setIsFav(isFavorite(cafe.id));
    }
  }, [cafe]);

  if (!cafe) return null;

  const handleToggleFavorite = () => {
    if (cafe) {
      const newState = toggleFavorite(cafe);
      setIsFav(newState);
    }
  };

  const handleGetDirections = () => {
    // Open Google Maps directions
    const destination = `${cafe.lat},${cafe.lon}`;
    let url: string;
    
    if (userLocation) {
      const origin = `${userLocation[0]},${userLocation[1]}`;
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
    
    window.open(url, '_blank');
  };

  const distance = userLocation
    ? calculateDistance(userLocation[0], userLocation[1], cafe.lat, cafe.lon)
    : null;

  const t = {
    id: {
      directions: 'Rute',
      call: 'Telepon',
      website: 'Website',
      openingHours: 'Jam Buka',
      noAddress: 'Alamat tidak tersedia',
      fromYou: 'dari lokasi Anda',
    },
    en: {
      directions: 'Directions',
      call: 'Call',
      website: 'Website',
      openingHours: 'Opening Hours',
      noAddress: 'Address not available',
      fromYou: 'from you',
    },
  };

  const text = t[language];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[1001] md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className={`
          fixed z-[1002] transition-all duration-300 ease-out
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0
          md:bottom-auto md:top-1/2 md:left-auto md:right-6 md:-translate-y-1/2
          md:w-96 md:rounded-2xl
          rounded-t-3xl
          ${isDarkMode
            ? 'bg-gray-900/95 text-white border-gray-700'
            : 'bg-white/95 text-gray-900 border-gray-200'
          }
          backdrop-blur-xl border shadow-2xl
          overflow-hidden
        `}
      >
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        {/* Header with close and favorite buttons */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex-1 pr-12">
            <h2 className="text-xl font-bold truncate">{cafe.name}</h2>
            {distance !== null && (
              <p className="text-sm text-primary-500 font-medium mt-0.5">
                📍 {formatDistance(distance)} {text.fromYou}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 absolute top-4 right-4">
            {/* Favorite button */}
            <button
              onClick={handleToggleFavorite}
              className={`
                p-2 rounded-full transition-all
                ${isFav
                  ? 'bg-red-500/20 text-red-500'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-400 hover:text-red-400' 
                    : 'bg-gray-100 text-gray-500 hover:text-red-500'
                }
              `}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFav ? 'currentColor' : 'none'}
                stroke="currentColor"
                className="w-5 h-5"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className={`
                p-2 rounded-full transition-all
                ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }
              `}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-3">
          {/* Address */}
          <div className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="text-lg">📍</span>
            <span>{cafe.address || text.noAddress}</span>
          </div>

          {/* Opening hours */}
          {cafe.openingHours && (
            <div className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="text-lg">🕐</span>
              <div>
                <span className="font-medium">{text.openingHours}</span>
                <br />
                <span>{cafe.openingHours}</span>
              </div>
            </div>
          )}

          {/* Phone */}
          {cafe.phone && (
            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="text-lg">📞</span>
              <a href={`tel:${cafe.phone}`} className="hover:text-primary-500 transition-colors">
                {cafe.phone}
              </a>
            </div>
          )}

          {/* Cuisine/type */}
          {cafe.cuisine && (
            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="text-lg">☕</span>
              <span className="capitalize">{cafe.cuisine}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={`
          grid grid-cols-2 gap-2 p-4 border-t
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {/* Directions button */}
          <button
            onClick={handleGetDirections}
            className="
              flex items-center justify-center gap-2 py-3 px-4 rounded-xl
              bg-primary-500 hover:bg-primary-600 text-white
              font-medium transition-all shadow-lg shadow-primary-500/25
              active:scale-95
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                clipRule="evenodd"
              />
            </svg>
            {text.directions}
          </button>

          {/* Website or call button */}
          {cafe.website ? (
            <a
              href={cafe.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                font-medium transition-all active:scale-95
                ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z"
                  clipRule="evenodd"
                />
              </svg>
              {text.website}
            </a>
          ) : cafe.phone ? (
            <a
              href={`tel:${cafe.phone}`}
              className={`
                flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                font-medium transition-all active:scale-95
                ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
              {text.call}
            </a>
          ) : (
            <div className={`
              flex items-center justify-center py-3 px-4 rounded-xl
              ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'}
            `}>
              <span className="text-sm">—</span>
            </div>
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom md:hidden" />
      </div>
    </>
  );
}
