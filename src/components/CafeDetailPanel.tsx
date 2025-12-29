import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { Cafe } from '../services/cafeService';
import { reverseGeocode } from '../services/cafeService';
import { isFavorite, toggleFavorite, formatDistance, calculateDistance } from '../services/favoritesService';
import { getThumbnailUrl, uploadMultipleImages, type CloudinaryUploadResult } from '../services/imageService';
import { updateCustomCafe } from '../services/customCafeService';
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
  onHeightChange?: (height: number) => void;
  onShowRoute?: (cafe: Cafe) => void;
  isShowingRoute?: boolean;
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

// Helper function to get current opening status
function getCurrentOpeningStatus(hours: unknown): { isOpen: boolean, closingSoon: boolean, closingTime: string | null, openingTime: string | null } {
  if (typeof hours !== 'string' || hours.toLowerCase() === 'true' || hours.toLowerCase() === 'false') {
    return { isOpen: false, closingSoon: false, closingTime: null, openingTime: null };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  const dayAbbreviations = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const currentDayAbbr = dayAbbreviations[currentDay];

  // Split by semicolon or comma to get individual entries
  const entries = hours.split(/[;,]/).map(s => s.trim()).filter(Boolean);

  for (const entry of entries) {
    // Check if this entry applies to current day
    const dayPart = entry.split(/\s+/)[0];
    let appliesToday = false;

    if (dayPart === currentDayAbbr) {
      appliesToday = true;
    } else {
      // Check for range like Mo-Fr
      const rangeMatch = dayPart.match(/^([A-Z][a-z])-([A-Z][a-z])$/);
      if (rangeMatch) {
        const startDay = dayAbbreviations.indexOf(rangeMatch[1]);
        const endDay = dayAbbreviations.indexOf(rangeMatch[2]);
        if (startDay !== -1 && endDay !== -1) {
          if (startDay <= endDay) {
            appliesToday = currentDay >= startDay && currentDay <= endDay;
          } else {
            appliesToday = currentDay >= startDay || currentDay <= endDay;
          }
        }
      }
    }

    if (appliesToday) {
      // Check if closed
      if (/\b(off|tutup|closed)\b/i.test(entry)) {
        return { isOpen: false, closingSoon: false, closingTime: null, openingTime: null };
      }

      // Extract time range
      const timeMatch = entry.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const openHour = parseInt(timeMatch[1]);
        const openMin = parseInt(timeMatch[2]);
        const closeHour = parseInt(timeMatch[3]);
        const closeMin = parseInt(timeMatch[4]);

        const openTime = openHour * 60 + openMin;
        let closeTime = closeHour * 60 + closeMin;

        // Handle midnight closing (e.g., 23:59 or 00:00)
        if (closeTime < openTime) {
          closeTime += 24 * 60; // Add 24 hours
        }

        const adjustedCurrentTime = currentTime < openTime && closeTime > 24 * 60 ? currentTime + 24 * 60 : currentTime;

        if (adjustedCurrentTime >= openTime && adjustedCurrentTime < closeTime) {
          // Currently open
          const minutesUntilClose = closeTime - adjustedCurrentTime;
          const closingSoon = minutesUntilClose <= 60; // Within 1 hour
          const closingTimeStr = `${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`;
          return { isOpen: true, closingSoon, closingTime: closingTimeStr, openingTime: null };
        } else if (adjustedCurrentTime < openTime) {
          // Not yet open
          const openingTimeStr = `${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}`;
          return { isOpen: false, closingSoon: false, closingTime: null, openingTime: openingTimeStr };
        }
      }
    }
  }

  return { isOpen: false, closingSoon: false, closingTime: null, openingTime: null };
}

