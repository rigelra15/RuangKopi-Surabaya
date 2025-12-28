import { useState, useEffect, useRef } from 'react';
import type { Cafe } from '../services/cafeService';
import { geocodeLocation, searchCafesNearLocation } from '../services/cafeService';

interface GeocodedResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface SearchBoxProps {
  isDarkMode: boolean;
  onSearch: (query: string) => void;
  onClear: () => void;
  searchResults: Cafe[];
  isLoading: boolean;
  onSelectCafe: (cafe: Cafe) => void;
  language: 'id' | 'en';
  onAddressFound?: (lat: number, lon: number, cafes: Cafe[]) => void;
  externalQuery?: string; // For controlled reset from parent
}

export default function SearchBox({ 
  isDarkMode, 
  onSearch, 
  onClear,
  searchResults, 
  isLoading,
  onSelectCafe,
  language,
  onAddressFound,
  externalQuery = ''
}: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSelectedCafe, setHasSelectedCafe] = useState(false); // Track if user selected a cafe
  const [geocodedLocation, setGeocodedLocation] = useState<GeocodedResult | null>(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressCafes, setAddressCafes] = useState<Cafe[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevExternalQueryRef = useRef(externalQuery);

  // Sync with external query (for reset from parent)
  // Only reset when externalQuery changes from non-empty to empty
  useEffect(() => {
    const prevValue = prevExternalQueryRef.current;
    prevExternalQueryRef.current = externalQuery;

    // Only reset if external query was non-empty before and is now empty
    // This means parent explicitly cleared it (e.g., on close panel)
    if (prevValue !== '' && externalQuery === '') {
      setSearchQuery('');
      setShowResults(false);
      setHasSelectedCafe(false);
      setGeocodedLocation(null);
      setAddressCafes([]);
    }
  }, [externalQuery]);

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

  // Detect if query looks like an address
  const isAddressQuery = (query: string): boolean => {
    const addressKeywords = [
      'jl', 'jl.', 'jalan', 
      'gg', 'gg.', 'gang',
      'no', 'no.', 'nomor',
      'raya', 'boulevard', 'blvd',
      'pakuwon', 'galaxy', 'tunjungan', 'darmo', 'gubeng',
      'surabaya', 'sby',
      'ciputra', 'supermall', 'mall', 'plaza',
      'kelurahan', 'kecamatan', 'kec',
    ];
    const lowerQuery = query.toLowerCase();
    return addressKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  // Realtime search with debounce - now supports address search
  useEffect(() => {
    // If user just selected a cafe, don't search again
    if (hasSelectedCafe) {
      return;
    }

    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        // First try regular cafe name search
        onSearch(searchQuery);
        
        // If query looks like an address, also try geocoding
        if (isAddressQuery(searchQuery) && searchQuery.length >= 5) {
          setIsSearchingAddress(true);
          try {
            const location = await geocodeLocation(searchQuery);
            if (location && location.displayName) {
              setGeocodedLocation({
                lat: location.lat,
                lon: location.lon,
                displayName: location.displayName,
              });
              // Find cafes near this location
              const nearbyCafes = await searchCafesNearLocation(location.lat, location.lon, 1);
              setAddressCafes(nearbyCafes);
            } else {
              setGeocodedLocation(null);
              setAddressCafes([]);
            }
          } catch {
            setGeocodedLocation(null);
            setAddressCafes([]);
          } finally {
            setIsSearchingAddress(false);
          }
        } else {
          setGeocodedLocation(null);
          setAddressCafes([]);
        }
        
        setShowResults(true);
      }
    }, 400); // Slightly longer debounce for address search

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch, hasSelectedCafe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSelectedCafe(false); // Allow search on manual submit
      onSearch(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHasSelectedCafe(false); // Reset flag when user types
  };

  const handleSelectCafe = (cafe: Cafe) => {
    setSearchQuery(cafe.name);
    setShowResults(false);
    setHasSelectedCafe(true); // Set flag to prevent re-searching
    onSelectCafe(cafe);
  };

  const handleSelectLocation = () => {
    if (geocodedLocation && onAddressFound) {
      onAddressFound(geocodedLocation.lat, geocodedLocation.lon, addressCafes);
      setShowResults(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowResults(false);
    setGeocodedLocation(null);
    setAddressCafes([]);
    onClear(); // Reset filter in parent component
  };

  const placeholderText = language === 'id' 
    ? 'Cari cafe atau alamat...' 
    : 'Search cafes or address...';

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
          {(isLoading || isSearchingAddress) && (
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
      {showResults && (searchResults.length > 0 || geocodedLocation) && (
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
          {/* Geocoded Location Result */}
          {geocodedLocation && (
            <>
              <div className={`px-3 sm:px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3.5 w-3.5 inline mr-1"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  {language === 'id' ? 'Lokasi Ditemukan' : 'Location Found'}
                </span>
              </div>
              <button
                onClick={handleSelectLocation}
                className={`
                  w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left
                  transition-colors duration-150
                  flex items-start gap-2 sm:gap-3
                  ${isDarkMode 
                    ? 'hover:bg-amber-500/10 bg-amber-500/5' 
                    : 'hover:bg-amber-50 bg-amber-50/50'
                  }
                `}
              >
                {/* Location Pin Icon */}
                <div className={`
                  flex-shrink-0 p-1.5 sm:p-2 rounded-lg mt-0.5
                  ${isDarkMode ? 'bg-amber-600/20' : 'bg-amber-100'}
                `}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Location Info */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    {language === 'id' ? 'Cari cafe dekat lokasi ini' : 'Find cafes near this location'}
                  </h4>
                  <p className={`text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {geocodedLocation.displayName.split(',').slice(0, 3).join(',')}
                  </p>
                  {addressCafes.length > 0 && (
                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`}>
                      {addressCafes.length} {language === 'id' ? 'cafe dalam 1km' : 'cafes within 1km'}
                    </p>
                  )}
                </div>
              </button>
              
              {/* Nearby cafes from address */}
              {addressCafes.length > 0 && (
                <>
                  <div className={`px-3 sm:px-4 py-1.5 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {language === 'id' ? 'Cafe terdekat dari lokasi:' : 'Nearest cafes from location:'}
                    </span>
                  </div>
                  {addressCafes.slice(0, 5).map((cafe) => (
                    <button
                      key={`addr-${cafe.id}`}
                      onClick={() => handleSelectCafe(cafe)}
                      className={`
                        w-full px-3 sm:px-4 py-2 text-left
                        transition-colors duration-150
                        flex items-start gap-2 sm:gap-3
                        ${isDarkMode 
                          ? 'hover:bg-gray-800/50' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 p-1 sm:p-1.5 rounded-lg mt-0.5
                        ${isDarkMode ? 'bg-primary-600/20' : 'bg-primary-50'}
                      `}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {cafe.name}
                        </h4>
                      </div>
                    </button>
                  ))}
                </>
              )}
              
              {/* Divider between address results and name results */}
              {searchResults.length > 0 && (
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
              )}
            </>
          )}
          
          {/* Regular cafe search results */}
          {searchResults.length > 0 && (
            <>
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
            </>
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
