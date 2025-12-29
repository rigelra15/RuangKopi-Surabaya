import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { addCustomCafe, type CustomCafeFormData } from '../services/customCafeService';
import { reverseGeocode } from '../services/cafeService';
import ImageUpload from './ImageUpload';
import LogoUpload from './LogoUpload';

interface AddCafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
  userLocation?: { lat: number; lon: number } | null;
  onSuccess?: () => void;
}

export default function AddCafeModal({
  isOpen,
  onClose,
  isDarkMode,
  language,
  userLocation,
  onSuccess,
}: AddCafeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Opening hours per day state - supports multiple time slots per day
  type TimeSlot = { open: string; close: string };
  type DaySchedule = { isOpen: boolean; slots: TimeSlot[] };
  const [openingHoursData, setOpeningHoursData] = useState<{
    [key: string]: DaySchedule;
  }>({
    mon: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    tue: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    wed: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    thu: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    fri: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    sat: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
    sun: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
  });

  // Form state
  const [formData, setFormData] = useState<CustomCafeFormData>({
    name: '',
    lat: userLocation?.lat || -7.2575,
    lon: userLocation?.lon || 112.7521,
    address: '',
    phone: '',
    website: '',
    instagram: '',
    openingHours: '',
    hasWifi: false,
    wifiFree: false,
    hasOutdoorSeating: false,
    smokingPolicy: '',
    hasTakeaway: false,
    hasAirConditioning: false,
    goodForWorking: false,
    priceRange: 'medium',
    description: '',
    logo: undefined,
    photos: [],
  });

  // Translations
  const t = {
    title: language === 'id' ? 'Tambah Tempat Kopi' : 'Add Coffee Place',
    subtitle: language === 'id' 
      ? 'Bantu kami menambahkan tempat kopi favorit Anda!' 
      : 'Help us add your favorite coffee place!',
    step1: language === 'id' ? 'Info Dasar' : 'Basic Info',
    step2: language === 'id' ? 'Lokasi' : 'Location',
    step3: language === 'id' ? 'Fasilitas' : 'Amenities',
    name: language === 'id' ? 'Nama Tempat' : 'Place Name',
    namePlaceholder: language === 'id' ? 'Contoh: Kopi Kenangan' : 'Example: Starbucks',
    description: language === 'id' ? 'Deskripsi (opsional)' : 'Description (optional)',
    descriptionPlaceholder: language === 'id' 
      ? 'Ceritakan tentang tempat ini...' 
      : 'Tell us about this place...',
    address: language === 'id' ? 'Alamat' : 'Address',
    addressPlaceholder: language === 'id' ? 'Jl. Contoh No. 123' : '123 Example Street',
    latitude: language === 'id' ? 'Latitude' : 'Latitude',
    longitude: language === 'id' ? 'Longitude' : 'Longitude',
    useMyLocation: language === 'id' ? 'Gunakan Lokasi Saya' : 'Use My Location',
    phone: language === 'id' ? 'Nomor Telepon' : 'Phone Number',
    phonePlaceholder: language === 'id' ? '812 3456 7890' : '812 3456 7890',
    website: language === 'id' ? 'Website / Link Menu' : 'Website / Menu Link',
    websitePlaceholder: language === 'id' ? 'Masukkan link website atau menu' : 'Enter website or menu link',
    instagram: 'Instagram',
    instagramPlaceholder: language === 'id' ? 'username' : 'username',
    openingHours: language === 'id' ? 'Jam Buka' : 'Opening Hours',
    openingHoursPlaceholder: language === 'id' ? '08:00 - 22:00' : '8:00 AM - 10:00 PM',
    amenities: language === 'id' ? 'Fasilitas' : 'Amenities',
    hasWifi: language === 'id' ? 'WiFi' : 'WiFi',
    wifiFree: language === 'id' ? 'WiFi Gratis' : 'Free WiFi',
    hasOutdoorSeating: language === 'id' ? 'Outdoor Seating' : 'Outdoor Seating',
    hasTakeaway: language === 'id' ? 'Takeaway' : 'Takeaway',
    hasAC: language === 'id' ? 'AC' : 'Air Conditioning',
    goodForWorking: language === 'id' ? 'Cocok untuk WFC/Laptop' : 'Good for Working/Laptop',
    smokingPolicy: language === 'id' ? 'Kebijakan Merokok (opsional)' : 'Smoking Policy (optional)',
    smokingNone: language === 'id' ? 'Tidak diisi' : 'Not specified',
    smokingNo: language === 'id' ? 'Dilarang' : 'No Smoking',
    smokingYes: language === 'id' ? 'Boleh' : 'Allowed',
    smokingOutside: language === 'id' ? 'Hanya di Luar' : 'Outside Only',
    smokingSeparated: language === 'id' ? 'Area Terpisah' : 'Separated Area',
    priceRange: language === 'id' ? 'Kisaran Harga' : 'Price Range',
    priceLow: language === 'id' ? 'Murah (< 25rb)' : 'Low (< $2)',
    priceMedium: language === 'id' ? 'Sedang (25-50rb)' : 'Medium ($2-5)',
    priceHigh: language === 'id' ? 'Mahal (> 50rb)' : 'High (> $5)',
    next: language === 'id' ? 'Selanjutnya' : 'Next',
    back: language === 'id' ? 'Kembali' : 'Back',
    submit: language === 'id' ? 'Kirim' : 'Submit',
    submitting: language === 'id' ? 'Mengirim...' : 'Submitting...',
    success: language === 'id' 
      ? 'Berhasil dikirim! Tempat kopi akan ditinjau oleh admin terlebih dahulu sebelum ditampilkan di peta.' 
      : 'Submitted! The coffee place will be reviewed by admin before appearing on the map.',
    error: language === 'id' 
      ? 'Gagal menambahkan. Silakan coba lagi.' 
      : 'Failed to add. Please try again.',
    required: language === 'id' ? 'Wajib diisi' : 'Required',
    close: language === 'id' ? 'Tutup' : 'Close',
    gettingAddress: language === 'id' ? 'Mencari alamat...' : 'Getting address...',
    // Days of week
    monday: language === 'id' ? 'Senin' : 'Monday',
    tuesday: language === 'id' ? 'Selasa' : 'Tuesday',
    wednesday: language === 'id' ? 'Rabu' : 'Wednesday',
    thursday: language === 'id' ? 'Kamis' : 'Thursday',
    friday: language === 'id' ? 'Jumat' : 'Friday',
    saturday: language === 'id' ? 'Sabtu' : 'Saturday',
    sunday: language === 'id' ? 'Minggu' : 'Sunday',
    closed: language === 'id' ? 'Tutup' : 'Closed',
    open: language === 'id' ? 'Buka' : 'Open',
    applyToAll: language === 'id' ? 'Terapkan ke semua hari' : 'Apply to all days',
    logo: language === 'id' ? 'Logo Cafe' : 'Cafe Logo',
    logoHint: language === 'id' ? 'Upload logo cafe (opsional)' : 'Upload cafe logo (optional)',
    photos: language === 'id' ? 'Foto-foto' : 'Photos',
    photosHint: language === 'id' ? 'Tambahkan foto cafe (opsional)' : 'Add cafe photos (optional)',
    step4: language === 'id' ? 'Media' : 'Media',
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        lat: userLocation?.lat || -7.2575,
        lon: userLocation?.lon || 112.7521,
        address: '',
        phone: '',
        website: '',
        instagram: '',
        openingHours: '',
        hasWifi: false,
        wifiFree: false,
        hasOutdoorSeating: false,
        smokingPolicy: '',
        hasTakeaway: false,
        hasAirConditioning: false,
        goodForWorking: false,
        priceRange: 'medium',
        description: '',
        logo: undefined,
        photos: [],
      });
      setOpeningHoursData({
        mon: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        tue: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        wed: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        thu: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        fri: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        sat: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
        sun: { isOpen: true, slots: [{ open: '08:00', close: '22:00' }] },
      });
      setCurrentStep(1);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, userLocation]);

  const handleUseMyLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      setFormData(prev => ({ ...prev, lat: latitude, lon: longitude }));

      // Try to get address from coordinates
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        setFormData(prev => ({ ...prev, address }));
      }
    } catch (err) {
      console.error('Error getting location:', err);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // Format opening hours data to OSM format (e.g., "Mo 06:00-10:00,16:00-21:00; Tu-Fr 08:00-22:00")
  const formatOpeningHoursToOSM = useCallback(() => {
    const dayMap: { [key: string]: string } = {
      mon: 'Mo',
      tue: 'Tu',
      wed: 'We',
      thu: 'Th',
      fri: 'Fr',
      sat: 'Sa',
      sun: 'Su',
    };

    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const parts: string[] = [];
    
    // Helper to format slots for a day
    const formatSlots = (slots: { open: string; close: string }[]) => {
      return slots.map(slot => `${slot.open}-${slot.close}`).join(',');
    };
    
    // Helper to compare slots between two days
    const slotsEqual = (slots1: { open: string; close: string }[], slots2: { open: string; close: string }[]) => {
      if (slots1.length !== slots2.length) return false;
      return slots1.every((slot, idx) => 
        slot.open === slots2[idx].open && slot.close === slots2[idx].close
      );
    };
    
    let i = 0;
    while (i < dayOrder.length) {
      const day = dayOrder[i];
      const data = openingHoursData[day];
      
      if (!data.isOpen) {
        // Closed day
        parts.push(`${dayMap[day]} off`);
        i++;
        continue;
      }
      
      // Find consecutive days with same hours
      let j = i + 1;
      while (j < dayOrder.length) {
        const nextDay = dayOrder[j];
        const nextData = openingHoursData[nextDay];
        if (nextData.isOpen && slotsEqual(nextData.slots, data.slots)) {
          j++;
        } else {
          break;
        }
      }
      
      const startDay = dayMap[dayOrder[i]];
      const endDay = dayMap[dayOrder[j - 1]];
      const hours = formatSlots(data.slots);
      
      if (i === j - 1) {
        parts.push(`${startDay} ${hours}`);
      } else {
        parts.push(`${startDay}-${endDay} ${hours}`);
      }
      
      i = j;
    }
    
    return parts.join('; ');
  }, [openingHoursData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError(t.required);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format opening hours before submitting
      const openingHoursFormatted = formatOpeningHoursToOSM();
      const dataToSubmit = {
        ...formData,
        openingHours: openingHoursFormatted,
        status: 'pending', // New submissions need admin approval
      };
      
      await addCustomCafe(dataToSubmit);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting cafe:', err);
      setError(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCheckboxChange = (name: keyof CustomCafeFormData) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    },
  };

  const inputClass = `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500/50
    ${isDarkMode 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
    }
  `;

  const labelClass = `
    block text-sm font-medium mb-2
    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
  `;

  const checkboxClass = `
    flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
    ${isDarkMode 
      ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
    }
  `;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          {t.name} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t.namePlaceholder}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>{t.description}</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder={t.descriptionPlaceholder}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.phone}</label>
          <div className="relative">
            <span className={`
              absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium
              ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            `}>+62</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                // Remove non-digits, then strip leading 0 or 62
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('62')) {
                  value = value.substring(2);
                } else if (value.startsWith('0')) {
                  value = value.substring(1);
                }
                setFormData(prev => ({ ...prev, phone: value }));
              }}
              placeholder={t.phonePlaceholder}
              className={`${inputClass} pl-12`}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.instagram}</label>
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={(e) => {
              // Remove @ symbol if user tries to input it
              const value = e.target.value.replace(/@/g, '');
              setFormData(prev => ({ ...prev, instagram: value }));
            }}
            placeholder={t.instagramPlaceholder}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.website}</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder={t.websitePlaceholder}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t.openingHours}</label>
        
        {/* Apply to all button */}
        <button
          type="button"
          onClick={() => {
            const firstDay = openingHoursData.mon;
            // Deep copy slots to avoid shared reference
            const copyDay = () => ({
              isOpen: firstDay.isOpen,
              slots: firstDay.slots.map(slot => ({ ...slot }))
            });
            setOpeningHoursData({
              mon: firstDay,
              tue: copyDay(),
              wed: copyDay(),
              thu: copyDay(),
              fri: copyDay(),
              sat: copyDay(),
              sun: copyDay(),
            });
          }}
          className={`
            mb-3 text-xs px-3 py-1.5 rounded-lg transition-colors
            ${isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }
          `}
        >
          <Icon icon="mdi:content-copy" className="w-3 h-3 inline mr-1" />
          {t.applyToAll}
        </button>

        {/* Days grid */}
        <div className={`
          rounded-xl border overflow-hidden
          ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}
        `}>
          {[
            { key: 'mon', label: t.monday },
            { key: 'tue', label: t.tuesday },
            { key: 'wed', label: t.wednesday },
            { key: 'thu', label: t.thursday },
            { key: 'fri', label: t.friday },
            { key: 'sat', label: t.saturday },
            { key: 'sun', label: t.sunday },
          ].map((day, index) => (
            <div 
              key={day.key}
              className={`
                px-3 py-2
                ${index !== 0 ? (isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200') : ''}
              `}
            >
              <div className="flex items-center gap-2">
                {/* Day name */}
                <span className={`
                  w-12 text-sm font-medium
                  ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                `}>
                  {day.label.slice(0, 3)}
                </span>

                {/* Toggle open/closed */}
                <button
                  type="button"
                  onClick={() => {
                    setOpeningHoursData(prev => ({
                      ...prev,
                      [day.key]: { ...prev[day.key], isOpen: !prev[day.key].isOpen }
                    }));
                  }}
                  className={`
                    px-2 py-1 rounded-lg text-xs font-medium transition-colors
                    ${openingHoursData[day.key].isOpen
                      ? 'bg-green-500/20 text-green-500'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {openingHoursData[day.key].isOpen ? t.open : t.closed}
                </button>

                {/* Add slot button */}
                {openingHoursData[day.key].isOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpeningHoursData(prev => ({
                        ...prev,
                        [day.key]: {
                          ...prev[day.key],
                          slots: [...prev[day.key].slots, { open: '12:00', close: '18:00' }]
                        }
                      }));
                    }}
                    className={`
                      px-1.5 py-0.5 rounded text-xs transition-colors
                      ${isDarkMode 
                        ? 'bg-primary-600/30 text-primary-400 hover:bg-primary-600/50' 
                        : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }
                    `}
                    title={language === 'id' ? 'Tambah jam' : 'Add time slot'}
                  >
                    <Icon icon="mdi:plus" className="w-3 h-3" />
                  </button>
                )}

                {/* Closed badge */}
                {!openingHoursData[day.key].isOpen && (
                  <span className={`
                    ml-auto text-xs
                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                  `}>
                    —
                  </span>
                )}
              </div>

              {/* Time slots */}
              {openingHoursData[day.key].isOpen && (
                <div className="mt-1.5 ml-14 space-y-1">
                  {openingHoursData[day.key].slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={slot.open}
                        onChange={(e) => {
                          setOpeningHoursData(prev => {
                            const newSlots = [...prev[day.key].slots];
                            newSlots[slotIndex] = { ...newSlots[slotIndex], open: e.target.value };
                            return {
                              ...prev,
                              [day.key]: { ...prev[day.key], slots: newSlots }
                            };
                          });
                        }}
                        className={`
                          px-2 py-1 rounded-lg text-xs border transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                          }
                          focus:outline-none focus:ring-1 focus:ring-primary-500
                        `}
                      />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                      <input
                        type="time"
                        value={slot.close}
                        onChange={(e) => {
                          setOpeningHoursData(prev => {
                            const newSlots = [...prev[day.key].slots];
                            newSlots[slotIndex] = { ...newSlots[slotIndex], close: e.target.value };
                            return {
                              ...prev,
                              [day.key]: { ...prev[day.key], slots: newSlots }
                            };
                          });
                        }}
                        className={`
                          px-2 py-1 rounded-lg text-xs border transition-colors
                          ${isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                          }
                          focus:outline-none focus:ring-1 focus:ring-primary-500
                        `}
                      />
                      {/* Remove slot button - only show if more than 1 slot */}
                      {openingHoursData[day.key].slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpeningHoursData(prev => ({
                              ...prev,
                              [day.key]: {
                                ...prev[day.key],
                                slots: prev[day.key].slots.filter((_, i) => i !== slotIndex)
                              }
                            }));
                          }}
                          className={`
                            p-0.5 rounded transition-colors
                            ${isDarkMode 
                              ? 'text-red-400 hover:bg-red-500/20' 
                              : 'text-red-500 hover:bg-red-100'
                            }
                          `}
                          title={language === 'id' ? 'Hapus jam' : 'Remove time slot'}
                        >
                          <Icon icon="mdi:close" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>{t.address}</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder={t.addressPlaceholder}
          className={inputClass}
        />
        {/* Button to get address from coordinates */}
        <button
          type="button"
          onClick={async () => {
            setIsGettingLocation(true);
            try {
              const address = await reverseGeocode(formData.lat, formData.lon);
              if (address) {
                setFormData(prev => ({ ...prev, address }));
              }
            } catch (err) {
              console.error('Error getting address:', err);
            } finally {
              setIsGettingLocation(false);
            }
          }}
          disabled={isGettingLocation}
          className={`
            mt-2 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1
            ${isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Icon 
            icon={isGettingLocation ? 'mdi:loading' : 'mdi:map-search'} 
            className={`w-3 h-3 ${isGettingLocation ? 'animate-spin' : ''}`} 
          />
          {language === 'id' ? 'Ambil Alamat dari Koordinat' : 'Get Address from Coordinates'}
        </button>
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={isGettingLocation}
        className={`
          w-full flex items-center justify-center gap-2 p-4 rounded-xl
          transition-all duration-200 font-medium
          ${isDarkMode 
            ? 'bg-primary-600 hover:bg-primary-500 text-white' 
            : 'bg-primary-500 hover:bg-primary-400 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <Icon 
          icon={isGettingLocation ? 'mdi:loading' : 'mdi:crosshairs-gps'} 
          className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} 
        />
        {isGettingLocation ? t.gettingAddress : t.useMyLocation}
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.latitude}</label>
          <input
            type="number"
            name="lat"
            value={formData.lat}
            onChange={handleInputChange}
            step="0.0001"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t.longitude}</label>
          <input
            type="number"
            name="lon"
            value={formData.lon}
            onChange={handleInputChange}
            step="0.0001"
            className={inputClass}
          />
        </div>
      </div>

      {/* Mini map preview would be nice here */}
      <div className={`
        p-4 rounded-xl text-center text-sm
        ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}
      `}>
        <Icon icon="mdi:map-marker" className="w-8 h-8 mx-auto mb-2 text-primary-500" />
        <p>📍 {formData.lat.toFixed(4)}, {formData.lon.toFixed(4)}</p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>{t.priceRange}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as const).map(price => (
            <button
              key={price}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priceRange: price }))}
              className={`
                p-3 rounded-xl text-sm font-medium transition-all duration-200
                ${formData.priceRange === price
                  ? 'bg-primary-500 text-white'
                  : isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {price === 'low' ? t.priceLow : price === 'medium' ? t.priceMedium : t.priceHigh}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.amenities}</label>
        <div className="grid grid-cols-2 gap-3">
          <div 
            className={checkboxClass}
            onClick={() => handleCheckboxChange('hasWifi')}
          >
            <Icon 
              icon={formData.hasWifi ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
              className={`w-5 h-5 ${formData.hasWifi ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.hasWifi}</span>
          </div>

          {formData.hasWifi && (
            <div 
              className={checkboxClass}
              onClick={() => handleCheckboxChange('wifiFree')}
            >
              <Icon 
                icon={formData.wifiFree ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
                className={`w-5 h-5 ${formData.wifiFree ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.wifiFree}</span>
            </div>
          )}

          <div 
            className={checkboxClass}
            onClick={() => handleCheckboxChange('hasOutdoorSeating')}
          >
            <Icon 
              icon={formData.hasOutdoorSeating ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
              className={`w-5 h-5 ${formData.hasOutdoorSeating ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.hasOutdoorSeating}</span>
          </div>

          <div 
            className={checkboxClass}
            onClick={() => handleCheckboxChange('hasTakeaway')}
          >
            <Icon 
              icon={formData.hasTakeaway ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
              className={`w-5 h-5 ${formData.hasTakeaway ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.hasTakeaway}</span>
          </div>

          <div 
            className={checkboxClass}
            onClick={() => handleCheckboxChange('hasAirConditioning')}
          >
            <Icon 
              icon={formData.hasAirConditioning ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
              className={`w-5 h-5 ${formData.hasAirConditioning ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.hasAC}</span>
          </div>

          <div 
            className={checkboxClass}
            onClick={() => handleCheckboxChange('goodForWorking')}
          >
            <Icon 
              icon={formData.goodForWorking ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'} 
              className={`w-5 h-5 ${formData.goodForWorking ? 'text-primary-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{t.goodForWorking}</span>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.smokingPolicy}</label>
        <select
          name="smokingPolicy"
          value={formData.smokingPolicy}
          onChange={handleInputChange}
          className={inputClass}
        >
          <option value="">{t.smokingNone}</option>
          <option value="no">{t.smokingNo}</option>
          <option value="yes">{t.smokingYes}</option>
          <option value="outside">{t.smokingOutside}</option>
          <option value="separated">{t.smokingSeparated}</option>
        </select>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={`
              relative w-full max-w-lg max-h-[90vh] overflow-hidden
              rounded-3xl shadow-2xl
              ${isDarkMode ? 'bg-gray-900' : 'bg-white'}
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className={`
              sticky top-0 z-10 px-6 py-4 border-b
              ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
            `}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t.title}
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.subtitle}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`
                    p-2 rounded-xl transition-colors
                    ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                  `}
                >
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    className={`
                      flex-1 h-2 rounded-full transition-all duration-300
                      ${currentStep >= step 
                        ? 'bg-primary-500' 
                        : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }
                    `}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className={currentStep >= 1 ? 'text-primary-500 font-medium' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                  {t.step1}
                </span>
                <span className={currentStep >= 2 ? 'text-primary-500 font-medium' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                  {t.step2}
                </span>
                <span className={currentStep >= 3 ? 'text-primary-500 font-medium' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                  {t.step3}
                </span>
                <span className={currentStep >= 4 ? 'text-primary-500 font-medium' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                  {t.step4}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {success ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:check-circle" className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t.success}
                  </p>
                </div>
              ) : (
                <>
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      {/* Logo Upload */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t.logo}
                        </label>
                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t.logoHint}
                        </p>
                        <LogoUpload
                          logo={formData.logo || null}
                          onLogoChange={(url) => setFormData(prev => ({ ...prev, logo: url || undefined }))}
                        />
                      </div>

                      {/* Photos Upload */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t.photos}
                        </label>
                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t.photosHint}
                        </p>
                        <ImageUpload
                          images={formData.photos || []}
                          onImagesChange={(urls) => setFormData(prev => ({ ...prev, photos: urls }))}
                          maxImages={5}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className={`
                sticky bottom-0 px-6 py-4 border-t flex gap-3
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
              `}>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className={`
                      flex-1 py-3 px-4 rounded-xl font-medium transition-colors
                      ${isDarkMode 
                        ? 'bg-gray-800 text-white hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {t.back}
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={currentStep === 1 && !formData.name.trim()}
                    className={`
                      flex-1 py-3 px-4 rounded-xl font-medium transition-colors
                      bg-primary-500 text-white hover:bg-primary-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {t.next}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`
                      flex-1 py-3 px-4 rounded-xl font-medium transition-colors
                      bg-primary-500 text-white hover:bg-primary-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    `}
                  >
                    {isSubmitting && <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />}
                    {isSubmitting ? t.submitting : t.submit}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
