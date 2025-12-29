// Cafe search service using Overpass API (OpenStreetMap)

export interface Cafe {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  cuisine?: string;
  instagram?: string;
  // New useful fields for students
  brand?: string;
  hasWifi?: boolean;
  wifiFree?: boolean;
  wifiSsid?: string;
  hasOutdoorSeating?: boolean;
  smokingPolicy?: 'yes' | 'no' | 'outside' | 'separated' | 'isolated' | string;
  hasTakeaway?: boolean;
  hasAirConditioning?: boolean;
  goodForWorking?: boolean; // WFC/laptop friendly
  operator?: string;
  // Menu link
  menuUrl?: string;
  // Logo (Cloudinary URL)
  logo?: string;
  // Photos (Cloudinary URLs)
  photos?: string[];
  // Flag for custom cafes (user-submitted)
  isCustom?: boolean;
  // Flag for overridden cafes (Overpass + user edits)
  hasOverride?: boolean;
}

// Surabaya bounding box
const SURABAYA_BOUNDS = {
  south: -7.4,
  west: 112.6,
  north: -7.1,
  east: 112.9,
};

// Alternative Overpass API endpoints
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Overpass API response type
interface OverpassResponse {
  elements: Array<{
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
}

// Try fetching from multiple endpoints
async function fetchFromOverpass(query: string): Promise<OverpassResponse> {
  let lastError: Error | null = null;
  
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`,
        },
        15000
      );
      
      if (response.ok) {
        console.log(`Success from: ${endpoint}`);
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed endpoint ${endpoint}:`, error);
      lastError = error as Error;
    }
  }
  
  throw lastError || new Error('All Overpass endpoints failed');
}

