import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  isDarkMode?: boolean;
}

const toastConfig = {
  success: {
    icon: 'mdi:check-circle',
    bgLight: 'bg-green-50 border-green-200',
    bgDark: 'bg-green-900/30 border-green-700/50',
    iconColor: 'text-green-500',
  },
  error: {
    icon: 'mdi:alert-circle',
    bgLight: 'bg-red-50 border-red-200',
    bgDark: 'bg-red-900/30 border-red-700/50',
    iconColor: 'text-red-500',
  },
  info: {
    icon: 'mdi:information',
    bgLight: 'bg-blue-50 border-blue-200',
    bgDark: 'bg-blue-900/30 border-blue-700/50',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: 'mdi:alert',
    bgLight: 'bg-amber-50 border-amber-200',
    bgDark: 'bg-amber-900/30 border-amber-700/50',
    iconColor: 'text-amber-500',
  },
};

export default function Toast({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3000,
  isDarkMode = false,
}: ToastProps) {
  const config = toastConfig[type];

  // Auto close timer
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`
            fixed z-[2000]
            top-4 left-1/2 -translate-x-1/2
            md:top-auto md:bottom-6 md:left-auto md:right-6 md:translate-x-0
            flex items-center gap-3 px-4 py-3 rounded-xl
            border shadow-lg backdrop-blur-xl
            ${isDarkMode ? config.bgDark : config.bgLight}
          `}
        >
          <Icon icon={config.icon} className={`w-5 h-5 ${config.iconColor}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {message}
          </span>
          <button
            onClick={onClose}
            className={`
              p-1 rounded-full transition-colors
              ${isDarkMode 
                ? 'hover:bg-white/10 text-gray-400' 
                : 'hover:bg-black/5 text-gray-500'
              }
            `}
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
