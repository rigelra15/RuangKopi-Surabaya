import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ErrorInfo {
  code: number | string;
  title: string;
  description: string;
  icon: string;
}

function getErrorInfo(error: unknown): ErrorInfo {
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 400:
        return {
          code: 400,
          title: 'Permintaan Tidak Valid',
          description: 'Server tidak dapat memahami permintaan yang dikirim. Coba refresh halaman atau kembali ke beranda.',
          icon: 'mdi:alert-circle',
        };
      case 401:
        return {
          code: 401,
          title: 'Akses Ditolak',
          description: 'Kamu perlu login untuk mengakses halaman ini.',
          icon: 'mdi:lock',
        };
      case 403:
        return {
          code: 403,
          title: 'Akses Dilarang',
          description: 'Maaf, kamu tidak memiliki izin untuk mengakses halaman ini.',
          icon: 'mdi:shield-lock',
        };
      case 404:
        return {
          code: 404,
          title: 'Halaman Tidak Ditemukan',
          description: 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.',
          icon: 'mdi:map-marker-question',
        };
      case 500:
        return {
          code: 500,
          title: 'Kesalahan Server',
          description: 'Terjadi kesalahan di server kami. Tim teknis sudah diberitahu dan sedang memperbaiki masalah ini.',
          icon: 'mdi:server-off',
        };
      case 503:
        return {
          code: 503,
          title: 'Layanan Tidak Tersedia',
          description: 'Server sedang dalam pemeliharaan atau terlalu sibuk. Coba lagi dalam beberapa menit.',
          icon: 'mdi:wrench',
        };
      default:
        return {
          code: error.status,
          title: 'Terjadi Kesalahan',
          description: error.statusText || 'Terjadi kesalahan yang tidak terduga.',
          icon: 'mdi:alert-octagon',
        };
    }
  }

  // For non-route errors (JavaScript errors, etc.)
  return {
    code: 'Oops!',
    title: 'Terjadi Kesalahan',
    description: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga. Coba refresh halaman.',
    icon: 'mdi:bug',
  };
}

export default function ErrorPage() {
  const error = useRouteError();
  const errorInfo = getErrorInfo(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center max-w-lg mx-auto"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30 relative">
            <Icon icon={errorInfo.icon} className="w-14 h-14 text-white" />
            
            {/* Pulse effect */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-red-400 rounded-3xl"
            />
          </div>
        </motion.div>

        {/* Error code */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-7xl font-bold bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent mb-4"
        >
          {errorInfo.code}
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-white mb-4"
        >
          {errorInfo.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 mb-8 leading-relaxed"
        >
          {errorInfo.description}
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-400 hover:to-primary-500 transition-all shadow-lg shadow-primary-500/30"
          >
            <Icon icon="mdi:home" className="w-5 h-5" />
            <span>Kembali ke Beranda</span>
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-all border border-gray-700"
          >
            <Icon icon="mdi:refresh" className="w-5 h-5" />
            <span>Refresh Halaman</span>
          </button>
        </motion.div>

        {/* Report issue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <a
            href="https://github.com/rigelra15/RuangKopi-Surabaya/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-400 text-sm inline-flex items-center gap-1 transition-colors"
          >
            <Icon icon="mdi:github" className="w-4 h-4" />
            <span>Laporkan masalah</span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
