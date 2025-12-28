import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import MapView from './components/MapView';
import SearchBox from './components/SearchBox';
import MapControls from './components/MapControls';
import CafeDetailPanel from './components/CafeDetailPanel';
import DistanceFilter from './components/DistanceFilter';
import FavoritesPanel from './components/FavoritesPanel';
import IntroductionModal from './components/IntroductionModal';
import AboutModal from './components/AboutModal';
import ChangelogModal from './components/ChangelogModal';
import LocationPermissionModal from './components/LocationPermissionModal';
import StatsModal from './components/StatsModal';
import AddCafeModal from './components/AddCafeModal';
import { type Cafe } from './services/cafeService';
import { calculateDistance } from './services/favoritesService';
import { getApprovedCafes, getCafeOverrides, type CustomCafe } from './services/customCafeService';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage, default to light mode
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false; // Default to light mode
  });

  const [language, setLanguage] = useState<'id' | 'en'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'id' | 'en') || 'id'; // Default to Indonesian
  });

  const [showIntroModal, setShowIntroModal] = useState(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    return hasSeenIntro !== 'true';
  });

  // Location and search state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // New states for filters and panels
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCafeDetail, setShowCafeDetail] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [customCafes, setCustomCafes] = useState<CustomCafe[]>([]);
  const [hiddenCafeIds, setHiddenCafeIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Load cafes from Spreadsheet on mount
  useEffect(() => {
    const loadCafes = async () => {
      setIsSearching(true);
      try {
        const cafesData = await getApprovedCafes();
        setCustomCafes(cafesData);
      } catch (error) {
        console.error('Error loading cafes:', error);
      } finally {
        setIsSearching(false);
      }
    };
    loadCafes();
  }, []);

  // Load hidden cafe IDs from overrides
  useEffect(() => {
    const loadHiddenCafes = async () => {
      try {
        const overrides = await getCafeOverrides();
        const hidden = new Set<string>();
        Object.entries(overrides).forEach(([id, override]) => {
          if (override.isHidden) {
            hidden.add(id);
          }
        });
        setHiddenCafeIds(hidden);
      } catch (error) {
        console.error('Error loading hidden cafes:', error);
      }
    };
    loadHiddenCafes();
  }, []);

  // All cafes from Spreadsheet (filter out hidden ones)
  const allCafes = useMemo(() => {
    // Convert custom cafes to standard Cafe format
    const convertedCafes: Cafe[] = customCafes.map(cc => ({
      ...cc,
      id: cc.id,
    }));
    // Filter out hidden cafes
    return convertedCafes.filter(cafe => !hiddenCafeIds.has(cafe.id));
  }, [customCafes, hiddenCafeIds]);

  // Filter cafes by distance (for both map and search results)
  const distanceFilteredCafes = useMemo(() => {
    if (!distanceFilter || !userLocation) {
      return allCafes;
    }
    
    return allCafes.filter(cafe => {
      const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        cafe.lat,
        cafe.lon
      );
      return distance <= distanceFilter;
    });
  }, [allCafes, distanceFilter, userLocation]);

  // Search filtered cafes (only for search dropdown, not for map)
  const searchFilteredCafes = useMemo(() => {
    if (!searchQuery.trim()) return distanceFilteredCafes;
    const query = searchQuery.toLowerCase();
    return distanceFilteredCafes.filter(cafe =>
      cafe.name.toLowerCase().includes(query) ||
      cafe.address?.toLowerCase().includes(query) ||
      cafe.brand?.toLowerCase().includes(query)
    );
  }, [distanceFilteredCafes, searchQuery]);

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const handleMyLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Current location:', latitude, longitude);
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert(language === 'id' 
            ? 'Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan.' 
            : 'Cannot access your location. Please enable location permission.'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 60000,
        }
      );
    } else {
      alert(language === 'id' 
        ? 'Geolokasi tidak didukung oleh browser Anda.' 
        : 'Geolocation is not supported by your browser.'
      );
    }
  }, [language]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle when user selects a geocoded location
  const handleAddressFound = useCallback((_lat: number, _lon: number, nearbyCafes: Cafe[]) => {
    // If there are cafes near the location, show the first one
    if (nearbyCafes.length > 0) {
      // Select the first cafe to center the map
      setSelectedCafe(nearbyCafes[0]);
      setShowCafeDetail(true);
    }
  }, []);

  const handleSelectCafe = useCallback((cafe: Cafe) => {
    setSelectedCafe(cafe);
    setShowCafeDetail(true);
  }, []);

  const handleCloseCafeDetail = useCallback(() => {
    setShowCafeDetail(false);
    // Immediately clear selected cafe so marker returns to normal
    setSelectedCafe(null);
    // Also reset search query to clear the search box
    setSearchQuery('');
  }, []);

  return (
    <div className={`h-svh w-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Map Container - Full Screen */}
      <div className="absolute inset-0">
        <MapView 
          isDarkMode={isDarkMode} 
          userLocation={userLocation}
          cafes={distanceFilteredCafes}
          selectedCafe={selectedCafe}
          onCafeSelect={handleSelectCafe}
          showCafeDetail={showCafeDetail}
        />
      </div>

      {/* App Title - Top Left */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[1000]">
        <div className={`
          flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl
          ${isDarkMode 
            ? 'bg-gray-900/90 backdrop-blur-[1px] border border-gray-700/50' 
            : 'bg-white/95 backdrop-blur-[1px] border border-gray-200/50'
          }
          shadow-lg
        `}>
          {/* Coffee Cup Icon */}
          <div className="p-1 sm:p-1.5 rounded-lg bg-primary-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 sm:h-5 sm:w-5 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <span className={`
            text-sm sm:text-lg font-bold
            ${isDarkMode 
              ? 'text-white' 
              : 'text-gray-900'
            }
          `}>
            RuangKopi <span className="text-primary-500">Surabaya</span>
          </span>
        </div>
      </div>

      {/* Floating Search Box */}
      <SearchBox 
        isDarkMode={isDarkMode} 
        onSearch={handleSearch}
        onClear={() => {
          // Reset search query when cleared
          setSearchQuery('');
        }}
        searchResults={searchFilteredCafes}
        isLoading={isSearching}
        onSelectCafe={handleSelectCafe}
        language={language}
        onAddressFound={handleAddressFound}
        externalQuery={searchQuery}
      />

      {/* Distance Filter - Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[1000]">
        <div className="flex items-center gap-2">
          {/* Favorites Button */}
          <button
            onClick={() => setShowFavorites(true)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl
              text-sm font-medium transition-all
              ${isDarkMode
                ? 'bg-gray-800/90 hover:bg-gray-700 text-white'
                : 'bg-white/90 hover:bg-white text-gray-800'
              }
              backdrop-blur-[1px] shadow-lg border
              ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-red-500"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span className="hidden sm:inline">
              {language === 'id' ? 'Favorit' : 'Favorites'}
            </span>
          </button>
          
          {/* Distance Filter */}
          <DistanceFilter
            isDarkMode={isDarkMode}
            language={language}
            currentDistance={distanceFilter}
            onDistanceChange={setDistanceFilter}
            disabled={!userLocation}
            onDisabledClick={handleMyLocation}
          />
        </div>
      </div>

      {/* Bottom Control Buttons */}
      <MapControls
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onMyLocation={handleMyLocation}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenAddCafe={() => setShowAddCafeModal(true)}
      />

      {/* Cafe count indicator - hidden on mobile (overlaps search), visible on desktop below title */}
      {distanceFilteredCafes.length > 0 && !showCafeDetail && (
        <div className="hidden sm:block absolute top-20 left-6 z-[1000]">
          <div className={`
            px-3 py-1.5 rounded-full
            ${isDarkMode 
              ? 'bg-gray-900/90 text-white border border-gray-700/50' 
              : 'bg-white/95 text-gray-900 border border-gray-200/50'
            }
            backdrop-blur-[1px] shadow-md
            text-xs font-medium
          `}>
            <Icon icon="mdi:coffee" className="w-3.5 h-3.5 inline mr-1" />
            {distanceFilteredCafes.length} {language === 'id' ? 'cafe ditemukan' : 'cafes found'}
            {distanceFilter && userLocation && (
              <span className="text-primary-500 ml-1">
                ({distanceFilter >= 1 ? `${distanceFilter} km` : `${distanceFilter * 1000} m`})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cafe Detail Panel */}
      <CafeDetailPanel
        cafe={selectedCafe}
        onClose={handleCloseCafeDetail}
        isDarkMode={isDarkMode}
        userLocation={userLocation}
        language={language}
        isOpen={showCafeDetail}
      />

      {/* Favorites Panel */}
      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelectCafe={handleSelectCafe}
        isDarkMode={isDarkMode}
        language={language}
      />

      {/* Introduction Modal - First time visitor */}
      {showIntroModal && (
        <IntroductionModal
          isDarkMode={isDarkMode}
          language={language}
          onClose={() => {
            setShowIntroModal(false);
            localStorage.setItem('hasSeenIntro', 'true');
          }}
        />
      )}

      {/* About Modal */}
      <AboutModal
        isDarkMode={isDarkMode}
        language={language}
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onOpenChangelog={() => setShowChangelogModal(true)}
      />

      {/* Changelog Modal */}
      <ChangelogModal
        isDarkMode={isDarkMode}
        language={language}
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
      />

      {/* Location Permission Modal - Auto-shows on first visit */}
      <LocationPermissionModal
        isDarkMode={isDarkMode}
        language={language}
        onLocationGranted={(coords) => {
          setUserLocation(coords);
        }}
        onLocationDenied={() => {
          console.log('Location permission denied');
        }}
      />

      {/* Stats Modal */}
      <StatsModal
        isDarkMode={isDarkMode}
        language={language}
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
      />

      {/* Add Cafe Modal */}
      <AddCafeModal
        isDarkMode={isDarkMode}
        language={language}
        isOpen={showAddCafeModal}
        onClose={() => setShowAddCafeModal(false)}
        userLocation={userLocation ? { lat: userLocation[0], lon: userLocation[1] } : null}
        onSuccess={async () => {
          // Refresh cafes from spreadsheet
          console.log('New cafe added successfully, refreshing...');
          const updatedCafes = await getApprovedCafes();
          setCustomCafes(updatedCafes);
        }}
      />
    </div>
  );
}

export default App;
