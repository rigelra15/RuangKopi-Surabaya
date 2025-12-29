import { MapContainer, TileLayer, useMap, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import type { Cafe } from '../services/cafeService';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Surabaya coordinates
const SURABAYA_CENTER: [number, number] = [-7.2575, 112.7521];
const DEFAULT_ZOOM = 13;

// Custom cluster icon
const createClusterCustomIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let dimension = 36;
  
  if (count >= 100) {
    size = 'large';
    dimension = 50;
  } else if (count >= 50) {
    size = 'medium';
    dimension = 44;
  } else if (count >= 10) {
    size = 'small';
    dimension = 40;
  }

  return L.divIcon({
    html: `
      <div style="
        width: ${dimension}px;
        height: ${dimension}px;
        background: linear-gradient(135deg, #6F4E37 0%, #8B6914 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: ${count >= 100 ? '14px' : '13px'};
        font-family: 'Poppins', sans-serif;
        box-shadow: 0 4px 12px rgba(111, 78, 55, 0.4);
        border: 3px solid white;
      ">
        ${count}
      </div>
    `,
    className: `marker-cluster marker-cluster-${size}`,
    iconSize: L.point(dimension, dimension),
  });
};

// Custom coffee marker icon
const createCoffeeIcon = () => {
  return L.divIcon({
    className: 'custom-cafe-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #6F4E37 0%, #8B6914 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(111, 78, 55, 0.4);
        border: 2px solid white;
      ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="white" 
          style="width: 18px; height: 18px; transform: rotate(45deg);"
        >
          <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Selected cafe marker icon - bigger and different color
const createSelectedCoffeeIcon = () => {
  return L.divIcon({
    className: 'custom-cafe-marker-selected',
    html: `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #059669 0%, #10B981 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.3);
        border: 3px solid white;
        animation: pulse 2s infinite;
      ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="white" 
          style="width: 24px; height: 24px; transform: rotate(45deg);"
        >
          <path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 004 4h6a4 4 0 004-4v-3h2a2 2 0 002-2V5a2 2 0 00-2-2z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5), 0 0 0 4px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 6px 20px rgba(5, 150, 105, 0.7), 0 0 0 8px rgba(16, 185, 129, 0.2); }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

// User location icon
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3B82F6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component to handle map movements and popup sync
function MapController({ 
  userLocation: _userLocation, // Kept for potential future use
  selectedCafe,
  showCafeDetail,
  markerRefs 
}: { 
  userLocation: [number, number] | null;
  selectedCafe: Cafe | null;
  showCafeDetail: boolean;
  markerRefs: React.MutableRefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  
  useEffect(() => {
    // Set max bounds to Surabaya area with wider tolerance
    const southWest: [number, number] = [-7.6, 112.4];
    const northEast: [number, number] = [-6.9, 113.1];
    map.setMaxBounds([southWest, northEast]);
  }, [map]);

  // Pan to user location when it changes - DISABLED: Just show marker without zooming
  // useEffect(() => {
  //   if (userLocation) {
  //     map.flyTo(userLocation, 15, { duration: 1.5 });
  //   }
  // }, [map, userLocation]);

  // Pan to selected cafe when it changes
  useEffect(() => {
    if (selectedCafe) {
      const isMobile = window.innerWidth < 768;
      
      if (isMobile && showCafeDetail) {
        // On mobile with bottom sheet open, we need to position the cafe pin 
        // in the visible area ABOVE the bottom sheet (top ~35% of screen)
        // 
        // The bottom sheet covers 65% of the screen from bottom
        // So we need the marker to appear in the top 35%
        // To center it in that area, we need it at roughly 15-20% from top
        
        const zoom = 18; // Max zoom for detailed view of the cafe
        
        // Get the pixel point of the cafe at this zoom
        const cafePoint = map.project([selectedCafe.lat, selectedCafe.lon], zoom);
        
        // We want pin to appear at ~25% from top of screen (below search bar, above bottom sheet)
        // Map center is at 50%, so offset needed = 50% - 25% = 25%
        // Search bar is around 10% from top, bottom sheet starts at 35% from top
        // So visible area is 10-35%, center is at ~22.5% from top
        // Offset = 50% - 22.5% = 27.5% of window height, using 25% for some margin
        const offsetPixels = window.innerHeight * 0.25;
        
        // Offset the point DOWN (so the map shifts UP, moving the marker UP on screen)
        const offsetPoint = L.point(cafePoint.x, cafePoint.y + offsetPixels);
        
        // Convert back to lat/lng - this is where map center should be
        const targetLatLng = map.unproject(offsetPoint, zoom);
        
        map.flyTo(targetLatLng, zoom, { 
          duration: 0.8,
          animate: true 
        });
        
      } else {
        // Desktop or mobile without detail - center normally at max zoom
        map.flyTo([selectedCafe.lat, selectedCafe.lon], 18, { duration: 1 });
      }
    }
  }, [map, selectedCafe, showCafeDetail]);

  // Sync popup visibility with cafe detail panel
  useEffect(() => {
    if (showCafeDetail && selectedCafe) {
      // Open popup for selected cafe
      const marker = markerRefs.current.get(selectedCafe.id);
      if (marker) {
        // Small delay to ensure map has panned
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }
    } else {
      // Close all popups when panel is closed
      map.closePopup();
    }
  }, [map, selectedCafe, showCafeDetail, markerRefs]);

  return null;
}

// Component to handle route fit bounds
function RouteController({ 
  routeCoordinates,
  userLocation,
  routeDestination
}: { 
  routeCoordinates: [number, number][];
  userLocation: [number, number] | null;
  routeDestination: { lat: number; lon: number; name: string } | null;
}) {
  const map = useMap();
  
  // Fit bounds when route is loaded - use flyToBounds for smooth animation
  useEffect(() => {
    if (routeCoordinates.length > 0 && userLocation && routeDestination) {
      // Create bounds that includes user location and destination
      const bounds = L.latLngBounds([
        userLocation,
        [routeDestination.lat, routeDestination.lon]
      ]);
      
      // Extend bounds with all route coordinates
      routeCoordinates.forEach(coord => {
        bounds.extend(coord);
      });
      
      // Use flyToBounds for smooth animation
      const isMobile = window.innerWidth < 768;
      map.flyToBounds(bounds, {
        padding: isMobile ? [50, 50] : [80, 80],
        maxZoom: 15,
        duration: 1.5, // Smooth 1.5 second animation
      });
    }
  }, [map, routeCoordinates, userLocation, routeDestination]);

  return null;
}

interface MapViewProps {
  isDarkMode: boolean;
  userLocation: [number, number] | null;
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  onCafeSelect: (cafe: Cafe) => void;
  showCafeDetail: boolean;
  routeDestination?: { lat: number; lon: number; name: string } | null;
  onRouteInfoChange?: (info: { distance: number; duration: number } | null) => void;
}

export default function MapView({ 
  isDarkMode, 
  userLocation, 
  cafes, 
  selectedCafe,
  onCafeSelect,
  showCafeDetail,
  routeDestination,
  onRouteInfoChange
}: MapViewProps) {
  // Route state
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Fetch route when destination changes
  useEffect(() => {
    if (!routeDestination || !userLocation) {
      setRouteCoordinates([]);
      setRouteInfo(null);
      return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        // OSRM API expects lon,lat format
        const start = `${userLocation[1]},${userLocation[0]}`;
        const end = `${routeDestination.lon},${routeDestination.lat}`;
        
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        
        if (!response.ok) throw new Error('Failed to fetch route');
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Convert GeoJSON coordinates [lon, lat] to Leaflet format [lat, lon]
          const coords: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          setRouteCoordinates(coords);
          setRouteInfo({
            distance: route.distance / 1000, // Convert to km
            duration: route.duration / 60, // Convert to minutes
          });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteCoordinates([]);
        setRouteInfo(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [routeDestination, userLocation]);

  // Notify parent about route info changes
  useEffect(() => {
    if (onRouteInfoChange) {
      onRouteInfoChange(routeInfo);
    }
  }, [routeInfo, onRouteInfoChange]);

  // Different tile layers for light and dark mode
  // CARTO Positron - clean minimal style with less street names
  const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Memoize icons
  const coffeeIcon = useMemo(() => createCoffeeIcon(), []);
  const selectedCoffeeIcon = useMemo(() => createSelectedCoffeeIcon(), []);
  const userIcon = useMemo(() => createUserIcon(), []);

  // Store refs to markers for popup control
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  // Register marker ref
  const setMarkerRef = useCallback((cafeId: string, marker: L.Marker | null) => {
    if (marker) {
      markerRefs.current.set(cafeId, marker);
    } else {
      markerRefs.current.delete(cafeId);
    }
  }, []);

  return (
    <MapContainer
      center={SURABAYA_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={11}
      maxZoom={18}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={isDarkMode ? darkTileUrl : lightTileUrl}
        key={isDarkMode ? 'dark' : 'light'}
      />
      
      <MapController 
        userLocation={userLocation} 
        selectedCafe={selectedCafe}
        showCafeDetail={showCafeDetail}
        markerRefs={markerRefs}
      />

      {/* User location marker */}
      {userLocation && (
        <>
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center font-medium">Lokasi Anda</div>
            </Popup>
          </Marker>
          {/* Accuracy circle */}
          <Circle
            center={userLocation}
            radius={100}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        </>
      )}

      {/* Route polyline */}
      {routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: '#6F4E37',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Loading route indicator */}
      {isLoadingRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 py-3 flex items-center gap-2">
          <svg className="animate-spin w-5 h-5 text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-300">Mencari rute...</span>
        </div>
      )}

      {/* Route controller for fit bounds */}
      <RouteController
        routeCoordinates={routeCoordinates}
        userLocation={userLocation}
        routeDestination={routeDestination ?? null}
      />

      {/* Cafe markers with clustering - hide when routing is active */}
      {!routeDestination && (
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={17}
        >
          {cafes.map((cafe) => {
            const isSelected = selectedCafe?.id === cafe.id;
            return (
              <Marker 
                key={cafe.id} 
                position={[cafe.lat, cafe.lon]} 
                icon={isSelected ? selectedCoffeeIcon : coffeeIcon}
                zIndexOffset={isSelected ? 1000 : 0}
                ref={(marker) => setMarkerRef(cafe.id, marker)}
                eventHandlers={{
                  click: () => onCafeSelect(cafe),
                }}
              />
            );
          })}
        </MarkerClusterGroup>
      )}

      {/* Only show selected cafe marker when routing is active */}
      {routeDestination && selectedCafe && (
        <Marker 
          key={selectedCafe.id} 
          position={[selectedCafe.lat, selectedCafe.lon]} 
          icon={selectedCoffeeIcon}
          zIndexOffset={1000}
        />
      )}
    </MapContainer>
  );
}
