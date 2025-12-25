import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { recordVisit, subscribeToVisitStats, formatNumber } from '../services/visitService';

interface VisitStatsProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
}

export default function VisitStats({ isDarkMode, language }: VisitStatsProps) {
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Record visit when component mounts
    recordVisit();
    
    // Subscribe to real-time stats updates
    const unsubscribe = subscribeToVisitStats((newStats) => {
      setStats(newStats);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const translations = {
    id: {
      todayVisits: 'Hari Ini',
      totalVisits: 'Total',
      stats: 'Statistik',
      visitors: 'pengunjung',
    },
    en: {
      todayVisits: 'Today',
      totalVisits: 'Total',
      stats: 'Statistics',
      visitors: 'visitors',
    },
  };

  const t = translations[language];

  return (
    <div className="absolute bottom-28 sm:bottom-24 left-4 sm:left-6 z-[1000]">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
            className={`
              mb-2 p-4 rounded-2xl min-w-[200px]
              ${isDarkMode 
                ? 'bg-gray-900/95 border border-gray-700/50' 
                : 'bg-white/95 border border-gray-200/50'
              }
              backdrop-blur-xl shadow-xl
            `}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`
                p-1.5 rounded-lg
                ${isDarkMode ? 'bg-primary-500/20' : 'bg-primary-500/10'}
              `}>
                <Icon 
                  icon="mdi:chart-bar" 
                  className="w-4 h-4 text-primary-500" 
                />
              </div>
              <span className={`
                text-sm font-semibold
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}>
                {t.stats}
              </span>
              {/* Live indicator */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Live
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Today's Visits */}
              <div className={`
                p-3 rounded-xl
                ${isDarkMode 
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50'
                }
              `}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon 
                    icon="mdi:calendar-today" 
                    className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} 
                  />
                  <span className={`
                    text-[10px] font-medium uppercase tracking-wide
                    ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}
                  `}>
                    {t.todayVisits}
                  </span>
                </div>
                <div className={`
                  text-2xl font-bold
                  ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}
                `}>
                  {isLoading ? (
                    <div className="h-8 w-12 bg-amber-500/20 animate-pulse rounded"></div>
                  ) : (
                    formatNumber(stats.today)
                  )}
                </div>
              </div>

              {/* Total Visits */}
              <div className={`
                p-3 rounded-xl
                ${isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30' 
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50'
                }
              `}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon 
                    icon="mdi:chart-line" 
                    className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} 
                  />
                  <span className={`
                    text-[10px] font-medium uppercase tracking-wide
                    ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}
                  `}>
                    {t.totalVisits}
                  </span>
                </div>
                <div className={`
                  text-2xl font-bold
                  ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}
                `}>
                  {isLoading ? (
                    <div className="h-8 w-12 bg-emerald-500/20 animate-pulse rounded"></div>
                  ) : (
                    formatNumber(stats.total)
                  )}
                </div>
              </div>
            </div>

            {/* Coffee decoration */}
            <div className="flex items-center justify-center mt-3 gap-1.5">
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <Icon 
                icon="mdi:coffee" 
                className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} 
              />
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          text-sm font-medium transition-all
          ${isDarkMode
            ? 'bg-gray-800/90 hover:bg-gray-700 text-white'
            : 'bg-white/90 hover:bg-white text-gray-800'
          }
          backdrop-blur-xl shadow-lg border
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          ${isExpanded ? 'ring-2 ring-primary-500/50' : ''}
        `}
      >
        <Icon 
          icon={isExpanded ? "mdi:chart-box" : "mdi:chart-box-outline"} 
          className={`w-4 h-4 ${isExpanded ? 'text-primary-500' : ''}`} 
        />
        <span className="hidden sm:inline">
          {t.stats}
        </span>
        {/* Mini counter badge */}
        <span className={`
          px-1.5 py-0.5 text-[10px] font-bold rounded-full
          ${isDarkMode 
            ? 'bg-primary-500/20 text-primary-400' 
            : 'bg-primary-100 text-primary-600'
          }
        `}>
          {isLoading ? '...' : formatNumber(stats.total)}
        </span>
      </motion.button>
    </div>
  );
}
