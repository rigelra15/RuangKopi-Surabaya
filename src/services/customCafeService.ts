// Custom Cafe Service - Store user-submitted cafes in Google Spreadsheet
import type { Cafe } from './cafeService';

// API Configuration
const SHEETS_API_URL = import.meta.env.VITE_SHEETS_API_URL;
const SECRET_KEY = import.meta.env.VITE_SHEETS_SECRET_KEY;

// Extended Cafe type for custom submissions
export interface CustomCafe extends Cafe {
  isCustom: true;
  submittedAt?: string;
  instagram?: string;
  priceRange?: 'low' | 'medium' | 'high';
  description?: string;
  logo?: string; // Cloudinary URL
  photos?: string[]; // Cloudinary URLs
  menuUrl?: string;
}

// Form data for submitting a new cafe
export interface CustomCafeFormData {
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  openingHours?: string;
  menuUrl?: string;
  hasWifi?: boolean;
  wifiFree?: boolean;
  hasOutdoorSeating?: boolean;
  smokingPolicy?: 'yes' | 'no' | 'outside' | 'separated';
  hasTakeaway?: boolean;
  hasAirConditioning?: boolean;
  priceRange?: 'low' | 'medium' | 'high';
  description?: string;
  logo?: string; // Cloudinary URL
  photos?: string[]; // Cloudinary URLs
}


// Issue report data
export interface IssueReportData {
  cafeId: string;
  cafeName: string;
  issueType: 'wrong_info' | 'closed' | 'wrong_location' | 'add_info' | 'other';
  description: string;
  suggestedFix?: string;
  reportedAt?: string;
}

// Cafe override data (for Overpass cafes)
export interface CafeOverrideData {
  originalId: string;
  originalName: string;
  // All optional - only override what's different
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  openingHours?: string;
  menuUrl?: string;
  hasWifi?: boolean;
  wifiFree?: boolean;
  hasOutdoorSeating?: boolean;
  smokingPolicy?: 'yes' | 'no' | 'outside' | 'separated';
  hasTakeaway?: boolean;
  hasAirConditioning?: boolean;
  priceRange?: 'low' | 'medium' | 'high';
  description?: string;
  // Hide from map
  isHidden?: boolean;
}

// Add a new custom cafe
export async function addCustomCafe(formData: CustomCafeFormData): Promise<string> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // Required for CORS with Apps Script
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'add',
        cafe: formData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to add cafe');
    }

    console.log('Custom cafe added:', result.id);
    return result.id;
  } catch (error) {
    console.error('Error adding custom cafe:', error);
    throw error;
  }
}

