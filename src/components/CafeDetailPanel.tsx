import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { Cafe } from '../services/cafeService';
import { reverseGeocode } from '../services/cafeService';
import { isFavorite, toggleFavorite, formatDistance, calculateDistance } from '../services/favoritesService';
import { getThumbnailUrl } from '../services/imageService';
import Toast from './Toast';
import ReportIssueModal from './ReportIssueModal';
import PhotoGallery from './PhotoGallery';

interface CafeDetailPanelProps {
  cafe: Cafe | null;
  onClose: () => void;
  isDarkMode: boolean;
  userLocation: [number, number] | null;
  language: 'id' | 'en';
  isOpen: boolean;
}

// Helper function to format cuisine string
// Converts "coffee_shop" to "Coffee Shop"
function formatCuisine(cuisine: unknown): string {
  if (typeof cuisine !== 'string') {
    return cuisine ? String(cuisine) : '';
  }
  
  return cuisine
    .replace(/_/g, ' ')
    .replace(/;/g, ', ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to format opening hours
// Converts OSM format like "Mo-Th 07:00-23:00, Fr-Su 07:00-23:59" to readable format
function formatOpeningHours(hours: unknown, language: 'id' | 'en'): string {
  if (typeof hours !== 'string') {
    return hours ? String(hours) : '';
  }

  // unwanted boolean values as strings
  if (hours.toLowerCase() === 'true' || hours.toLowerCase() === 'false') {
    return '';
  }

  const dayMappings: Record<string, { id: string; en: string }> = {
    'Mo': { id: 'Sen', en: 'Mon' },
    'Tu': { id: 'Sel', en: 'Tue' },
    'We': { id: 'Rab', en: 'Wed' },
    'Th': { id: 'Kam', en: 'Thu' },
    'Fr': { id: 'Jum', en: 'Fri' },
    'Sa': { id: 'Sab', en: 'Sat' },
    'Su': { id: 'Min', en: 'Sun' },
    'PH': { id: 'Libur', en: 'Holidays' },
  };

  let formatted = hours;

  // Replace day abbreviations
  Object.entries(dayMappings).forEach(([osm, names]) => {
    const regex = new RegExp(`\\b${osm}\\b`, 'g');
    formatted = formatted.replace(regex, names[language]);
  });

  // Format time separators for readability
  // Replace comma separator with line break for multi-schedule display
  formatted = formatted.replace(/,\s*/g, '\n');

  // Add "off" translation
  if (language === 'id') {
    formatted = formatted.replace(/\boff\b/gi, 'Tutup');
  }

  return formatted;
}

// Cache for geocoded addresses to avoid re-fetching
const addressCache = new Map<string, string | null>();
// Track loading cafes outside of React state to avoid circular deps
const loadingCafeIdsRef = new Set<string>();

export default function CafeDetailPanel({
  cafe,
  onClose,
  isDarkMode,
  userLocation,
  language,
  isOpen,
}: CafeDetailPanelProps) {
  // Derive initial state from cafe prop
  const [isFav, setIsFav] = useState(() => cafe ? isFavorite(cafe.id) : false);
  const [geocodedAddresses, setGeocodedAddresses] = useState<Map<string, string | null>>(new Map(addressCache));
  const [, forceUpdate] = useState(0);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [showToast, setShowToast] = useState(false);
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Sync favorite status when cafe changes
  useEffect(() => {
    if (cafe) {
      const currentFavStatus = isFavorite(cafe.id);
      setIsFav(currentFavStatus);
    }
  }, [cafe]);

  // Derive current geocoded address and loading state
  const geocodedAddress = useMemo(() => {
    if (!cafe) return null;
    return geocodedAddresses.get(cafe.id) ?? null;
  }, [cafe, geocodedAddresses]);

  const isGeocodingAddress = cafe ? loadingCafeIdsRef.has(cafe.id) : false;

  // Function to fetch address
  const fetchAddress = useCallback((cafeId: string, lat: number, lon: number) => {
    if (addressCache.has(cafeId) || loadingCafeIdsRef.has(cafeId)) {
      return;
    }
    
    loadingCafeIdsRef.add(cafeId);
    forceUpdate(n => n + 1);
    
    reverseGeocode(lat, lon)
      .then((address) => {
        addressCache.set(cafeId, address);
        setGeocodedAddresses(prev => new Map(prev).set(cafeId, address));
      })
      .catch(() => {
        addressCache.set(cafeId, null);
        setGeocodedAddresses(prev => new Map(prev).set(cafeId, null));
      })
      .finally(() => {
        loadingCafeIdsRef.delete(cafeId);
        forceUpdate(n => n + 1);
      });
  }, []);

  // Effect to trigger geocoding for ALL cafes (reverse geocode gives more complete address)
  useEffect(() => {
    if (!cafe || !isOpen) {
      return;
    }
    
    // Always fetch address via reverse geocoding for more complete results
    fetchAddress(cafe.id, cafe.lat, cafe.lon);
  }, [cafe, isOpen, fetchAddress]);

  const handleToggleFavorite = () => {
    if (cafe) {
      const newState = toggleFavorite(cafe);
      setIsFav(newState);
      
      // Show toast notification
      if (newState) {
        setToastMessage(language === 'id' ? `${cafe.name} ditambahkan ke favorit` : `${cafe.name} added to favorites`);
        setToastType('success');
      } else {
        setToastMessage(language === 'id' ? `${cafe.name} dihapus dari favorit` : `${cafe.name} removed from favorites`);
        setToastType('info');
      }
      setShowToast(true);
    }
  };

  const handleGetDirections = () => {
    if (!cafe) return;
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

  const distance = userLocation && cafe
    ? calculateDistance(userLocation[0], userLocation[1], cafe.lat, cafe.lon)
    : null;

  // Determine the address to display - prioritize geocoded address (more complete)
  const displayAddress = geocodedAddress || cafe?.address;

  const t = {
    id: {
      directions: 'Rute',
      call: 'Telepon',
      website: 'Website',
      openingHours: 'Jam Buka',
      noAddress: 'Alamat tidak tersedia',
      loadingAddress: 'Memuat alamat...',
      fromYou: 'dari lokasi Anda',
      // Amenities
      amenities: 'Fasilitas',
      wifi: 'WiFi',
      wifiFree: 'WiFi Gratis',
      wifiPaid: 'WiFi Berbayar',
      outdoorSeating: 'Tempat Outdoor',
      takeaway: 'Bisa Takeaway',
      smokingYes: 'Boleh Merokok',
      smokingNo: 'Dilarang Merokok',
      smokingOutside: 'Merokok di Luar',
      smokingSeparated: 'Area Merokok Terpisah',
      airConditioning: 'AC',
      brand: 'Brand',
      // New
      menu: 'Lihat Menu',
      reportIssue: 'Laporkan Masalah',
      orderTransport: 'Pesan Transportasi',
      gojek: 'Gojek',
      grab: 'Grab',
    },
    en: {
      directions: 'Directions',
      call: 'Call',
      website: 'Website',
      openingHours: 'Opening Hours',
      noAddress: 'Address not available',
      loadingAddress: 'Loading address...',
      fromYou: 'from you',
      // Amenities
      amenities: 'Amenities',
      wifi: 'WiFi',
      wifiFree: 'Free WiFi',
      wifiPaid: 'Paid WiFi',
      outdoorSeating: 'Outdoor Seating',
      takeaway: 'Takeaway Available',
      smokingYes: 'Smoking Allowed',
      smokingNo: 'No Smoking',
      smokingOutside: 'Smoking Outside',
      smokingSeparated: 'Separate Smoking Area',
      airConditioning: 'Air Conditioning',
      brand: 'Brand',
      // New
      menu: 'View Menu',
      reportIssue: 'Report Issue',
      orderTransport: 'Order Transport',
      gojek: 'Gojek',
      grab: 'Grab',
    },
  };

  const text = t[language];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelVariants = {
    hidden: { 
      y: '100%',
      opacity: 0,
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      y: '100%',
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const desktopPanelVariants = {
    hidden: { 
      x: 50,
      opacity: 0,
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      x: 50,
      opacity: 0,
      transition: { duration: 0.2 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
        delay: 0.1 + i * 0.05,
      }
    }),
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {isOpen && cafe && (
        <>
          {/* Backdrop - only on mobile */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/30 z-[1001] md:hidden"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            variants={typeof window !== 'undefined' && window.innerWidth >= 768 ? desktopPanelVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-[1002]
              /* Mobile: bottom sheet */
              bottom-0 left-0 right-0
              md:bottom-6 md:top-auto md:left-auto md:right-6
              md:max-h-[calc(100vh-3rem)] md:overflow-y-auto scrollbar-hide
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
            <div className="flex items-start justify-between p-4 pb-2 gap-3">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  {cafe.logo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`
                        w-12 h-12 rounded-xl overflow-hidden flex-shrink-0
                        ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
                        border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}
                      `}
                    >
                      <img
                        src={getThumbnailUrl(cafe.logo)}
                        alt={`${cafe.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                  )}
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {cafe.name.length > 20 ? (
                      <div className="overflow-hidden">
                        <motion.h2 
                          animate={{ x: ["0%", "-50%"] }} 
                          transition={{ 
                            repeat: Infinity, 
                            ease: "linear", 
                            duration: Math.max(cafe.name.length * 0.3, 5)
                          }}
                          className="text-xl font-bold whitespace-nowrap inline-block"
                        >
                          {cafe.name} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; {cafe.name} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                        </motion.h2>
                      </div>
                    ) : (
                      <h2 className="text-xl font-bold">{cafe.name}</h2>
                    )}
                    {distance !== null && (
                      <p className="text-sm text-primary-500 font-medium mt-0.5 flex items-center gap-1">
                        <Icon icon="mdi:walk" className="w-4 h-4" />
                        {formatDistance(distance)} {text.fromYou}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Buttons - now part of flex layout, not absolute */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Favorite button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.15 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleFavorite}
                  className={`
                    p-2 rounded-full transition-colors
                    ${isFav
                      ? 'bg-red-500/20 text-red-500'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-400 hover:text-red-400' 
                        : 'bg-gray-100 text-gray-500 hover:text-red-500'
                    }
                  `}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <motion.div
                    animate={isFav ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon 
                      icon={isFav ? 'mdi:heart' : 'mdi:heart-outline'} 
                      className="w-5 h-5" 
                    />
                  </motion.div>
                </motion.button>
                
                {/* Close button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`
                    p-2 rounded-full transition-colors
                    ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }
                  `}
                  aria-label="Close"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Photo Gallery */}
            {cafe.photos && cafe.photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="px-4 pt-2 pb-2"
              >
                <PhotoGallery photos={cafe.photos} cafeName={cafe.name} />
              </motion.div>
            )}

            {/* Content */}
            <div className="px-4 pb-4 space-y-3">
              {/* Address */}
              <motion.div 
                custom={0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <Icon icon="mdi:map-marker" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                <span>
                  {isGeocodingAddress ? (
                    <span className="flex items-center gap-1">
                      <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                      {text.loadingAddress}
                    </span>
                  ) : (
                    displayAddress || text.noAddress
                  )}
                </span>
              </motion.div>

              {/* Opening hours */}
              {(() => {
                const hours = cafe.openingHours;
                // Only show if it's a valid string (not boolean, not empty)
                const isValidHours = hours && typeof hours === 'string' && hours.trim() !== '' && hours !== 'true' && hours !== 'false';
                const formattedHours = isValidHours ? formatOpeningHours(hours, language) : '';
                
                // Also check instagram field - sometimes opening hours end up there
                const cafeData = cafe as unknown as Record<string, unknown>;
                const instagramValue = cafeData.instagram;
                const isInstagramActuallyHours = instagramValue && typeof instagramValue === 'string' && 
                  (instagramValue.includes(':') || instagramValue.match(/\d{1,2}[:.,-]\d{2}/));
                
                const displayHours = formattedHours || (isInstagramActuallyHours ? formatOpeningHours(instagramValue, language) : '');
                
                return displayHours ? (
                  <motion.div 
                    custom={1}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <Icon icon="mdi:clock-outline" className="w-5 h-5 flex-shrink-0 text-primary-500 mt-0.5" />
                    <div>
                      <span className="font-medium">{text.openingHours}</span>
                      <div className="whitespace-pre-line mt-0.5">
                        {displayHours}
                      </div>
                    </div>
                  </motion.div>
                ) : null;
              })()}

              {/* Phone */}
              {cafe.phone && (
                <motion.div 
                  custom={2}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Icon icon="mdi:phone" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                  <a href={`tel:${cafe.phone}`} className="hover:text-primary-500 transition-colors">
                    {cafe.phone}
                  </a>
                </motion.div>
              )}

              {/* Instagram */}
              {(() => {
                const cafeData = cafe as unknown as Record<string, unknown>;
                let instagramValue = cafeData.instagram as string | undefined;
                
                // If instagram field is empty, check if brand looks like an Instagram handle
                if (!instagramValue && cafe.brand) {
                  const brand = cafe.brand;
                  if (brand.startsWith('@') || (brand.match(/^[a-zA-Z0-9._]+$/) && !brand.includes(' '))) {
                    instagramValue = brand;
                  }
                }
                
                // Only show if it's a valid instagram handle (starts with @ or is alphanumeric)
                // Skip if it looks like opening hours (contains colons or time patterns)
                const isValidInstagram = instagramValue && typeof instagramValue === 'string' &&
                  !instagramValue.includes(':') && 
                  !instagramValue.match(/\d{1,2}[:.,-]\d{2}/) &&
                  (instagramValue.startsWith('@') || instagramValue.match(/^[a-zA-Z0-9._]+$/));
                
                return isValidInstagram ? (
                  <motion.div 
                    custom={2.5}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    <Icon icon="mdi:instagram" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                    <a 
                      href={`https://instagram.com/${instagramValue!.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary-500 transition-colors"
                    >
                      @{instagramValue!.replace('@', '')}
                    </a>
                  </motion.div>
                ) : null;
              })()}

              {/* Cuisine/type */}
              {cafe.cuisine && (
                <motion.div 
                  custom={3}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <Icon icon="mdi:coffee" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                  <span>{formatCuisine(cafe.cuisine)}</span>
                </motion.div>
              )}

              {/* Amenities badges - Show if any amenity exists */}
              {(cafe.hasWifi || cafe.hasOutdoorSeating || cafe.hasTakeaway || cafe.smokingPolicy || cafe.hasAirConditioning || cafe.brand) && (
                <motion.div
                  custom={4}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="pt-2"
                >
                  <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {text.amenities}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* WiFi */}
                    {cafe.hasWifi && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }
                      `}>
                        <Icon icon="mdi:wifi" className="w-3.5 h-3.5" />
                        {cafe.wifiFree ? text.wifiFree : text.wifi}
                        {cafe.wifiSsid && (
                          <span className={`ml-1 ${isDarkMode ? 'text-amber-300/70' : 'text-amber-600/70'}`}>
                            ({cafe.wifiSsid})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Outdoor Seating */}
                    {cafe.hasOutdoorSeating && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }
                      `}>
                        <Icon icon="mdi:table-chair" className="w-3.5 h-3.5" />
                        {text.outdoorSeating}
                      </div>
                    )}

                    {/* Takeaway */}
                    {cafe.hasTakeaway && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }
                      `}>
                        <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
                        {text.takeaway}
                      </div>
                    )}

                    {/* Air Conditioning */}
                    {cafe.hasAirConditioning && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }
                      `}>
                        <Icon icon="mdi:snowflake" className="w-3.5 h-3.5" />
                        {text.airConditioning}
                      </div>
                    )}

                    {/* Smoking Policy - only show if valid string value */}
                    {cafe.smokingPolicy && 
                     typeof cafe.smokingPolicy === 'string' &&
                     ['yes', 'no', 'outside', 'separated'].includes(cafe.smokingPolicy.toLowerCase()) && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${cafe.smokingPolicy.toLowerCase() === 'no' 
                          ? (isDarkMode 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                              : 'bg-rose-100 text-rose-700 border border-rose-200')
                          : (isDarkMode 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-amber-100 text-amber-700 border border-amber-200')
                        }
                      `}>
                        <Icon 
                          icon={cafe.smokingPolicy.toLowerCase() === 'no' ? 'mdi:smoking-off' : 'mdi:smoking'} 
                          className="w-3.5 h-3.5" 
                        />
                        {cafe.smokingPolicy.toLowerCase() === 'no' && text.smokingNo}
                        {cafe.smokingPolicy.toLowerCase() === 'yes' && text.smokingYes}
                        {cafe.smokingPolicy.toLowerCase() === 'outside' && text.smokingOutside}
                        {cafe.smokingPolicy.toLowerCase() === 'separated' && text.smokingSeparated}
                      </div>
                    )}

                    {/* Brand - filter out Instagram handles */}
                    {cafe.brand && !cafe.brand.startsWith('@') && !cafe.brand.toLowerCase().includes('instagram') && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }
                      `}>
                        <Icon icon="mdi:tag" className="w-3.5 h-3.5" />
                        {cafe.brand}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`
                p-4 border-t space-y-2
                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
              `}
            >
              {/* Primary actions */}
              <div className="grid grid-cols-2 gap-2">
                {/* Directions button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetDirections}
                  className="
                    flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    bg-primary-500 hover:bg-primary-600 text-white
                    font-medium transition-colors shadow-lg shadow-primary-500/25
                  "
                >
                  <Icon icon="mdi:directions" className="w-5 h-5" />
                  {text.directions}
                </motion.button>

                {/* Website or call button */}
                {cafe.website ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={cafe.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                      font-medium transition-colors
                      ${isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }
                    `}
                  >
                    <Icon icon="mdi:web" className="w-5 h-5" />
                    {text.website}
                  </motion.a>
                ) : cafe.phone ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`tel:${cafe.phone}`}
                    className={`
                      flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                      font-medium transition-colors
                      ${isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }
                    `}
                  >
                    <Icon icon="mdi:phone" className="w-5 h-5" />
                    {text.call}
                  </motion.a>
                ) : (
                  <div className={`
                    flex items-center justify-center py-3 px-4 rounded-xl
                    ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'}
                  `}>
                    <span className="text-sm">—</span>
                  </div>
                )}
              </div>

              {/* Secondary actions */}
              <div className="flex gap-2">
                {/* Menu link */}
                {cafe.menuUrl && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={cafe.menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                      text-sm font-medium transition-colors
                      ${isDarkMode
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      }
                    `}
                  >
                    <Icon icon="mdi:silverware-fork-knife" className="w-4 h-4" />
                    {text.menu}
                  </motion.a>
                )}

                {/* Report issue button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowReportModal(true)}
                  className={`
                    ${cafe.menuUrl ? '' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                    text-sm font-medium transition-colors
                    ${isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                    }
                  `}
                >
                  <Icon icon="mdi:flag-outline" className="w-4 h-4" />
                  {text.reportIssue}
                </motion.button>
              </div>

              {/* Ride-hailing apps */}
              <div className="flex gap-2 pt-2">
                {/* Gojek button */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={`https://www.gojek.com/gojek-link/?link=gojek://transport/confirm&dropoff_lat=${cafe.lat}&dropoff_lng=${cafe.lon}&dropoff_name=${encodeURIComponent(cafe.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                    text-sm font-medium transition-colors
                    bg-[#00AA13] hover:bg-[#009910] text-white
                  `}
                >
                  <Icon icon="simple-icons:gojek" className="w-4 h-4" />
                  {text.gojek}
                </motion.a>

                {/* Grab button */}
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={`https://r.grab.com/open?link=grab://open?screenType=BOOKING&dropOffLatitude=${cafe.lat}&dropOffLongitude=${cafe.lon}&dropOffAddress=${encodeURIComponent(cafe.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                    text-sm font-medium transition-colors
                    bg-[#00B14F] hover:bg-[#009943] text-white
                  `}
                >
                  <Icon icon="simple-icons:grab" className="w-4 h-4" />
                  {text.grab}
                </motion.a>
              </div>
            </motion.div>

            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom md:hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    {/* Report Issue Modal */}
    {cafe && (
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        isDarkMode={isDarkMode}
        language={language}
        cafeId={cafe.id}
        cafeName={cafe.name}
        onSuccess={() => {
          setToastMessage(language === 'id' ? 'Terima kasih atas laporannya!' : 'Thanks for your report!');
          setToastType('success');
          setShowToast(true);
        }}
      />
    )}
    
    {/* Toast notification */}
    <Toast
      message={toastMessage}
      type={toastType}
      isVisible={showToast}
      onClose={() => setShowToast(false)}
      isDarkMode={isDarkMode}
      duration={2500}
    />
  </>
  );
}
