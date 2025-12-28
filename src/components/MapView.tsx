import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useCallback } from 'react';
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
      // Zoom to max level (18) for selected cafe
      map.flyTo([selectedCafe.lat, selectedCafe.lon], 18, { duration: 1 });
    }
  }, [map, selectedCafe]);

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

interface MapViewProps {
  isDarkMode: boolean;
  userLocation: [number, number] | null;
  cafes: Cafe[];
  selectedCafe: Cafe | null;
  onCafeSelect: (cafe: Cafe) => void;
  showCafeDetail: boolean;
}

export default function MapView({ 
  isDarkMode, 
  userLocation, 
  cafes, 
  selectedCafe,
  onCafeSelect,
  showCafeDetail
}: MapViewProps) {
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

      {/* Cafe markers with clustering */}
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
    </MapContainer>
  );
}
