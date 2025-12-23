import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import SearchBox from './components/SearchBox';
import MapControls from './components/MapControls';
import { searchCafes, type Cafe } from './services/cafeService';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [language, setLanguage] = useState<'id' | 'en'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'id' | 'en') || 'id';
  });

  // Location and search state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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

  // Load initial cafes on mount
  useEffect(() => {
    const loadInitialCafes = async () => {
      setIsSearching(true);
      try {
        const results = await searchCafes('');
        setCafes(results);
      } catch (error) {
        console.error('Error loading cafes:', error);
      } finally {
        setIsSearching(false);
      }
    };
    loadInitialCafes();
  }, []);

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
          timeout: 10000,
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

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchCafes(query);
      setCafes(results);
    } catch (error) {
      console.error('Error searching cafes:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectCafe = useCallback((cafe: Cafe) => {
    setSelectedCafe(cafe);
  }, []);

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Map Container - Full Screen */}
      <div className="absolute inset-0">
        <MapView 
          isDarkMode={isDarkMode} 
          userLocation={userLocation}
          cafes={cafes}
          selectedCafe={selectedCafe}
          onCafeSelect={handleSelectCafe}
        />
      </div>

      {/* Floating Search Box */}
      <SearchBox 
        isDarkMode={isDarkMode} 
        onSearch={handleSearch}
        searchResults={cafes}
        isLoading={isSearching}
        onSelectCafe={handleSelectCafe}
        language={language}
      />

      {/* Bottom Control Buttons */}
      <MapControls
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onMyLocation={handleMyLocation}
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* App Title - Top Left */}
      <div className="absolute top-6 left-6 z-[1000]">
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          ${isDarkMode 
            ? 'bg-gray-900/90 backdrop-blur-xl border border-gray-700/50' 
            : 'bg-white/95 backdrop-blur-xl border border-gray-200/50'
          }
          shadow-lg
        `}>
          {/* Coffee Cup Icon */}
          <div className="p-1.5 rounded-lg bg-primary-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <span className={`
            text-lg font-bold
            ${isDarkMode 
              ? 'text-white' 
              : 'text-gray-900'
            }
          `}>
            RuangKopi <span className="text-primary-500">Surabaya</span>
          </span>
        </div>
      </div>

      {/* Cafe count indicator */}
      {cafes.length > 0 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className={`
            px-4 py-2 rounded-full
            ${isDarkMode 
              ? 'bg-gray-900/90 text-white' 
              : 'bg-white/95 text-gray-900'
            }
            backdrop-blur-xl shadow-lg
            text-sm font-medium
          `}>
            ☕ {cafes.length} {language === 'id' ? 'cafe ditemukan' : 'cafes found'}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