// Helper function to parse opening hours into structured data
// Converts OSM format like "Mo-Th 07:00-23:00, Fr-Su 07:00-23:59" to array of {days, hours}
function parseOpeningHours(hours: unknown, language: 'id' | 'en'): Array<{days: string, hours: string, isClosed: boolean, originalDays: string}> {
  if (typeof hours !== 'string') {
    return [];
  }

  // unwanted boolean values as strings
  if (hours.toLowerCase() === 'true' || hours.toLowerCase() === 'false') {
    return [];
  }

  const dayMappings: Record<string, { id: string; en: string }> = {
    'Mo': { id: 'Senin', en: 'Monday' },
    'Tu': { id: 'Selasa', en: 'Tuesday' },
    'We': { id: 'Rabu', en: 'Wednesday' },
    'Th': { id: 'Kamis', en: 'Thursday' },
    'Fr': { id: 'Jumat', en: 'Friday' },
    'Sa': { id: 'Sabtu', en: 'Saturday' },
    'Su': { id: 'Minggu', en: 'Sunday' },
    'PH': { id: 'Hari Libur', en: 'Holidays' },
  };

  const closedText = language === 'id' ? 'Tutup' : 'Closed';
  
  // Split by semicolon or comma to get individual entries
  const entries = hours.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  
  return entries.map(entry => {
    let formatted = entry;
    
    // Replace day abbreviations
    Object.entries(dayMappings).forEach(([osm, names]) => {
      const regex = new RegExp(`\\b${osm}\\b`, 'g');
      formatted = formatted.replace(regex, names[language]);
    });
    
    // Check if closed
    const isClosed = /\b(off|tutup|closed)\b/i.test(formatted);
    
    if (isClosed) {
      // Extract day part before 'off' or 'Tutup'
      const dayMatch = formatted.match(/^([^\s]+(?:\s*-\s*[^\s]+)?)/);
      const dayText = dayMatch ? dayMatch[1].trim() : formatted;
      return {
        days: dayText,
        hours: closedText,
        isClosed: true,
        originalDays: entry.split(/\s+/)[0] // Store original for day matching
      };
    }
    
    // Split into day and time parts
    // Format: "Mon-Fri 08:00-22:00" or "Sat 09:00-21:00"
    const match = formatted.match(/^([^\d]+)\s+(.+)$/);
    
    if (match) {
      const timeWithWIB = match[2].trim() + ' WIB';
      return {
        days: match[1].trim(),
        hours: timeWithWIB,
        isClosed: false,
        originalDays: entry.split(/\s+/)[0] // Store original for day matching
      };
    }
    
    return {
      days: formatted,
      hours: '',
      isClosed: false,
      originalDays: entry.split(/\s+/)[0]
    };
  }).filter(entry => entry.days || entry.hours);
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
  onHeightChange,
  onShowRoute,
  isShowingRoute,
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Photo upload state
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [cafePhotos, setCafePhotos] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]); // Photos waiting for preview/confirm
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]); // Preview URLs for pending photos
  
  // Photo URL input state
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isValidatingPhotoUrl, setIsValidatingPhotoUrl] = useState(false);
  
  // Drag controls for bottom sheet swipe-to-close
  const dragControls = useDragControls();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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

  // Effect to trigger geocoding only if cafe doesn't have address
  useEffect(() => {
    if (!cafe || !isOpen) {
      return;
    }
    
    // Only fetch via reverse geocoding if cafe doesn't have address
    if (!cafe.address) {
      fetchAddress(cafe.id, cafe.lat, cafe.lon);
    }
  }, [cafe, isOpen, fetchAddress]);

  // Sync cafe photos
  useEffect(() => {
    if (cafe?.photos) {
      setCafePhotos(cafe.photos);
    } else {
      setCafePhotos([]);
    }
  }, [cafe]);

  // Handle file selection (for preview)
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setPendingPhotos(fileArray);
    
    // Create preview URLs
    const previewUrls = fileArray.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(previewUrls);
  }, []);

  // Cancel pending upload
  const handleCancelUpload = useCallback(() => {
    // Revoke preview URLs to free memory
    photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setPendingPhotos([]);
    setPhotoPreviewUrls([]);
  }, [photoPreviewUrls]);

  // Confirm and upload photos
  const handleConfirmUpload = useCallback(async () => {
    if (pendingPhotos.length === 0 || !cafe) return;
    
    setIsUploadingPhotos(true);
    setUploadProgress({ current: 0, total: pendingPhotos.length });
    
    try {
      const results = await uploadMultipleImages(
        pendingPhotos,
        'ruangkopi-user-photos',
        (current, total) => setUploadProgress({ current, total })
      );
      
      const newPhotoUrls: string[] = [];
      results.forEach((result: CloudinaryUploadResult) => {
        if (result.success && result.url) {
          newPhotoUrls.push(result.url);
        }
      });
      
      if (newPhotoUrls.length > 0) {
        const updatedPhotos = [...cafePhotos, ...newPhotoUrls];
        
        // Update cafe in database
        await updateCustomCafe(cafe.id, { photos: updatedPhotos });
        
        // Update local state
        setCafePhotos(updatedPhotos);
        
        // Show success toast
        setToastMessage(language === 'id' 
          ? `${newPhotoUrls.length} foto berhasil ditambahkan!` 
          : `${newPhotoUrls.length} photo(s) added successfully!`);
        setToastType('success');
        setShowToast(true);
      }
      
      // Clear pending photos
      handleCancelUpload();
    } catch (error) {
      console.error('Error uploading photos:', error);
      setToastMessage(language === 'id' ? 'Gagal mengupload foto' : 'Failed to upload photos');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUploadingPhotos(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [cafe, cafePhotos, language, pendingPhotos, handleCancelUpload]);

  // Add photo via URL (no upload needed)
  const handleAddPhotoUrl = useCallback(async () => {
    const url = photoUrlInput.trim();
    
    if (!url || !cafe) return;
    
    // Basic URL validation
    if (!url.match(/^https?:\/\/.+\..+/i)) {
      setToastMessage(language === 'id' ? 'URL tidak valid' : 'Invalid URL');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // Check if URL already exists
    if (cafePhotos.includes(url)) {
      setToastMessage(language === 'id' ? 'Foto ini sudah ada di galeri' : 'This photo is already in gallery');
      setToastType('warning');
      setShowToast(true);
      return;
    }

    setIsValidatingPhotoUrl(true);

    try {
      // Try to load image to validate it's a valid image URL
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Add to photos
      const updatedPhotos = [...cafePhotos, url];
      
      // Update cafe in database
      await updateCustomCafe(cafe.id, { photos: updatedPhotos });
      
      // Update local state
      setCafePhotos(updatedPhotos);
      setPhotoUrlInput('');
      
      // Show success toast
      setToastMessage(language === 'id' ? 'Foto berhasil ditambahkan!' : 'Photo added successfully!');
      setToastType('success');
      setShowToast(true);
    } catch {
      setToastMessage(language === 'id' ? 'Gagal memuat gambar dari URL' : 'Failed to load image from URL');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsValidatingPhotoUrl(false);
    }
  }, [photoUrlInput, cafe, cafePhotos, language]);

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

  // Determine the address to display - prioritize cafe's stored address first
  const displayAddress = cafe?.address || geocodedAddress;

  const t = {
    id: {
      directions: 'Rute',
      call: 'Telepon',
      website: 'Website',
      openingHours: 'Jam Buka',
      noAddress: 'Alamat tidak tersedia',
      loadingAddress: 'Memuat alamat...',
      fromYou: 'dari Anda',
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
      permanentlyClosed: 'Tutup Permanen',
      goodForWorking: 'Cocok WFC',
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
      permanentlyClosed: 'Permanently Closed',
      goodForWorking: 'WFC Friendly',
    },
  };

  const text = t[language];

  // Animation variants
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
          {/* Panel */}
          <motion.div
            variants={!isMobile ? desktopPanelVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            dragControls={dragControls}
            dragListener={false}
            onDragEnd={(_e, info) => {
              // Close if dragged down more than 100px or flicked down fast
              if (info.offset.y > 100 || info.velocity.y > 200) {
                onClose();
              }
            }}
            onAnimationComplete={() => {
              // Notify parent about the panel height for map adjustment
              if (isMobile && onHeightChange) {
                onHeightChange(window.innerHeight * 0.65);
              }
            }}
            className={`
              fixed z-[1002]
              /* Mobile: bottom sheet with max-height for map visibility */
              bottom-0 left-0 right-0
              max-h-[65vh] flex flex-col
              /* Mobile: only top corners rounded, bottom flat against screen edge */
              rounded-t-3xl
              /* Desktop: positioned on right, all corners rounded */
              md:bottom-6 md:top-auto md:left-auto md:right-6
              md:max-h-[calc(100vh-3rem)]
              md:w-96 md:rounded-t-2xl md:rounded-b-2xl
              ${isDarkMode
                ? 'bg-gray-900/95 text-white border-gray-700'
                : 'bg-white/95 text-gray-900 border-gray-200'
              }
              backdrop-blur-[1px] shadow-2xl border-t md:border overflow-hidden
            `}
          >
            {/* Drag Handle for Mobile */}
            <motion.div 
              className="md:hidden w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
            >
              <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </motion.div>

            {/* Panel Header - Fixed at top */}
            <div className={`
              flex-shrink-0
              ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'}
            `}>
              {/* Header Content */}
              <div className="flex items-start justify-between px-4 pb-2 pt-1 md:pt-4 gap-3">
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
                    {cafe.name.length > 10 ? (
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
                      <p className="text-sm text-primary-500 font-medium mt-0.5 flex items-start gap-1">
                        <Icon icon="mdi:map-marker-distance" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {formatDistance(distance)} {text.fromYou}
                      </p>
                    )}
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(cafe as unknown as { isPermanentlyClosed?: boolean }).isPermanentlyClosed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                          <Icon icon="mdi:store-off" className="w-3.5 h-3.5" />
                          {text.permanentlyClosed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Buttons - now part of flex layout, not absolute */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Report Issue button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowReportModal(true)}
                  className={`
                    p-2 rounded-full transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                    }
                  `}
                  aria-label={text.reportIssue}
                >
                  <Icon icon="mdi:flag-outline" className="w-5 h-5" />
                </motion.button>

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
                    flex
                    p-2 rounded-full transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}
                  `}
                  aria-label="Close details"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Photo Gallery Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="px-4 pt-2 pb-2"
              >
                {/* Gallery Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Icon icon="mdi:image-multiple" className="w-4 h-4 inline mr-1" />
                    {language === 'id' ? 'Galeri Foto' : 'Photo Gallery'} 
                    {cafePhotos.length > 0 && ` (${cafePhotos.length})`}
                  </span>
                </div>

                {/* Add Photo Tabs - Toggle between Upload and URL */}
                <div className="mb-3">
                  {/* Mode Toggle */}
                  <div className="flex gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('upload')}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors
                        ${photoInputMode === 'upload'
                          ? 'bg-primary-500 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }
                      `}
                    >
                      <Icon icon="mdi:upload" className="w-3.5 h-3.5" />
                      {language === 'id' ? 'Upload' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors
                        ${photoInputMode === 'url'
                          ? 'bg-primary-500 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }
                      `}
                    >
                      <Icon icon="mdi:link-variant" className="w-3.5 h-3.5" />
                      {language === 'id' ? 'Input URL' : 'Input URL'}
                    </button>
                  </div>

                  {/* Upload Mode */}
                  {photoInputMode === 'upload' && (
                    <label className={`
                      flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
                      ${pendingPhotos.length > 0 || isUploadingPhotos ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-100 hover:bg-gray-200'
                      }
                    `}>
                      <Icon icon="mdi:camera-plus" className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {language === 'id' ? 'Pilih atau seret foto' : 'Choose or drag photos'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleFileSelect(e.target.files);
                          e.target.value = ''; // Reset input
                        }}
                        disabled={isUploadingPhotos || pendingPhotos.length > 0}
                      />
                    </label>
                  )}

                  {/* URL Input Mode */}
                  {photoInputMode === 'url' && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPhotoUrl();
                          }
                        }}
                        placeholder={language === 'id' ? 'Paste URL gambar...' : 'Paste image URL...'}
                        disabled={isValidatingPhotoUrl}
                        className={`
                          flex-1 px-3 py-2 rounded-xl border-2 text-sm transition-all
                          ${isDarkMode 
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                          }
                          focus:outline-none focus:ring-2 focus:ring-primary-500/50
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        disabled={isValidatingPhotoUrl || !photoUrlInput.trim()}
                        className={`
                          px-3 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl 
                          text-sm font-medium transition-colors flex items-center gap-1.5
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {isValidatingPhotoUrl ? (
                          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon icon="mdi:plus" className="w-4 h-4" />
                        )}
                        {language === 'id' ? 'Tambah' : 'Add'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo Preview Section */}
                {photoPreviewUrls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}
                  >
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {language === 'id' ? 'Preview Foto' : 'Photo Preview'} ({photoPreviewUrls.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {photoPreviewUrls.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelUpload}
                        disabled={isUploadingPhotos}
                        className={`
                          flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }
                          disabled:opacity-50
                        `}
                      >
                        <Icon icon="mdi:close" className="w-4 h-4 inline mr-1" />
                        {language === 'id' ? 'Batal' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleConfirmUpload}
                        disabled={isUploadingPhotos}
                        className={`
                          flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                          bg-primary-500 text-white hover:bg-primary-400
                          disabled:opacity-50
                        `}
                      >
                        {isUploadingPhotos ? (
                          <>
                            <Icon icon="mdi:loading" className="w-4 h-4 inline mr-1 animate-spin" />
                            {uploadProgress.total > 0 ? `${uploadProgress.current}/${uploadProgress.total}` : '...'}
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:upload" className="w-4 h-4 inline mr-1" />
                            {language === 'id' ? 'Unggah' : 'Upload'}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Upload Progress (when uploading) */}
                {isUploadingPhotos && photoPreviewUrls.length === 0 && (
                  <div className={`mb-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-primary-500" />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {language === 'id' ? 'Mengupload foto...' : 'Uploading photos...'}
                        {uploadProgress.total > 0 && ` (${uploadProgress.current}/${uploadProgress.total})`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: uploadProgress.total > 0 ? `${(uploadProgress.current / uploadProgress.total) * 100}%` : '50%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Photo Gallery */}
                {cafePhotos.length > 0 ? (
                  <PhotoGallery photos={cafePhotos} cafeName={cafe.name} />
                ) : (
                  <div className={`
                    text-center py-8 rounded-xl border-2 border-dashed
                    ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}
                  `}>
                    <Icon icon="mdi:image-off-outline" className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {language === 'id' ? 'Belum ada foto' : 'No photos yet'}
                    </p>
                    <p className="text-xs mt-1 opacity-75">
                      {language === 'id' ? 'Jadilah yang pertama menambahkan foto!' : 'Be the first to add a photo!'}
                    </p>
                  </div>
                )}
              </motion.div>

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
                const parsedHours = isValidHours ? parseOpeningHours(hours, language) : [];
                
                // Also check instagram field - sometimes opening hours end up there
                const cafeData = cafe as unknown as Record<string, unknown>;
                const instagramValue = cafeData.instagram;
                const isInstagramActuallyHours = instagramValue && typeof instagramValue === 'string' && 
                  (instagramValue.includes(':') || instagramValue.match(/\d{1,2}[:.,-]\d{2}/));
                
                const displayHours = parsedHours.length > 0 ? parsedHours : (isInstagramActuallyHours ? parseOpeningHours(instagramValue, language) : []);
                
                // Get current opening status
                const hoursData = hours && typeof hours === 'string' ? hours : (isInstagramActuallyHours && typeof instagramValue === 'string' ? instagramValue : '');
                const status = getCurrentOpeningStatus(hoursData);
                
                // Get current day for highlighting
                const today = new Date();
                const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const dayAbbreviations = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                const currentDayAbbr = dayAbbreviations[currentDayIndex];
                
                // Function to check if entry matches current day
                const isToday = (originalDays: string) => {
                  // Handle single day: Mo, Tu, etc.
                  if (originalDays === currentDayAbbr) return true;
                  
                  // Handle range: Mo-Fr
                  const rangeMatch = originalDays.match(/^([A-Z][a-z])-([A-Z][a-z])$/);
                  if (rangeMatch) {
                    const startDay = dayAbbreviations.indexOf(rangeMatch[1]);
                    const endDay = dayAbbreviations.indexOf(rangeMatch[2]);
                    if (startDay <= endDay) {
                      return currentDayIndex >= startDay && currentDayIndex <= endDay;
                    } else {
                      // Handle wrap-around like Fr-Mo
                      return currentDayIndex >= startDay || currentDayIndex <= endDay;
                    }
                  }
                  
                  return false;
                };
                
                return displayHours.length > 0 ? (
                  <motion.div 
                    custom={1}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-sm"
                  >
                    <div className={`flex items-center gap-2 mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Icon icon="mdi:clock-outline" className="w-5 h-5 flex-shrink-0 text-primary-500" />
                      <span className="font-semibold">{text.openingHours}</span>
                      {status.isOpen && status.closingSoon && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDarkMode 
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                          {language === 'id' ? `Tutup ${status.closingTime} WIB` : `Closes ${status.closingTime}`}
                        </span>
                      )}
                      {status.isOpen && !status.closingSoon && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDarkMode 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {language === 'id' ? 'Buka' : 'Open'}
                        </span>
                      )}
                      {!status.isOpen && status.openingTime && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDarkMode 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {language === 'id' ? `Buka ${status.openingTime} WIB` : `Opens ${status.openingTime}`}
                        </span>
                      )}
                      {!status.isOpen && !status.openingTime && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDarkMode 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {language === 'id' ? 'Tutup' : 'Closed'}
                        </span>
                      )}
                    </div>
                    <div className={`
                      ml-7 rounded-xl overflow-hidden
                      ${isDarkMode 
                        ? 'bg-gray-800/50 border border-gray-700' 
                        : 'bg-amber-50/50 border border-amber-100'
                      }
                    `}>
                      {displayHours.map((entry, index) => {
                        const isTodayEntry = isToday(entry.originalDays);
                        return (
                          <div 
                            key={index}
                            className={`
                              flex items-center justify-between px-3 py-2 transition-colors
                              ${index > 0 ? (isDarkMode ? 'border-t border-gray-700' : 'border-t border-amber-100') : ''}
                              ${isTodayEntry ? (isDarkMode ? 'bg-primary-500/20' : 'bg-primary-100') : ''}
                            `}
                          >
                            <span className={`font-medium ${isTodayEntry ? 'text-primary-500 font-bold' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                              {entry.days}
                            </span>
                            <span className={`
                              font-mono text-sm
                              ${entry.isClosed 
                                ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                                : isTodayEntry
                                  ? 'text-primary-600 font-semibold'
                                  : (isDarkMode ? 'text-primary-400' : 'text-primary-600')
                              }
                            `}>
                              {entry.hours}
                            </span>
                          </div>
                        );
                      })}
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
                  <a 
                    href={`tel:${cafe.phone}`} 
                    className={`
                      hover:text-primary-500 transition-colors underline decoration-dotted underline-offset-2
                      ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}
                    `}
                  >
                    {(() => {
                      // Ensure phone is a string
                      const phoneStr = typeof cafe.phone === 'string' ? cafe.phone : String(cafe.phone);
                      
                      // Format phone number with +62 and dashes
                      let phone = phoneStr.replace(/\D/g, ''); // Remove non-digits
                      
                      // Handle Indonesian numbers
                      if (phone.startsWith('62')) {
                        phone = phone.substring(2);
                      } else if (phone.startsWith('0')) {
                        phone = phone.substring(1);
                      }
                      
                      // Format: +62 812-3456-7890
                      if (phone.length >= 9) {
                        const part1 = phone.substring(0, 3);
                        const part2 = phone.substring(3, 7);
                        const part3 = phone.substring(7);
                        return `+62 ${part1}-${part2}-${part3}`;
                      }
                      
                      return phoneStr;
                    })()}
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
                      className={`
                        hover:text-primary-500 transition-colors underline decoration-dotted underline-offset-2
                        ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}
                      `}
                    >
                      {instagramValue!.replace('@', '')}
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
              {(cafe.hasWifi || cafe.hasOutdoorSeating || cafe.hasTakeaway || cafe.hasAirConditioning || (cafe.smokingPolicy && typeof cafe.smokingPolicy === 'string' && ['yes', 'no', 'outside', 'separated'].includes(cafe.smokingPolicy.toLowerCase()))) && (
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

                    {/* Good for Working */}
                    {(cafe as unknown as { goodForWorking?: boolean }).goodForWorking && (
                      <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDarkMode 
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }
                      `}>
                        <Icon icon="mdi:laptop" className="w-3.5 h-3.5" />
                        {text.goodForWorking}
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
            </div>

            {/* Action buttons - Fixed at bottom */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`
                flex-shrink-0 p-4 border-t
                md:rounded-b-2xl
                ${isDarkMode ? 'border-gray-700 bg-gray-900/95' : 'border-gray-200 bg-white/95'}
              `}
            >
              {/* Primary action - Route button (full width when available) */}
              {userLocation && onShowRoute && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onShowRoute(cafe)}
                  className={`
                    w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                    font-medium transition-colors mb-2
                    ${isShowingRoute
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }
                  `}
                >
                  <Icon icon={isShowingRoute ? "mdi:map-marker-path" : "mdi:routes"} className="w-5 h-5" />
                  <span>
                    {isShowingRoute 
                      ? (language === 'id' ? 'Lihat Rute' : 'View Route')
                      : (language === 'id' ? 'Tampilkan Rute di Peta' : 'Show Route on Map')
                    }
                  </span>
                </motion.button>
              )}

              {/* Secondary actions row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Google Maps button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetDirections}
                  className={`
                    flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                    text-sm font-medium transition-colors
                    ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                  `}
                >
                  <Icon icon="mdi:google-maps" className="w-4 h-4" />
                  <span>Google Maps</span>
                </motion.button>

                {/* Website button */}
                {cafe.website ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={cafe.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                      text-sm font-medium transition-colors
                      ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                    `}
                  >
                    <Icon icon="mdi:web" className="w-4 h-4" />
                    {text.website}
                  </motion.a>
                ) : cafe.phone ? (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`tel:${cafe.phone}`}
                    className={`
                      flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                      text-sm font-medium transition-colors
                      ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                    `}
                  >
                    <Icon icon="mdi:phone" className="w-4 h-4" />
                    {text.call}
                  </motion.a>
                ) : (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://www.google.com/maps/search/?api=1&query=${cafe.lat},${cafe.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                      text-sm font-medium transition-colors
                      ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                    `}
                  >
                    <Icon icon="mdi:share-variant" className="w-4 h-4" />
                    {language === 'id' ? 'Bagikan' : 'Share'}
                  </motion.a>
                )}
              </div>

              {/* Menu link - separate row if exists */}
              {cafe.menuUrl && (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={cafe.menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl mt-2
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
