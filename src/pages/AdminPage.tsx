import { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  getCustomCafes,
  deleteCustomCafe,
  updateCustomCafe,
  addCustomCafe,
  getIssueReports,
  getCafeOverrides,
  saveCafeOverride,
  deleteCafeOverride,
  bulkAddCafes,
  type CustomCafe,
  type CustomCafeFormData,
  type IssueReportData,
  type CafeOverrideData,
} from "../services/customCafeService";
import { searchCafes, reverseGeocode, type Cafe } from "../services/cafeService";
import ImageUpload from "../components/ImageUpload";
import LogoUpload from "../components/LogoUpload";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

// Custom marker icon
const customMarkerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click handler component
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map center updater component
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Override Edit Modal Component
interface OverrideEditModalProps {
  cafe: Cafe;
  existingOverride?: CafeOverrideData;
  onClose: () => void;
  onSave: (data: Partial<CafeOverrideData>) => void;
}

function OverrideEditModal({
  cafe,
  existingOverride,
  onClose,
  onSave,
}: OverrideEditModalProps) {
  const [formData, setFormData] = useState({
    name: existingOverride?.name || "",
    address: existingOverride?.address || "",
    phone: existingOverride?.phone || "",
    website: existingOverride?.website || "",
    instagram: existingOverride?.instagram || "",
    openingHours: existingOverride?.openingHours || "",
    menuUrl: existingOverride?.menuUrl || "",
    description: existingOverride?.description || "",
    hasWifi: existingOverride?.hasWifi ?? cafe.hasWifi ?? false,
    wifiFree: existingOverride?.wifiFree ?? cafe.wifiFree ?? false,
    hasOutdoorSeating: existingOverride?.hasOutdoorSeating ?? cafe.hasOutdoorSeating ?? false,
    hasTakeaway: existingOverride?.hasTakeaway ?? cafe.hasTakeaway ?? false,
    hasAirConditioning: existingOverride?.hasAirConditioning ?? cafe.hasAirConditioning ?? false,
    smokingPolicy: existingOverride?.smokingPolicy || "",
    priceRange: existingOverride?.priceRange || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const handleFetchAddress = async () => {
    setIsFetchingAddress(true);
    try {
      const address = await reverseGeocode(cafe.lat, cafe.lon);
      if (address) {
        setFormData(prev => ({ ...prev, address }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const overrideData: Partial<CafeOverrideData> = {};
    if (formData.name) overrideData.name = formData.name;
    if (formData.address) overrideData.address = formData.address;
    if (formData.phone) overrideData.phone = formData.phone;
    if (formData.website) overrideData.website = formData.website;
    if (formData.instagram) overrideData.instagram = formData.instagram;
    if (formData.openingHours) overrideData.openingHours = formData.openingHours;
    if (formData.menuUrl) overrideData.menuUrl = formData.menuUrl;
    if (formData.description) overrideData.description = formData.description;
    if (formData.smokingPolicy) overrideData.smokingPolicy = formData.smokingPolicy as CafeOverrideData["smokingPolicy"];
    if (formData.priceRange) overrideData.priceRange = formData.priceRange as CafeOverrideData["priceRange"];
    overrideData.hasWifi = formData.hasWifi;
    overrideData.wifiFree = formData.wifiFree;
    overrideData.hasOutdoorSeating = formData.hasOutdoorSeating;
    overrideData.hasTakeaway = formData.hasTakeaway;
    overrideData.hasAirConditioning = formData.hasAirConditioning;

    await onSave(overrideData);
    setIsSaving(false);
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Override</h2>
              <p className="text-gray-400 text-sm mt-1">{cafe.name}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nama</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={cafe.name} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telepon</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder={cafe.phone || "Belum ada"} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder={cafe.website || "https://..."} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
              <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@username" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Link Menu</label>
              <input type="url" value={formData.menuUrl} onChange={(e) => setFormData({ ...formData, menuUrl: e.target.value })} placeholder="https://link-menu..." className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Jam Buka</label>
              <input type="text" value={formData.openingHours} onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })} placeholder={cafe.openingHours || "Mo-Su 08:00-22:00"} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Alamat</label>
            <div className="flex gap-2">
              <input type="text" value={formData.address} readOnly placeholder={cafe.address || "Klik tombol untuk ambil alamat..."} className={`${inputClass} bg-gray-900 cursor-not-allowed flex-1`} />
              <button type="button" onClick={handleFetchAddress} disabled={isFetchingAddress} className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                <Icon icon={isFetchingAddress ? 'mdi:loading' : 'mdi:map-marker'} className={`w-4 h-4 ${isFetchingAddress ? 'animate-spin' : ''}`} />
                {isFetchingAddress ? 'Mengambil...' : 'Ambil Alamat'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi tentang cafe ini..." rows={3} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Fasilitas</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={formData.hasWifi} onChange={(e) => setFormData({ ...formData, hasWifi: e.target.checked })} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500" />
                <span className="text-gray-300">WiFi</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={formData.wifiFree} onChange={(e) => setFormData({ ...formData, wifiFree: e.target.checked })} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500" />
                <span className="text-gray-300">WiFi Gratis</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={formData.hasAirConditioning} onChange={(e) => setFormData({ ...formData, hasAirConditioning: e.target.checked })} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500" />
                <span className="text-gray-300">AC</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={formData.hasOutdoorSeating} onChange={(e) => setFormData({ ...formData, hasOutdoorSeating: e.target.checked })} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500" />
                <span className="text-gray-300">Outdoor</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                <input type="checkbox" checked={formData.hasTakeaway} onChange={(e) => setFormData({ ...formData, hasTakeaway: e.target.checked })} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-primary-500" />
                <span className="text-gray-300">Takeaway</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Kisaran Harga</label>
              <select value={formData.priceRange} onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })} className={inputClass}>
                <option value="">Pilih...</option>
                <option value="low">Murah (&lt; 25rb)</option>
                <option value="medium">Menengah (25-50rb)</option>
                <option value="high">Mahal (&gt; 50rb)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Merokok</label>
              <select value={formData.smokingPolicy} onChange={(e) => setFormData({ ...formData, smokingPolicy: e.target.value })} className={inputClass}>
                <option value="">Pilih...</option>
                <option value="yes">Boleh</option>
                <option value="no">Dilarang</option>
                <option value="outside">Di Luar Saja</option>
                <option value="separated">Area Terpisah</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={isSaving} className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving && <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />}
            {isSaving ? "Menyimpan..." : "Simpan Override"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState<"custom" | "overpass" | "reports">("custom");
  const [cafes, setCafes] = useState<CustomCafe[]>([]);
  const [overpassCafes, setOverpassCafes] = useState<Cafe[]>([]);
  const [cafeOverrides, setCafeOverrides] = useState<Record<string, CafeOverrideData>>({});
  const [issueReports, setIssueReports] = useState<IssueReportData[]>([]);
  const [overpassCafeCount, setOverpassCafeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCafe, setEditingCafe] = useState<CustomCafe | null>(null);
  const [editingOverpassCafe, setEditingOverpassCafe] = useState<Cafe | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{
    status: 'idle' | 'fetching' | 'geocoding' | 'saving' | 'done' | 'error';
    current: number;
    total: number;
    message: string;
  }>({ status: 'idle', current: 0, total: 0, message: '' });

  // Check session storage for auth
  useEffect(() => {
    const isAuth = sessionStorage.getItem("admin_authenticated");
    if (isAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Load cafes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCafes();
      loadOverpassCafes();
      loadOverrides();
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadCafes = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomCafes();
      setCafes(data);
    } catch (error) {
      console.error("Error loading cafes:", error);
      showNotification("Gagal memuat data cafe", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverpassCafes = async () => {
    try {
      const cafesData = await searchCafes("");
      setOverpassCafes(cafesData);
      setOverpassCafeCount(cafesData.length);
    } catch (error) {
      console.error("Error loading overpass cafes:", error);
    }
  };

  const loadOverrides = async () => {
    try {
      const data = await getCafeOverrides();
      setCafeOverrides(data);
    } catch (error) {
      console.error("Error loading overrides:", error);
    }
  };

  const loadReports = async () => {
    try {
      const data = await getIssueReports();
      setIssueReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  };

  // Filter overpass cafes by search
  const filteredOverpassCafes = useMemo(() => {
    if (!searchQuery.trim()) return overpassCafes;
    const query = searchQuery.toLowerCase();
    return overpassCafes.filter(
      (cafe) =>
        cafe.name.toLowerCase().includes(query) ||
        cafe.address?.toLowerCase().includes(query)
    );
  }, [overpassCafes, searchQuery]);

  // Handle override save
  const handleSaveOverride = async (
    cafe: Cafe,
    overrideData: Partial<CafeOverrideData>
  ) => {
    try {
      await saveCafeOverride({
        originalId: cafe.id,
        originalName: cafe.name,
        ...overrideData,
      });
      await loadOverrides();
      showNotification("Override berhasil disimpan", "success");
      setEditingOverpassCafe(null);
    } catch (error) {
      console.error("Error saving override:", error);
      showNotification("Gagal menyimpan override", "error");
    }
  };

  // Handle override delete
  const handleDeleteOverride = async (originalId: string) => {
    try {
      await deleteCafeOverride(originalId);
      setCafeOverrides((prev) => {
        const newOverrides = { ...prev };
        delete newOverrides[originalId];
        return newOverrides;
      });
      showNotification("Override berhasil dihapus", "success");
    } catch (error) {
      console.error("Error deleting override:", error);
      showNotification("Gagal menghapus override", "error");
    }
  };

  // Toggle cafe visibility (hide/show from map)
  const toggleCafeVisibility = async (cafe: Cafe) => {
    const existingOverride = cafeOverrides[cafe.id];
    const isCurrentlyHidden = existingOverride?.isHidden;

    try {
      await saveCafeOverride({
        ...existingOverride,
        originalId: cafe.id,
        originalName: cafe.name,
        isHidden: !isCurrentlyHidden,
      });
      await loadOverrides();
      showNotification(
        isCurrentlyHidden
          ? "Cafe ditampilkan di peta"
          : "Cafe disembunyikan dari peta",
        "success"
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
      showNotification("Gagal mengubah visibilitas", "error");
    }
  };

  // Handle migration from Overpass API to Spreadsheet
  const handleMigration = async () => {
    try {
      setMigrationProgress({ status: 'fetching', current: 0, total: 0, message: 'Mengambil data dari Overpass API...' });
      
      // 1. Fetch cafes from Overpass API
      const cafesFromOverpass = await searchCafes('');
      setMigrationProgress({ status: 'geocoding', current: 0, total: cafesFromOverpass.length, message: 'Mengambil alamat untuk setiap cafe...' });
      
      // 2. Reverse geocode addresses for cafes without addresses
      const cafesWithAddresses: Cafe[] = [];
      for (let i = 0; i < cafesFromOverpass.length; i++) {
        const cafe = cafesFromOverpass[i];
        let address = cafe.address;
        
        // If no address, try to reverse geocode
        if (!address) {
          try {
            const geocodedAddress = await reverseGeocode(cafe.lat, cafe.lon);
            address = geocodedAddress || '';
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.warn(`Failed to geocode ${cafe.name}:`, err);
          }
        }
        
        cafesWithAddresses.push({
          ...cafe,
          address,
        });
        
        setMigrationProgress({ 
          status: 'geocoding', 
          current: i + 1, 
          total: cafesFromOverpass.length, 
          message: `Mengambil alamat: ${cafe.name} (${i + 1}/${cafesFromOverpass.length})` 
        });
      }
      
      // 3. Bulk save to spreadsheet
      setMigrationProgress({ status: 'saving', current: 0, total: cafesWithAddresses.length, message: 'Menyimpan data ke Spreadsheet...' });
      
      const result = await bulkAddCafes(cafesWithAddresses);
      
      // 4. Reload cafes
      await loadCafes();
      
      setMigrationProgress({ 
        status: 'done', 
        current: result.added, 
        total: result.total, 
        message: `Migrasi selesai! ${result.added} cafe ditambahkan, ${result.skipped} sudah ada.` 
      });
      
      showNotification(`Migrasi berhasil: ${result.added} cafe ditambahkan`, 'success');
      
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationProgress({ status: 'error', current: 0, total: 0, message: `Error: ${error}` });
      showNotification('Gagal melakukan migrasi', 'error');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setPasswordError("");
    } else {
      setPasswordError("Password salah!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (cafeId: string) => {
    try {
      await deleteCustomCafe(cafeId);
      setCafes((prev) => prev.filter((c) => c.id !== cafeId));
      showNotification("Cafe berhasil dihapus", "success");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting cafe:", error);
      showNotification("Gagal menghapus cafe", "error");
    }
  };

  const handleUpdate = async (
    cafeId: string,
    data: Partial<CustomCafeFormData>
  ) => {
    try {
      await updateCustomCafe(cafeId, data);
      setCafes((prev) =>
        prev.map((c) => (c.id === cafeId ? { ...c, ...data } : c))
      );
      showNotification("Cafe berhasil diupdate", "success");
      setEditingCafe(null);
    } catch (error) {
      console.error("Error updating cafe:", error);
      showNotification("Gagal mengupdate cafe", "error");
    }
  };

  const handleAdd = async (data: CustomCafeFormData) => {
    try {
      await addCustomCafe(data);
      await loadCafes();
      showNotification("Cafe berhasil ditambahkan", "success");
      setIsAddingNew(false);
    } catch (error) {
      console.error("Error adding cafe:", error);
      showNotification("Gagal menambahkan cafe", "error");
    }
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:shield-lock" className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-2">RuangKopi Surabaya</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Masukkan password admin"
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-colors"
            >
              Login
            </button>
          </form>

          <a
            href="/"
            className="block text-center text-gray-400 hover:text-white mt-6 transition-colors"
          >
            ← Kembali ke Peta
          </a>
        </motion.div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:coffee" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">RuangKopi Surabaya</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMigrationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              <Icon icon="mdi:database-import" className="w-5 h-5" />
              Migrasi Overpass
            </button>
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors"
            >
              <Icon icon="mdi:plus" className="w-5 h-5" />
              Tambah Cafe
            </button>
            <button
              onClick={loadCafes}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Icon
                icon={isLoading ? "mdi:loading" : "mdi:refresh"}
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Icon icon="mdi:map" className="w-5 h-5" />
              Ke Peta
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <Icon icon="mdi:logout" className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:database" className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {overpassCafeCount}
                </p>
                <p className="text-gray-400 text-xs">Overpass API</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:coffee" className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{cafes.length}</p>
                <p className="text-gray-400 text-xs">Custom Cafe</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:pencil-box-multiple"
                  className="w-5 h-5 text-purple-400"
                />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {Object.keys(cafeOverrides).length}
                </p>
                <p className="text-gray-400 text-xs">Overrides</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:flag" className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {issueReports.length}
                </p>
                <p className="text-gray-400 text-xs">Laporan</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:sigma" className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {overpassCafeCount + cafes.length}
                </p>
                <p className="text-gray-400 text-xs">Total Cafe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "custom"
                ? "bg-primary-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Icon icon="mdi:coffee" className="w-5 h-5" />
            Custom Cafe ({cafes.length})
          </button>
          <button
            onClick={() => setActiveTab("overpass")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "overpass"
                ? "bg-primary-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Icon icon="mdi:database" className="w-5 h-5" />
            Overpass API ({overpassCafeCount})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "reports"
                ? "bg-primary-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Icon icon="mdi:flag" className="w-5 h-5" />
            Laporan Masalah ({issueReports.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "custom" && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                Daftar Custom Cafe
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Kelola cafe yang ditambahkan pengguna
              </p>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <Icon
                  icon="mdi:loading"
                  className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4"
                />
                <p className="text-gray-400">Memuat data...</p>
              </div>
            ) : cafes.length === 0 ? (
              <div className="p-12 text-center">
                <Icon
                  icon="mdi:coffee-off"
                  className="w-12 h-12 text-gray-600 mx-auto mb-4"
                />
                <p className="text-gray-400">Belum ada custom cafe</p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-lg transition-colors"
                >
                  Tambah Cafe Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Alamat
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Fasilitas
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {cafes.map((cafe) => (
                      <tr
                        key={cafe.id}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">
                              {cafe.name}
                            </p>
                            {cafe.phone && (
                              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                                <Icon icon="mdi:phone" className="w-3 h-3" />
                                {cafe.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300 text-sm">
                            {cafe.address || (
                              <span className="text-gray-500 italic">
                                {cafe.lat.toFixed(6)}, {cafe.lon.toFixed(6)}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {cafe.hasWifi && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                                WiFi
                              </span>
                            )}
                            {cafe.hasAirConditioning && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                AC
                              </span>
                            )}
                            {cafe.hasOutdoorSeating && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Outdoor
                              </span>
                            )}
                            {cafe.hasTakeaway && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                Takeaway
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400 text-sm">
                            {cafe.submittedAt
                              ? new Date(cafe.submittedAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCafe(cafe)}
                              className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Icon icon="mdi:pencil" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(cafe.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Icon icon="mdi:delete" className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Overpass API Tab */}
        {activeTab === "overpass" && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Cafe dari Overpass API
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Edit informasi cafe dari OpenStreetMap
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari cafe..."
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">
                      Nama
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">
                      Alamat
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredOverpassCafes.slice(0, 100).map((cafe) => (
                    <tr
                      key={cafe.id}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{cafe.name}</p>
                        {cafe.brand && (
                          <p className="text-gray-400 text-xs">{cafe.brand}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">
                          {cafeOverrides[cafe.id]?.address || cafe.address || (
                            <span className="text-gray-500 italic">
                              {cafe.lat.toFixed(6)}, {cafe.lon.toFixed(6)}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {cafeOverrides[cafe.id]?.isHidden ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                              <Icon icon="mdi:eye-off" className="w-3 h-3" />
                              Tersembunyi
                            </span>
                          ) : cafeOverrides[cafe.id] ? (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                              <Icon icon="mdi:pencil" className="w-3 h-3" />
                              Diedit
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Hide/Show button */}
                          <button
                            onClick={() => toggleCafeVisibility(cafe)}
                            className={`p-2 rounded-lg transition-colors ${
                              cafeOverrides[cafe.id]?.isHidden
                                ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                            }`}
                            title={
                              cafeOverrides[cafe.id]?.isHidden
                                ? "Tampilkan di Peta"
                                : "Sembunyikan dari Peta"
                            }
                          >
                            <Icon
                              icon={
                                cafeOverrides[cafe.id]?.isHidden
                                  ? "mdi:eye"
                                  : "mdi:eye-off"
                              }
                              className="w-4 h-4"
                            />
                          </button>
                          <button
                            onClick={() => setEditingOverpassCafe(cafe)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                            title="Edit Override"
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </button>
                          {cafeOverrides[cafe.id] && (
                            <button
                              onClick={() => handleDeleteOverride(cafe.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                              title="Hapus Override"
                            >
                              <Icon icon="mdi:delete" className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOverpassCafes.length > 100 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                Menampilkan 100 dari {filteredOverpassCafes.length} cafe.
                Gunakan pencarian untuk menemukan cafe.
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Laporan Masalah</h2>
              <p className="text-gray-400 text-sm mt-1">
                Laporan dari pengguna tentang informasi cafe
              </p>
            </div>

            {issueReports.length === 0 ? (
              <div className="p-12 text-center">
                <Icon
                  icon="mdi:flag-checkered"
                  className="w-12 h-12 text-gray-600 mx-auto mb-4"
                />
                <p className="text-gray-400">Belum ada laporan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {issueReports.map((report, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              report.issueType === "wrong_info"
                                ? "bg-amber-500/20 text-amber-400"
                                : report.issueType === "closed"
                                ? "bg-red-500/20 text-red-400"
                                : report.issueType === "wrong_location"
                                ? "bg-blue-500/20 text-blue-400"
                                : report.issueType === "add_info"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {report.issueType === "wrong_info" && "Info Salah"}
                            {report.issueType === "closed" && "Tutup"}
                            {report.issueType === "wrong_location" &&
                              "Lokasi Salah"}
                            {report.issueType === "add_info" && "Tambah Info"}
                            {report.issueType === "other" && "Lainnya"}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {report.reportedAt &&
                              new Date(report.reportedAt).toLocaleDateString(
                                "id-ID"
                              )}
                          </span>
                        </div>
                        <h3 className="text-white font-medium">
                          {report.cafeName}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {report.description}
                        </p>
                        {report.suggestedFix && (
                          <p className="text-gray-500 text-sm mt-2 italic">
                            Saran: {report.suggestedFix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCafe && (
          <CafeFormModal
            mode="edit"
            cafe={editingCafe}
            onClose={() => setEditingCafe(null)}
            onSave={(data) => handleUpdate(editingCafe.id, data)}
          />
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddingNew && (
          <CafeFormModal
            mode="add"
            onClose={() => setIsAddingNew(false)}
            onSave={handleAdd}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="mdi:delete-alert"
                    className="w-8 h-8 text-red-400"
                  />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Hapus Cafe?
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Apakah Anda yakin ingin menghapus cafe ini? Tindakan ini tidak
                  dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Override Edit Modal */}
      <AnimatePresence>
        {editingOverpassCafe && (
          <OverrideEditModal
            cafe={editingOverpassCafe}
            existingOverride={cafeOverrides[editingOverpassCafe.id]}
            onClose={() => setEditingOverpassCafe(null)}
            onSave={(overrideData) =>
              handleSaveOverride(editingOverpassCafe, overrideData)
            }
          />
        )}
      </AnimatePresence>

      {/* Migration Modal */}
      <AnimatePresence>
        {showMigrationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:database-import" className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Migrasi Data dari Overpass API
                </h3>
                <p className="text-gray-400 text-sm">
                  Proses ini akan mengambil semua cafe dari Overpass API, mengambil alamat via reverse geocode, lalu menyimpan ke Spreadsheet.
                </p>
              </div>
              
              {migrationProgress.status !== 'idle' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>{migrationProgress.message}</span>
                    {migrationProgress.total > 0 && (
                      <span>{migrationProgress.current}/{migrationProgress.total}</span>
                    )}
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        migrationProgress.status === 'error' ? 'bg-red-500' :
                        migrationProgress.status === 'done' ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{ 
                        width: migrationProgress.total > 0 
                          ? `${(migrationProgress.current / migrationProgress.total) * 100}%` 
                          : migrationProgress.status === 'fetching' ? '20%' : '100%'
                      }}
                    />
                  </div>
                  {migrationProgress.status === 'done' && (
                    <p className="text-green-400 text-sm mt-3 text-center">
                      ✓ {migrationProgress.message}
                    </p>
                  )}
                  {migrationProgress.status === 'error' && (
                    <p className="text-red-400 text-sm mt-3 text-center">
                      ✗ {migrationProgress.message}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMigrationModal(false);
                    setMigrationProgress({ status: 'idle', current: 0, total: 0, message: '' });
                  }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {migrationProgress.status === 'done' || migrationProgress.status === 'error' ? 'Tutup' : 'Batal'}
                </button>
                {migrationProgress.status === 'idle' && (
                  <button
                    onClick={handleMigration}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:play" className="w-5 h-5" />
                    Mulai Migrasi
                  </button>
                )}
                {(migrationProgress.status === 'fetching' || migrationProgress.status === 'geocoding' || migrationProgress.status === 'saving') && (
                  <button
                    disabled
                    className="flex-1 py-2 bg-gray-600 text-gray-400 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                    Proses...
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white font-medium z-[100]`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={
                  notification.type === "success"
                    ? "mdi:check-circle"
                    : "mdi:alert-circle"
                }
                className="w-5 h-5"
              />
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Cafe Form Modal Component (for both Add and Edit)
function CafeFormModal({
  mode,
  cafe,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  cafe?: CustomCafe;
  onClose: () => void;
  onSave: (data: CustomCafeFormData) => Promise<void>;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CustomCafeFormData>({
    name: cafe?.name || "",
    lat: cafe?.lat || -7.2575,
    lon: cafe?.lon || 112.7521,
    address: cafe?.address || "",
    phone: cafe?.phone || "",
    website: cafe?.website || "",
    instagram: cafe?.instagram || "",
    openingHours: cafe?.openingHours || "",
    hasWifi: cafe?.hasWifi || false,
    wifiFree: cafe?.wifiFree || false,
    hasOutdoorSeating: cafe?.hasOutdoorSeating || false,
    smokingPolicy:
      (cafe?.smokingPolicy as "yes" | "no" | "outside" | "separated") || "no",
    hasTakeaway: cafe?.hasTakeaway || false,
    hasAirConditioning: cafe?.hasAirConditioning || false,
    priceRange: cafe?.priceRange || "medium",
    description: cafe?.description || "",
    logo: cafe?.logo || undefined,
    photos: cafe?.photos || [],
  });

  // Opening hours per day
  const [openingHoursData, setOpeningHoursData] = useState<{
    [key: string]: { isOpen: boolean; open: string; close: string };
  }>(() => {
    // Parse existing opening hours if editing
    const defaultData = {
      mon: { isOpen: true, open: "08:00", close: "22:00" },
      tue: { isOpen: true, open: "08:00", close: "22:00" },
      wed: { isOpen: true, open: "08:00", close: "22:00" },
      thu: { isOpen: true, open: "08:00", close: "22:00" },
      fri: { isOpen: true, open: "08:00", close: "22:00" },
      sat: { isOpen: true, open: "08:00", close: "22:00" },
      sun: { isOpen: true, open: "08:00", close: "22:00" },
    };
    return defaultData;
  });

  // Format opening hours to OSM format
  const formatOpeningHoursToOSM = useCallback(() => {
    const dayMap: { [key: string]: string } = {
      mon: "Mo",
      tue: "Tu",
      wed: "We",
      thu: "Th",
      fri: "Fr",
      sat: "Sa",
      sun: "Su",
    };
    const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const parts: string[] = [];

    let i = 0;
    while (i < dayOrder.length) {
      const day = dayOrder[i];
      const data = openingHoursData[day];

      if (!data.isOpen) {
        parts.push(`${dayMap[day]} off`);
        i++;
        continue;
      }

      let j = i + 1;
      while (j < dayOrder.length) {
        const nextDay = dayOrder[j];
        const nextData = openingHoursData[nextDay];
        if (
          nextData.isOpen &&
          nextData.open === data.open &&
          nextData.close === data.close
        ) {
          j++;
        } else {
          break;
        }
      }

      const startDay = dayMap[dayOrder[i]];
      const endDay = dayMap[dayOrder[j - 1]];
      const hours = `${data.open}-${data.close}`;

      if (i === j - 1) {
        parts.push(`${startDay} ${hours}`);
      } else {
        parts.push(`${startDay}-${endDay} ${hours}`);
      }

      i = j;
    }

    return parts.join("; ");
  }, [openingHoursData]);

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lon: lng }));
    // Try to get address
    try {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        setFormData((prev) => ({ ...prev, address }));
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );
      const { latitude, longitude } = position.coords;
      await handleLocationSelect(latitude, longitude);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [handleLocationSelect]);

  const handlePasteCoordinates = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Try to parse coordinates (format: lat, lng or lat lng)
      const match = text.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          await handleLocationSelect(lat, lng);
        }
      }
    } catch (error) {
      console.error("Error pasting coordinates:", error);
    }
  }, [handleLocationSelect]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const openingHoursFormatted = formatOpeningHoursToOSM();
      const dataToSubmit = {
        ...formData,
        openingHours: openingHoursFormatted,
      };
      await onSave(dataToSubmit);
    } finally {
      setIsSaving(false);
    }
  };

  const mapCenter = useMemo<[number, number]>(
    () => [formData.lat, formData.lon],
    [formData.lat, formData.lon]
  );

  const inputClass =
    "w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  const days = [
    { key: "mon", label: "Sen" },
    { key: "tue", label: "Sel" },
    { key: "wed", label: "Rab" },
    { key: "thu", label: "Kam" },
    { key: "fri", label: "Jum" },
    { key: "sat", label: "Sab" },
    { key: "sun", label: "Min" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === "add" ? "Tambah Cafe Baru" : "Edit Cafe"}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {mode === "add"
                  ? "Lengkapi informasi cafe"
                  : "Ubah informasi cafe"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  currentStep >= step ? "bg-primary-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span
              className={
                currentStep >= 1
                  ? "text-primary-500 font-medium"
                  : "text-gray-500"
              }
            >
              Info Dasar
            </span>
            <span
              className={
                currentStep >= 2
                  ? "text-primary-500 font-medium"
                  : "text-gray-500"
              }
            >
              Lokasi
            </span>
            <span
              className={
                currentStep >= 3
                  ? "text-primary-500 font-medium"
                  : "text-gray-500"
              }
            >
              Fasilitas
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Nama Cafe <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contoh: Kopi Kenangan"
                  className={inputClass}
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className={labelClass}>Logo Cafe</label>
                <LogoUpload
                  logo={formData.logo || null}
                  onLogoChange={(logo) =>
                    setFormData((prev) => ({ ...prev, logo: logo || undefined }))
                  }
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ceritakan tentang tempat ini..."
                  className={inputClass}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telepon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="08123456789"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    placeholder="@coffeeshop"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              {/* Opening Hours */}
              <div>
                <label className={labelClass}>Jam Buka</label>

                <button
                  type="button"
                  onClick={() => {
                    const firstDay = openingHoursData.mon;
                    setOpeningHoursData({
                      mon: firstDay,
                      tue: { ...firstDay },
                      wed: { ...firstDay },
                      thu: { ...firstDay },
                      fri: { ...firstDay },
                      sat: { ...firstDay },
                      sun: { ...firstDay },
                    });
                  }}
                  className="mb-3 text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  <Icon
                    icon="mdi:content-copy"
                    className="w-3 h-3 inline mr-1"
                  />
                  Terapkan ke semua hari
                </button>

                <div className="rounded-xl border border-gray-700 bg-gray-750 overflow-hidden">
                  {days.map((day, index) => (
                    <div
                      key={day.key}
                      className={`flex items-center gap-2 px-3 py-2 ${
                        index !== 0 ? "border-t border-gray-700" : ""
                      }`}
                    >
                      <span className="w-10 text-sm font-medium text-gray-300">
                        {day.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOpeningHoursData((prev) => ({
                            ...prev,
                            [day.key]: {
                              ...prev[day.key],
                              isOpen: !prev[day.key].isOpen,
                            },
                          }));
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          openingHoursData[day.key].isOpen
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {openingHoursData[day.key].isOpen ? "Buka" : "Tutup"}
                      </button>
                      {openingHoursData[day.key].isOpen && (
                        <div className="flex items-center gap-1 ml-auto">
                          <input
                            type="time"
                            value={openingHoursData[day.key].open}
                            onChange={(e) => {
                              setOpeningHoursData((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...prev[day.key],
                                  open: e.target.value,
                                },
                              }));
                            }}
                            className="px-2 py-1 rounded-lg text-xs bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-500">-</span>
                          <input
                            type="time"
                            value={openingHoursData[day.key].close}
                            onChange={(e) => {
                              setOpeningHoursData((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...prev[day.key],
                                  close: e.target.value,
                                },
                              }));
                            }}
                            className="px-2 py-1 rounded-lg text-xs bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Alamat</label>
                <input
                  type="text"
                  value={formData.address}
                  readOnly
                  placeholder="Alamat akan terisi otomatis setelah memilih lokasi..."
                  className={`${inputClass} bg-gray-900 cursor-not-allowed`}
                />
                <p className="text-gray-500 text-xs mt-1">Alamat diambil otomatis dari koordinat yang dipilih</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Icon
                    icon={
                      isGettingLocation ? "mdi:loading" : "mdi:crosshairs-gps"
                    }
                    className={`w-5 h-5 ${
                      isGettingLocation ? "animate-spin" : ""
                    }`}
                  />
                  {isGettingLocation ? "Mencari..." : "Gunakan Lokasi Saya"}
                </button>
                <button
                  type="button"
                  onClick={handlePasteCoordinates}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                >
                  <Icon icon="mdi:content-paste" className="w-5 h-5" />
                  Paste Koordinat
                </button>
              </div>

              {/* Coordinate inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input
                    type="number"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lat: parseFloat(e.target.value) || 0,
                      }))
                    }
                    step="0.0001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input
                    type="number"
                    value={formData.lon}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lon: parseFloat(e.target.value) || 0,
                      }))
                    }
                    step="0.0001"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Map */}
              <div>
                <label className={labelClass}>
                  Pilih Lokasi di Peta (klik untuk memindahkan pin)
                </label>
                <div className="h-64 rounded-xl overflow-hidden border border-gray-700">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={mapCenter} icon={customMarkerIcon} />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    <MapCenterUpdater center={mapCenter} />
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Kisaran Harga</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priceRange: price }))
                      }
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.priceRange === price
                          ? "bg-primary-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {price === "low"
                        ? "Murah (< 25rb)"
                        : price === "medium"
                        ? "Sedang (25-50rb)"
                        : "Mahal (> 50rb)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Fasilitas</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "hasWifi", label: "WiFi", icon: "mdi:wifi" },
                    {
                      key: "wifiFree",
                      label: "WiFi Gratis",
                      icon: "mdi:wifi-check",
                    },
                    {
                      key: "hasOutdoorSeating",
                      label: "Outdoor Seating",
                      icon: "mdi:table-chair",
                    },
                    {
                      key: "hasTakeaway",
                      label: "Takeaway",
                      icon: "mdi:package-variant",
                    },
                    {
                      key: "hasAirConditioning",
                      label: "AC",
                      icon: "mdi:snowflake",
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [item.key]:
                            !prev[item.key as keyof CustomCafeFormData],
                        }))
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        formData[item.key as keyof CustomCafeFormData]
                          ? "bg-primary-500/20 border-primary-500 text-primary-400"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } border border-gray-600`}
                    >
                      <Icon icon={item.icon} className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Kebijakan Merokok</label>
                <select
                  value={formData.smokingPolicy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      smokingPolicy: e.target.value as
                        | "yes"
                        | "no"
                        | "outside"
                        | "separated",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="no">Dilarang Merokok</option>
                  <option value="yes">Boleh Merokok</option>
                  <option value="outside">Hanya di Luar</option>
                  <option value="separated">Area Terpisah</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div>
                <label className={labelClass}>Foto Cafe</label>
                <ImageUpload
                  images={formData.photos || []}
                  onImagesChange={(photos) =>
                    setFormData((prev) => ({ ...prev, photos }))
                  }
                  maxImages={5}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3 flex-shrink-0">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              Kembali
            </button>
          )}

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={currentStep === 1 && !formData.name.trim()}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.name.trim()}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && (
                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
              )}
              {isSaving
                ? "Menyimpan..."
                : mode === "add"
                ? "Tambah Cafe"
                : "Simpan Perubahan"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
