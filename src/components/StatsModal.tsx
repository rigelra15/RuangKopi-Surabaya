import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { recordVisit, subscribeToVisitStats, formatNumber } from '../services/visitService';

interface StatsModalProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({
  isDarkMode,
  language,
  isOpen,
  onClose,
}: StatsModalProps) {
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Record visit and subscribe to stats
  useEffect(() => {
    recordVisit();
    
    const unsubscribe = subscribeToVisitStats((newStats) => {
      setStats(newStats);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const content = {
    id: {
      title: 'Statistik Pengunjung',
      todayVisits: 'Kunjungan Hari Ini',
      totalVisits: 'Total Kunjungan',
      description: 'Data kunjungan dihitung secara real-time dan disimpan di cloud.',
      liveIndicator: 'Data Realtime',
      visitors: 'pengunjung',
      close: 'Tutup',
    },
    en: {
      title: 'Visitor Statistics',
      todayVisits: 'Visits Today',
      totalVisits: 'Total Visits',
      description: 'Visit data is calculated in real-time and stored in the cloud.',
      liveIndicator: 'Realtime Data',
      visitors: 'visitors',
      close: 'Close',
    },
  };

  const t = content[language];

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 10,
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
        delay: i * 0.1,
      }
    }),
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute inset-0 backdrop-blur-[1px]
              ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}
            `}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative w-full max-w-sm mx-auto
              rounded-3xl
              shadow-2xl
              ${isDarkMode
                ? 'bg-gray-900 border border-gray-700/50'
                : 'bg-white border border-gray-200/50'
              }
            `}
          >
            {/* Header */}
            <div
              className={`
                px-6 py-5 border-b
                ${isDarkMode
                  ? 'border-gray-800'
                  : 'border-gray-100'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`
                      p-2 rounded-xl
                      ${isDarkMode ? 'bg-primary-600' : 'bg-primary-500'}
                    `}
                  >
                    <Icon icon="mdi:chart-bar" className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2
                      className={`
                        text-lg font-bold
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}
                      `}
                    >
                      {t.title}
                    </h2>
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.liveIndicator}
                      </span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`
                    p-2 rounded-xl transition-colors
                    ${isDarkMode
                      ? 'hover:bg-gray-800 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                    }
                  `}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Today's Visits */}
                <motion.div
                  custom={0}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`
                    p-4 rounded-2xl border
                    ${isDarkMode 
                      ? 'bg-primary-900/20 border-primary-800/50' 
                      : 'bg-primary-50 border-primary-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`
                      p-1.5 rounded-lg
                      ${isDarkMode ? 'bg-primary-600' : 'bg-primary-500'}
                    `}>
                      <Icon 
                        icon="mdi:calendar-today" 
                        className="w-4 h-4 text-white" 
                      />
                    </div>
                    <span className={`
                      text-xs font-medium
                      ${isDarkMode ? 'text-primary-300' : 'text-primary-700'}
                    `}>
                      {t.todayVisits}
                    </span>
                  </div>
                  <div className={`
                    text-3xl font-bold
                    ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}
                  `}>
                    {isLoading ? (
                      <div className="h-9 w-16 bg-primary-500/20 animate-pulse rounded-lg"></div>
                    ) : (
                      formatNumber(stats.today)
                    )}
                  </div>
                  <span className={`
                    text-xs
                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                  `}>
                    {t.visitors}
                  </span>
                </motion.div>

                {/* Total Visits */}
                <motion.div
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`
                    p-4 rounded-2xl border
                    ${isDarkMode 
                      ? 'bg-primary-900/20 border-primary-800/50' 
                      : 'bg-primary-50 border-primary-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`
                      p-1.5 rounded-lg
                      ${isDarkMode ? 'bg-primary-600' : 'bg-primary-500'}
                    `}>
                      <Icon 
                        icon="mdi:chart-line" 
                        className="w-4 h-4 text-white" 
                      />
                    </div>
                    <span className={`
                      text-xs font-medium
                      ${isDarkMode ? 'text-primary-300' : 'text-primary-700'}
                    `}>
                      {t.totalVisits}
                    </span>
                  </div>
                  <div className={`
                    text-3xl font-bold
                    ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}
                  `}>
                    {isLoading ? (
                      <div className="h-9 w-16 bg-primary-500/20 animate-pulse rounded-lg"></div>
                    ) : (
                      formatNumber(stats.total)
                    )}
                  </div>
                  <span className={`
                    text-xs
                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                  `}>
                    {t.visitors}
                  </span>
                </motion.div>
              </div>

              {/* Description */}
              <motion.div
                custom={2}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className={`
                  p-4 rounded-xl
                  ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon 
                    icon="mdi:information-outline" 
                    className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                  />
                  <p
                    className={`
                      text-xs
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    `}
                  >
                    {t.description}
                  </p>
                </div>
              </motion.div>

              {/* Coffee decoration */}
              <motion.div 
                custom={3}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-center gap-2 pt-2"
              >
                <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <Icon 
                  icon="mdi:coffee" 
                  className={`w-5 h-5 ${isDarkMode ? 'text-primary-600' : 'text-primary-300'}`} 
                />
                <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </motion.div>
            </div>

            {/* Footer */}
            <div
              className={`
                px-6 py-4 border-t
                ${isDarkMode
                  ? 'border-gray-800'
                  : 'border-gray-100'
                }
              `}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`
                  w-full py-2.5 px-4 rounded-xl
                  font-medium transition-colors
                  ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }
                `}
              >
                {t.close}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
