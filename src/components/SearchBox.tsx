import { useState, useEffect, useRef } from 'react';
import type { Cafe } from '../services/cafeService';

interface SearchBoxProps {
  isDarkMode: boolean;
  onSearch: (query: string) => void;
  searchResults: Cafe[];
  isLoading: boolean;
  onSelectCafe: (cafe: Cafe) => void;
  language: 'id' | 'en';
}

export default function SearchBox({ 
  isDarkMode, 
  onSearch, 
  searchResults, 
  isLoading,
  onSelectCafe,
  language 
}: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show results when there are results and input is focused
  useEffect(() => {
    if (searchResults.length > 0 && isFocused) {
      setShowResults(true);
    }
  }, [searchResults, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectCafe = (cafe: Cafe) => {
    setSearchQuery(cafe.name);
    setShowResults(false);
    onSelectCafe(cafe);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  const placeholderText = language === 'id' 
    ? 'Cari cafe...' 
    : 'Search cafes...';

  return (
    <div 
      ref={containerRef}
      className="
        absolute z-[1000]
        /* Mobile: below title, smaller width */
        top-16 left-4 right-4
        /* Desktop: centered at top */
        sm:top-6 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:w-[90%] sm:max-w-md
      "
    >
      <form onSubmit={handleSubmit}>
        <div 
          className={`
            relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3
            rounded-xl sm:rounded-2xl shadow-2xl
            transition-all duration-300 ease-out
            ${isFocused 
              ? 'ring-2 ring-primary-500 shadow-primary-500/25' 
              : 'shadow-black/10 dark:shadow-black/30'
            }
            ${isDarkMode 
              ? 'bg-gray-900/90 backdrop-blur-xl border border-gray-700/50' 
              : 'bg-white/95 backdrop-blur-xl border border-gray-200/50'
            }
          `}
        >
          {/* Search Icon */}
          <div className={`flex-shrink-0 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              if (searchResults.length > 0) setShowResults(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholderText}
            className={`
              flex-1 bg-transparent outline-none min-w-0
              text-sm sm:text-base font-medium placeholder:font-normal
              ${isDarkMode 
                ? 'text-white placeholder:text-gray-400' 
                : 'text-gray-900 placeholder:text-gray-500'
              }
            `}
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex-shrink-0">
              <svg 
                className={`animate-spin h-5 w-5 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {/* Clear Button */}
          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={`
                flex-shrink-0 p-1.5 rounded-full
                transition-all duration-200
                hover:scale-110 active:scale-95
                ${isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }
              `}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            className={`
              flex-shrink-0 p-2 rounded-xl
              transition-all duration-200
              hover:scale-105 active:scale-95
              ${isDarkMode 
                ? 'bg-primary-600 hover:bg-primary-500' 
                : 'bg-primary-500 hover:bg-primary-400'
              }
              shadow-lg shadow-primary-500/30
            `}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div 
          className={`
            absolute top-full left-0 right-0 mt-2
            rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden
            max-h-[50vh] sm:max-h-[60vh] overflow-y-auto
            ${isDarkMode 
              ? 'bg-gray-900/95 backdrop-blur-xl border border-gray-700/50' 
              : 'bg-white/95 backdrop-blur-xl border border-gray-200/50'
            }
          `}
        >
          <div className={`px-3 sm:px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchResults.length} {language === 'id' ? 'cafe ditemukan' : 'cafes found'}
            </span>
          </div>
          
          {searchResults.slice(0, 10).map((cafe) => (
            <button
              key={cafe.id}
              onClick={() => handleSelectCafe(cafe)}
              className={`
                w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left
                transition-colors duration-150
                flex items-start gap-2 sm:gap-3
                ${isDarkMode 
                  ? 'hover:bg-gray-800/50' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              {/* Coffee Icon */}
              <div className={`
                flex-shrink-0 p-1.5 sm:p-2 rounded-lg mt-0.5
                ${isDarkMode ? 'bg-primary-600/20' : 'bg-primary-50'}
              `}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
                </svg>
              </div>
              
              {/* Cafe Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm sm:text-base font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {cafe.name}
                </h4>
                {cafe.address && (
                  <p className={`text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {cafe.address}
                  </p>
                )}
              </div>
            </button>
          ))}
          
          {searchResults.length > 10 && (
            <div className={`px-4 py-2 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-xs sm:text-sm">
                +{searchResults.length - 10} {language === 'id' ? 'cafe lainnya' : 'more cafes'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Glowing effect behind - hidden on mobile for performance */}
      <div className={`
        hidden sm:block absolute inset-0 -z-10 rounded-2xl blur-xl opacity-30
        ${isDarkMode 
          ? 'bg-primary-500' 
          : 'bg-primary-400'
        }
      `} />
    </div>
  );
}
