import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-lg mx-auto"
      >
        {/* Coffee cup illustration */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 relative"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30">
            <Icon icon="mdi:coffee-off" className="w-16 h-16 text-white" />
          </div>
          
          {/* Floating elements */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center backdrop-blur-[1px]"
          >
            <Icon icon="mdi:map-marker-question" className="w-6 h-6 text-amber-400" />
          </motion.div>
        </motion.div>

        {/* Error code */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-8xl font-bold bg-gradient-to-r from-primary-400 via-amber-400 to-primary-400 bg-clip-text text-transparent mb-4"
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Halaman Tidak Ditemukan
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 mb-8 leading-relaxed"
        >
          Sepertinya kamu tersesat saat mencari cafe! 
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-400 hover:to-primary-500 transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
          >
            <Icon icon="mdi:home" className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-all border border-gray-700"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            <span>Halaman Sebelumnya</span>
          </button>
        </motion.div>

        {/* Fun tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
        >
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            <Icon icon="mdi:lightbulb" className="w-5 h-5 text-amber-400" />
            <span>
              <strong className="text-amber-400">Tips:</strong> Coba cari cafe langsung dari peta di halaman utama!
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
