import { useState, useEffect } from 'react';
import type { Cafe } from '../services/cafeService';
import { getFavorites, removeFavorite, type FavoriteCafe } from '../services/favoritesService';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCafe: (cafe: Cafe) => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
}

export default function FavoritesPanel({
  isOpen,
  onClose,
  onSelectCafe,
  isDarkMode,
  language,
}: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteCafe[]>([]);

  // Refresh favorites when panel opens
  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavorites());
    }
  }, [isOpen]);

  const handleRemoveFavorite = (cafeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(cafeId);
    setFavorites(getFavorites());
  };

  const handleSelectCafe = (cafe: FavoriteCafe) => {
    onSelectCafe(cafe);
    onClose();
  };

  const t = {
    id: {
      title: 'Cafe Favorit',
      empty: 'Belum ada cafe favorit',
      emptyHint: 'Ketuk ikon hati pada detail cafe untuk menambahkan ke favorit',
      addedOn: 'Ditambahkan',
    },
    en: {
      title: 'Favorite Cafes',
      empty: 'No favorite cafes yet',
      emptyHint: 'Tap the heart icon on cafe details to add to favorites',
      addedOn: 'Added on',
    },
  };

  const text = t[language];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[1005]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed z-[1006] transition-all duration-300 ease-out
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 max-h-[70vh]
          md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-[480px] md:max-h-[600px] md:rounded-2xl
          rounded-t-3xl
          ${isDarkMode
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-900'
          }
          shadow-2xl overflow-hidden flex flex-col
        `}
      >
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className={`
          flex items-center justify-between px-5 py-4 border-b
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-red-500"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">{text.title}</h2>
            <span className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
            `}>
              {favorites.length}
            </span>
          </div>
          
          <button
            onClick={onClose}
            className={`
              p-2 rounded-full transition-all
              ${isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className={`
                w-20 h-20 rounded-full mb-4 flex items-center justify-center
                ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
              `}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {text.empty}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {text.emptyHint}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {favorites.map((cafe) => (
                <div
                  key={cafe.id}
                  onClick={() => handleSelectCafe(cafe)}
                  className={`
                    flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors
                    ${isDarkMode
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Coffee icon */}
                  <div className="p-2.5 rounded-xl bg-primary-500/10 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-primary-500"
                    >
                      <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                    </svg>
                  </div>

                  {/* Cafe info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{cafe.name}</h3>
                    {cafe.address && (
                      <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cafe.address}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {text.addedOn} {new Date(cafe.addedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemoveFavorite(cafe.id, e)}
                    className={`
                      p-2 rounded-full transition-all flex-shrink-0
                      ${isDarkMode
                        ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                      }
                    `}
                    aria-label="Remove from favorites"
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
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom md:hidden" />
      </div>
    </>
  );
}
