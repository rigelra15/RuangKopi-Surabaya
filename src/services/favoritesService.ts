// Favorites service - manages cafe bookmarks in localStorage

import type { Cafe } from './cafeService';

const FAVORITES_KEY = 'ruangkopi_favorites';

export interface FavoriteCafe extends Cafe {
  addedAt: number; // timestamp when added
}

// Get all favorite cafes
export function getFavorites(): FavoriteCafe[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading favorites:', error);
  }
  return [];
}

// Check if a cafe is favorited
export function isFavorite(cafeId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(fav => fav.id === cafeId);
}

// Add cafe to favorites
export function addFavorite(cafe: Cafe): void {
  const favorites = getFavorites();
  
  // Check if already exists
  if (favorites.some(fav => fav.id === cafe.id)) {
    return;
  }
  
  const favoriteCafe: FavoriteCafe = {
    ...cafe,
    addedAt: Date.now(),
  };
  
  favorites.push(favoriteCafe);
  
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
}

// Remove cafe from favorites
export function removeFavorite(cafeId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter(fav => fav.id !== cafeId);
  
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

// Toggle favorite status
export function toggleFavorite(cafe: Cafe): boolean {
  if (isFavorite(cafe.id)) {
    removeFavorite(cafe.id);
    return false;
  } else {
    addFavorite(cafe);
    return true;
  }
}

// Calculate distance between two points in kilometers using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