// Search for cafes in Surabaya using Overpass API
export async function searchCafes(query: string = ''): Promise<Cafe[]> {
  const bbox = `${SURABAYA_BOUNDS.south},${SURABAYA_BOUNDS.west},${SURABAYA_BOUNDS.north},${SURABAYA_BOUNDS.east}`;
  
  // Build Overpass query - search for cafes, coffee shops
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["amenity"="cafe"](${bbox});
      node["cuisine"~"coffee",i](${bbox});
      node["shop"="coffee"](${bbox});
      way["amenity"="cafe"](${bbox});
    );
    out center body;
  `;

  try {
    const data = await fetchFromOverpass(overpassQuery);
    
    // Parse OSM elements to Cafe objects
    const cafes = data.elements
      .map((element) => {
        const tags = element.tags || {};
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        if (!lat || !lon || !tags.name) return null;
        
        // Parse WiFi info
        const internetAccess = tags['internet_access'];
        const hasWifi = internetAccess === 'wlan' || internetAccess === 'yes' || internetAccess === 'wifi';
        const wifiFee = tags['internet_access:fee'];
        const wifiFree = wifiFee === 'no' || wifiFee === 'customers';
        const wifiSsid = tags['internet_access:ssid'];
        
        // Parse other amenities
        const outdoorSeating = tags['outdoor_seating'];
        const hasOutdoorSeating = outdoorSeating === 'yes';
        
        const smokingPolicy = tags['smoking'];
        
        const takeaway = tags['takeaway'];
        const hasTakeaway = takeaway === 'yes' || takeaway === 'only';
        
        const airConditioning = tags['air_conditioning'];
        const hasAirConditioning = airConditioning === 'yes';
        
        const cafe: Cafe = {
          id: element.id.toString(),
          name: tags.name,
          lat,
          lon,
          address: formatAddress(tags),
          phone: tags.phone || tags['contact:phone'],
          website: tags.website || tags['contact:website'],
          openingHours: tags.opening_hours,
          cuisine: tags.cuisine,
          // New fields
          brand: tags.brand,
          hasWifi: hasWifi || undefined,
          wifiFree: hasWifi ? wifiFree : undefined,
          wifiSsid: wifiSsid || undefined,
          hasOutdoorSeating: hasOutdoorSeating || undefined,
          smokingPolicy: smokingPolicy || undefined,
          hasTakeaway: hasTakeaway || undefined,
          hasAirConditioning: hasAirConditioning || undefined,
          operator: tags.operator || undefined,
        };
        return cafe;
      })
      .filter((cafe): cafe is Cafe => cafe !== null);

    // Filter by search query if provided
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      return cafes.filter(cafe => 
        cafe.name.toLowerCase().includes(lowerQuery) ||
        cafe.address?.toLowerCase().includes(lowerQuery) ||
        cafe.cuisine?.toLowerCase().includes(lowerQuery) ||
        cafe.brand?.toLowerCase().includes(lowerQuery)
      );
    }

    return cafes;
  } catch (error) {
    console.error('Error searching cafes:', error);
    // Return sample cafes as fallback for demo
    return getSampleCafes(query);
  }
}

// Format address from OSM tags
function formatAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'] || tags['addr:subdistrict'],
    tags['addr:city'],
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : '';
}

// Sample cafes for fallback when API fails
function getSampleCafes(query: string = ''): Cafe[] {
  const sampleCafes: Cafe[] = [
    {
      id: '1',
      name: 'Kopi Kenangan',
      lat: -7.2575,
      lon: 112.7521,
      address: 'Jl. Pemuda, Surabaya',
    },
    {
      id: '2',
      name: 'Starbucks Tunjungan Plaza',
      lat: -7.2614,
      lon: 112.7382,
      address: 'Tunjungan Plaza, Surabaya',
    },
    {
      id: '3',
      name: 'Excelso Ciputra World',
      lat: -7.2919,
      lon: 112.7375,
      address: 'Ciputra World, Surabaya',
    },
    {
      id: '4',
      name: 'Fore Coffee Galaxy Mall',
      lat: -7.2695,
      lon: 112.7714,
      address: 'Galaxy Mall, Surabaya',
    },
    {
      id: '5',
      name: 'Kopi Janji Jiwa',
      lat: -7.2489,
      lon: 112.7509,
      address: 'Jl. Darmo, Surabaya',
    },
    {
      id: '6',
      name: 'Point Coffee',
      lat: -7.2752,
      lon: 112.7480,
      address: 'Jl. Raya Gubeng, Surabaya',
    },
    {
      id: '7',
      name: 'Kopi Soe',
      lat: -7.2601,
      lon: 112.7525,
      address: 'CBD Surabaya',
    },
    {
      id: '8',
      name: 'Titik Temu Coffee',
      lat: -7.2542,
      lon: 112.7465,
      address: 'Jl. Diponegoro, Surabaya',
    },
    {
      id: '9',
      name: 'Kopi Tuku',
      lat: -7.2633,
      lon: 112.7560,
      address: 'Pakuwon Mall, Surabaya',
    },
    {
      id: '10',
      name: 'Simetri Coffee',
      lat: -7.2458,
      lon: 112.7380,
      address: 'Jl. Basuki Rahmat, Surabaya',
    },
  ];
  
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    return sampleCafes.filter(cafe =>
      cafe.name.toLowerCase().includes(lowerQuery) ||
      cafe.address?.toLowerCase().includes(lowerQuery)
    );
  }
  
  return sampleCafes;
}

// Reverse geocode coordinates to address
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Use our proxy API to avoid CORS issues with Nominatim
  try {
    const response = await fetchWithTimeout(
      `/api/geocode?type=reverse&lat=${lat}&lon=${lon}`,
      { method: 'GET' },
      10000
    );
    
    if (!response.ok) return null;
    
    const result = await response.json();
    
    if (result && result.address) {
      const addr = result.address;
      // Build a readable address from components
      const parts = [
        addr.road || addr.street,
        addr.house_number,
        addr.suburb || addr.neighbourhood || addr.village,
        addr.city || addr.town || addr.municipality,
      ].filter(Boolean);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
      
      // Fallback to display_name if parts are empty
      if (result.display_name) {
        // Shorten the display name (remove country, postal code, etc.)
        const displayParts = result.display_name.split(', ');
        return displayParts.slice(0, 4).join(', ');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Geocode a location name to coordinates
export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; displayName?: string } | null> {
  try {
    const searchQuery = query + ', Surabaya, Indonesia';
    const response = await fetchWithTimeout(
      `/api/geocode?type=search&q=${encodeURIComponent(searchQuery)}`,
      { method: 'GET' },
      10000
    );
    
    if (!response.ok) return null;
    
    const results = await response.json();
    
    if (Array.isArray(results) && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lon: parseFloat(results[0].lon),
        displayName: results[0].display_name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding:', error);
    return null;
  }
}

// Search for cafes near a geocoded location
export async function searchCafesNearLocation(
  lat: number, 
  lon: number, 
  radiusKm: number = 1
): Promise<Cafe[]> {
  try {
    const allCafes = await searchCafes('');
    
    // Filter cafes within the radius using Haversine formula
    const nearbyCafes = allCafes.filter(cafe => {
      const distance = haversineDistance(lat, lon, cafe.lat, cafe.lon);
      return distance <= radiusKm;
    }).sort((a, b) => {
      // Sort by distance
      const distA = haversineDistance(lat, lon, a.lat, a.lon);
      const distB = haversineDistance(lat, lon, b.lat, b.lon);
      return distA - distB;
    });
    
    return nearbyCafes;
  } catch (error) {
    console.error('Error searching cafes near location:', error);
    return [];
  }
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
