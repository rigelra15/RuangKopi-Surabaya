// Visit tracking service using Firebase Realtime Database
// This allows accurate visit counting across all users

import { database } from '../firebase';
import { ref, get, set, runTransaction, onValue, off } from 'firebase/database';

interface VisitData {
  totalVisits: number;
  dailyVisits: { [date: string]: number };
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Record a new visit using Firebase transaction (atomic operation)
export async function recordVisit(): Promise<void> {
  // Only record one visit per session (use sessionStorage to track)
  const sessionVisited = sessionStorage.getItem('ruangkopi_session_visited');
  if (sessionVisited === 'true') {
    return; // Already recorded this session
  }

  const today = getTodayDate();

  try {
    // Increment total visits atomically
    const totalRef = ref(database, 'visitStats/totalVisits');
    await runTransaction(totalRef, (currentValue) => {
      return (currentValue || 0) + 1;
    });

    // Increment today's visits atomically
    const dailyRef = ref(database, `visitStats/dailyVisits/${today}`);
    await runTransaction(dailyRef, (currentValue) => {
      return (currentValue || 0) + 1;
    });

    // Mark this session as visited
    sessionStorage.setItem('ruangkopi_session_visited', 'true');
    
    console.log('Visit recorded successfully');
  } catch (error) {
    console.error('Error recording visit:', error);
    // Fallback to localStorage if Firebase fails
    recordVisitLocally();
  }
}

// Fallback: Record visit locally if Firebase is unavailable
function recordVisitLocally(): void {
  const VISIT_STORAGE_KEY = 'ruangkopi_visit_stats_local';
  const today = getTodayDate();
  
  try {
    const stored = localStorage.getItem(VISIT_STORAGE_KEY);
    const data: VisitData = stored ? JSON.parse(stored) : { totalVisits: 0, dailyVisits: {} };
    
    data.totalVisits += 1;
    data.dailyVisits[today] = (data.dailyVisits[today] || 0) + 1;
    
    localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(data));
    sessionStorage.setItem('ruangkopi_session_visited', 'true');
  } catch (error) {
    console.error('Error recording visit locally:', error);
  }
}

// Get visit statistics from Firebase
export async function getVisitStats(): Promise<{ today: number; total: number }> {
  const today = getTodayDate();
  
  try {
    const [totalSnapshot, dailySnapshot] = await Promise.all([
      get(ref(database, 'visitStats/totalVisits')),
      get(ref(database, `visitStats/dailyVisits/${today}`))
    ]);

    return {
      today: dailySnapshot.exists() ? dailySnapshot.val() : 0,
      total: totalSnapshot.exists() ? totalSnapshot.val() : 0
    };
  } catch (error) {
    console.error('Error getting visit stats:', error);
    // Fallback to local stats
    return getLocalVisitStats();
  }
}

// Get local visit stats as fallback
function getLocalVisitStats(): { today: number; total: number } {
  const VISIT_STORAGE_KEY = 'ruangkopi_visit_stats_local';
  const today = getTodayDate();
  
  try {
    const stored = localStorage.getItem(VISIT_STORAGE_KEY);
    if (stored) {
      const data: VisitData = JSON.parse(stored);
      return {
        today: data.dailyVisits[today] || 0,
        total: data.totalVisits || 0
      };
    }
  } catch (error) {
    console.error('Error getting local stats:', error);
  }
  
  return { today: 0, total: 0 };
}

// Subscribe to real-time visit stats updates
export function subscribeToVisitStats(
  callback: (stats: { today: number; total: number }) => void
): () => void {
  const today = getTodayDate();
  
  const totalRef = ref(database, 'visitStats/totalVisits');
  const dailyRef = ref(database, `visitStats/dailyVisits/${today}`);
  
  let totalVisits = 0;
  let todayVisits = 0;

  const updateCallback = () => {
    callback({ today: todayVisits, total: totalVisits });
  };

  // Listen to total visits
  onValue(totalRef, (snapshot) => {
    totalVisits = snapshot.exists() ? snapshot.val() : 0;
    updateCallback();
  }, (error) => {
    console.error('Error subscribing to total visits:', error);
  });

  // Listen to today's visits
  onValue(dailyRef, (snapshot) => {
    todayVisits = snapshot.exists() ? snapshot.val() : 0;
    updateCallback();
  }, (error) => {
    console.error('Error subscribing to daily visits:', error);
  });

  // Return unsubscribe function
  return () => {
    off(totalRef);
    off(dailyRef);
  };
}

// Format number with Indonesian locale
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

// Clean up old daily visits (optional - can be called from an admin function)
export async function cleanupOldDailyVisits(daysToKeep: number = 30): Promise<void> {
  try {
    const dailyRef = ref(database, 'visitStats/dailyVisits');
    const snapshot = await get(dailyRef);
    
    if (!snapshot.exists()) return;
    
    const dailyVisits = snapshot.val();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
    
    const updates: { [key: string]: null } = {};
    
    Object.keys(dailyVisits).forEach(date => {
      if (date < cutoffStr) {
        updates[`visitStats/dailyVisits/${date}`] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      // Use set to delete old entries
      for (const key of Object.keys(updates)) {
        await set(ref(database, key), null);
      }
      console.log(`Cleaned up ${Object.keys(updates).length} old daily visit records`);
    }
  } catch (error) {
    console.error('Error cleaning up old daily visits:', error);
  }
}