// Get all custom cafes from spreadsheet
export async function getCustomCafes(): Promise<CustomCafe[]> {
  try {
    const url = `${SHEETS_API_URL}?key=${encodeURIComponent(SECRET_KEY)}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get cafes');
    }

    // Transform data to match CustomCafe interface
    const cafes: CustomCafe[] = result.data.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      lat: Number(item.lat),
      lon: Number(item.lon),
      address: item.address as string | undefined,
      phone: item.phone as string | undefined,
      website: item.website as string | undefined,
      openingHours: item.openingHours as string | undefined,
      instagram: item.instagram as string | undefined,
      menuUrl: item.menuUrl as string | undefined,
      logo: item.logo as string | undefined,
      hasWifi: item.hasWifi === true || item.hasWifi === 'true',
      wifiFree: item.wifiFree === true || item.wifiFree === 'true',
      hasOutdoorSeating: item.hasOutdoorSeating === true || item.hasOutdoorSeating === 'true',
      hasTakeaway: item.hasTakeaway === true || item.hasTakeaway === 'true',
      hasAirConditioning: item.hasAirConditioning === true || item.hasAirConditioning === 'true',
      smokingPolicy: item.smokingPolicy as string | undefined,
      priceRange: item.priceRange as 'low' | 'medium' | 'high' | undefined,
      description: item.description as string | undefined,
      submittedAt: item.submittedAt as string | undefined,
      // Parse photos - stored as comma-separated URLs or JSON array
      photos: item.photos 
        ? (typeof item.photos === 'string' 
            ? (item.photos.startsWith('[') ? JSON.parse(item.photos) : item.photos.split(',').map((s: string) => s.trim()).filter(Boolean))
            : item.photos as string[])
        : undefined,
      isCustom: true as const,
    }));

    return cafes;
  } catch (error) {
    console.error('Error getting custom cafes:', error);
    return [];
  }
}

// Subscribe to custom cafes updates (polling-based for spreadsheet)
// Unlike Firebase RTDB, Google Sheets doesn't support real-time updates
// So we simulate subscription with initial fetch + callback for manual refresh
export function subscribeToCustomCafes(
  callback: (cafes: CustomCafe[]) => void
): () => void {
  let isActive = true;

  // Initial fetch
  const fetchCafes = async () => {
    if (!isActive) return;
    try {
      const cafes = await getCustomCafes();
      if (isActive) {
        callback(cafes);
      }
    } catch (error) {
      console.error('Error in subscription:', error);
    }
  };

  fetchCafes();

  // Return unsubscribe function
  return () => {
    isActive = false;
  };
}

// Refresh custom cafes (call this after adding a new cafe)
export async function refreshCustomCafes(): Promise<CustomCafe[]> {
  return getCustomCafes();
}

// Convert CustomCafe to standard Cafe interface for display
export function customCafeToCafe(customCafe: CustomCafe): Cafe & { isCustom: true } {
  return {
    id: customCafe.id,
    name: customCafe.name,
    lat: customCafe.lat,
    lon: customCafe.lon,
    address: customCafe.address,
    phone: customCafe.phone,
    website: customCafe.website,
    instagram: customCafe.instagram,
    openingHours: customCafe.openingHours,
    hasWifi: customCafe.hasWifi,
    wifiFree: customCafe.wifiFree,
    hasOutdoorSeating: customCafe.hasOutdoorSeating,
    smokingPolicy: customCafe.smokingPolicy,
    hasTakeaway: customCafe.hasTakeaway,
    hasAirConditioning: customCafe.hasAirConditioning,
    isCustom: true,
  };
}

// Update an existing custom cafe
export async function updateCustomCafe(cafeId: string, formData: Partial<CustomCafeFormData>): Promise<void> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'update',
        id: cafeId,
        cafe: formData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update cafe');
    }

    console.log('Custom cafe updated:', cafeId);
  } catch (error) {
    console.error('Error updating custom cafe:', error);
    throw error;
  }
}

// Delete a custom cafe
export async function deleteCustomCafe(cafeId: string): Promise<void> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'delete',
        id: cafeId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete cafe');
    }

    console.log('Custom cafe deleted:', cafeId);
  } catch (error) {
    console.error('Error deleting custom cafe:', error);
    throw error;
  }
}

// Submit an issue report
export async function submitIssueReport(report: IssueReportData): Promise<void> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'report',
        report: {
          ...report,
          reportedAt: new Date().toISOString(),
        },
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to submit report');
    }

    console.log('Issue report submitted for:', report.cafeName);
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

// Get all issue reports
export async function getIssueReports(): Promise<IssueReportData[]> {
  try {
    const url = `${SHEETS_API_URL}?key=${encodeURIComponent(SECRET_KEY)}&type=reports`;
    const response = await fetch(url, { method: 'GET' });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get reports');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
}

// Add or update a cafe override (for Overpass cafes)
export async function saveCafeOverride(override: CafeOverrideData): Promise<void> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'override',
        override: {
          ...override,
          updatedAt: new Date().toISOString(),
        },
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to save override');
    }

    console.log('Cafe override saved for:', override.originalId);
  } catch (error) {
    console.error('Error saving override:', error);
    throw error;
  }
}

// Get all cafe overrides
export async function getCafeOverrides(): Promise<Record<string, CafeOverrideData>> {
  try {
    const url = `${SHEETS_API_URL}?key=${encodeURIComponent(SECRET_KEY)}&type=overrides`;
    const response = await fetch(url, { method: 'GET' });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get overrides');
    }

    // Convert array to map with originalId as key
    const overrides: Record<string, CafeOverrideData> = {};
    (result.data || []).forEach((item: CafeOverrideData) => {
      if (item.originalId) {
        overrides[item.originalId] = item;
      }
    });

    return overrides;
  } catch (error) {
    console.error('Error getting overrides:', error);
    return {};
  }
}

// Delete a cafe override
export async function deleteCafeOverride(originalId: string): Promise<void> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'deleteOverride',
        id: originalId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete override');
    }

    console.log('Cafe override deleted:', originalId);
  } catch (error) {
    console.error('Error deleting override:', error);
    throw error;
  }
}

// Bulk add cafes (for migration from Overpass API)
export interface BulkAddResult {
  success: boolean;
  added: number;
  skipped: number;
  total: number;
  error?: string;
}

export async function bulkAddCafes(cafes: Cafe[]): Promise<BulkAddResult> {
  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        key: SECRET_KEY,
        action: 'bulkAdd',
        cafes: cafes.map(cafe => ({
          id: cafe.id,
          name: cafe.name,
          lat: cafe.lat,
          lon: cafe.lon,
          address: cafe.address || '',
          phone: cafe.phone || '',
          website: cafe.website || '',
          openingHours: cafe.openingHours || '',
          hasWifi: cafe.hasWifi || false,
          wifiFree: cafe.wifiFree || false,
          hasOutdoorSeating: cafe.hasOutdoorSeating || false,
          smokingPolicy: cafe.smokingPolicy || '',
          hasTakeaway: cafe.hasTakeaway || false,
          hasAirConditioning: cafe.hasAirConditioning || false,
          brand: cafe.brand || '',
          cuisine: cafe.cuisine || '',
          isHidden: false,
        })),
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to bulk add cafes');
    }

    console.log(`Bulk add complete: ${result.added} added, ${result.skipped} skipped`);
    return result;
  } catch (error) {
    console.error('Error bulk adding cafes:', error);
    throw error;
  }
}
