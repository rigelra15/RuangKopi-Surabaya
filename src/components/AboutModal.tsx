import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getVersionInfo } from '../services/versionService';

interface AboutModalProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onOpenChangelog: () => void;
}

export default function AboutModal({
  isDarkMode,
  language,
  isOpen,
  onClose,
  onOpenChangelog,
}: AboutModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [version, setVersion] = useState('1.0.0');
  const [commitCount, setCommitCount] = useState(0);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      
      // Fetch version info - loading state handled in promise callbacks
      getVersionInfo().then((info) => {
        setVersion(info.version);
        setCommitCount(info.commitCount);
        setIsLoadingVersion(false);
      }).catch(() => {
        setIsLoadingVersion(false);
      });
    }
    return () => setIsVisible(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleOpenChangelog = () => {
    handleClose();
    setTimeout(onOpenChangelog, 350);
  };

  if (!isOpen) return null;

  const content = {
    id: {
      title: 'Tentang RuangKopi',
      version: 'Versi',
      commits: 'commit',
      description: 'Aplikasi peta interaktif untuk menemukan cafe-cafe terbaik di Surabaya. Dibangun dengan React, TypeScript, dan Leaflet.',
      features: 'Fitur',
      featureList: [
        'Peta interaktif dengan data real-time dari OpenStreetMap',
        'Filter cafe berdasarkan jarak dari lokasi Anda',
        'Simpan cafe favorit',
        'Dukungan dark mode dan multi-bahasa',
      ],
      techStack: 'Teknologi',
      contribute: 'Kontribusi',
      contributeText: 'Tertarik untuk berkontribusi? Kunjungi repository GitHub kami!',
      githubButton: 'Lihat di GitHub',
      dataSource: 'Sumber Data',
      dataSourceText: 'Data cafe diambil dari OpenStreetMap melalui Overpass API.',
      changelog: 'Lihat Changelog',
      credit: 'Dibuat oleh',
      close: 'Tutup',
    },
    en: {
      title: 'About RuangKopi',
      version: 'Version',
      commits: 'commits',
      description: 'An interactive map app to find the best cafes in Surabaya. Built with React, TypeScript, and Leaflet.',
      features: 'Features',
      featureList: [
        'Interactive map with real-time data from OpenStreetMap',
        'Filter cafes by distance from your location',
        'Save favorite cafes',
        'Dark mode and multi-language support',
      ],
      techStack: 'Tech Stack',
      contribute: 'Contribute',
      contributeText: 'Interested in contributing? Visit our GitHub repository!',
      githubButton: 'View on GitHub',
      dataSource: 'Data Source',
      dataSourceText: 'Cafe data is fetched from OpenStreetMap via Overpass API.',
      changelog: 'View Changelog',
      credit: 'Created by',
      close: 'Close',
    },
  };

  const t = content[language];

  const techList = [
    { name: 'React 19', icon: 'mdi:react' },
    { name: 'TypeScript', icon: 'mdi:language-typescript' },
    { name: 'Vite', icon: 'simple-icons:vite' },
    { name: 'Leaflet', icon: 'simple-icons:leaflet' },
    { name: 'TailwindCSS', icon: 'mdi:tailwind' },
  ];

  return (
    <div
      className={`
        fixed inset-0 z-[2000] flex items-center justify-center p-4
        transition-all duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 backdrop-blur-sm
          ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}
        `}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto
          rounded-3xl
          shadow-2xl
          transition-all duration-300
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
          ${isDarkMode
            ? 'bg-gray-900 border border-gray-700/50'
            : 'bg-white border border-gray-200/50'
          }
        `}
      >
        {/* Header */}
        <div
          className={`
            sticky top-0 px-6 py-5 border-b
            ${isDarkMode
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-100'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`
                  p-2 rounded-xl
                  ${isDarkMode ? 'bg-primary-600' : 'bg-primary-500'}
                `}
              >
                <Icon icon="mdi:coffee" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2
                  className={`
                    text-lg font-bold
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}
                  `}
                >
                  {t.title}
                </h2>
                <div className="flex items-center gap-2">
                  {isLoadingVersion ? (
                    <Icon icon="mdi:loading" className="w-3 h-3 animate-spin text-gray-500" />
                  ) : (
                    <>
                      <span className="text-xs text-gray-500">
                        {t.version} {version}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                      <span className="text-xs text-gray-500">
                        {commitCount} {t.commits}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-xl transition-colors
                ${isDarkMode
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
                }
              `}
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Description */}
          <p
            className={`
              text-sm leading-relaxed
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            `}
          >
            {t.description}
          </p>

          <button
            onClick={handleOpenChangelog}
            className={`
              w-full p-4 rounded-xl border transition-all
              flex items-center justify-between group
              ${isDarkMode
                ? 'bg-primary-900/20 border-primary-800/50 hover:bg-primary-900/30'
                : 'bg-primary-50 border-primary-100 hover:bg-primary-100'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  p-2 rounded-lg
                  ${isDarkMode ? 'bg-primary-600' : 'bg-primary-500'}
                `}
              >
                <Icon icon="mdi:history" className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p
                  className={`
                    text-sm font-semibold
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}
                  `}
                >
                  {t.changelog}
                </p>
                <p
                  className={`
                    text-xs
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  `}
                >
                  {language === 'id' ? 'Lihat riwayat perubahan aplikasi' : 'See app change history'}
                </p>
              </div>
            </div>
            <Icon 
              icon="mdi:chevron-right" 
              className={`
                w-5 h-5 transition-transform group-hover:translate-x-1
                ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              `} 
            />
          </button>

          {/* Features */}
          <div>
            <h3
              className={`
                text-sm font-semibold mb-3 flex items-center gap-2
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}
            >
              <Icon icon="mdi:star" className="w-4 h-4 text-primary-500" />
              {t.features}
            </h3>
            <ul className="space-y-2">
              {t.featureList.map((feature, index) => (
                <li
                  key={index}
                  className={`
                    flex items-start gap-2 text-sm
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                  `}
                >
                  <Icon icon="mdi:check-circle" className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3
              className={`
                text-sm font-semibold mb-3 flex items-center gap-2
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}
            >
              <Icon icon="mdi:code-tags" className="w-4 h-4 text-primary-500" />
              {t.techStack}
            </h3>
            <div className="flex flex-wrap gap-2">
              {techList.map((tech, index) => (
                <span
                  key={index}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    ${isDarkMode
                      ? 'bg-gray-800 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <Icon icon={tech.icon} className="w-3.5 h-3.5" />
                  {tech.name}
                </span>
              ))}
            </div>
          </div>

          {/* Data Source */}
          <div
            className={`
              p-4 rounded-xl
              ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}
            `}
          >
            <h3
              className={`
                text-sm font-semibold mb-2 flex items-center gap-2
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}
            >
              <Icon icon="mdi:database" className="w-4 h-4 text-primary-500" />
              {t.dataSource}
            </h3>
            <p
              className={`
                text-xs
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              {t.dataSourceText}
            </p>
          </div>

          {/* Contribute */}
          <div
            className={`
              p-4 rounded-xl border
              ${isDarkMode
                ? 'bg-primary-900/20 border-primary-800/50'
                : 'bg-primary-50 border-primary-100'
              }
            `}
          >
            <h3
              className={`
                text-sm font-semibold mb-2 flex items-center gap-2
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}
            >
              <Icon icon="mdi:source-branch" className="w-4 h-4 text-primary-500" />
              {t.contribute}
            </h3>
            <p
              className={`
                text-xs mb-3
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              {t.contributeText}
            </p>
            <a
              href="https://github.com/rigelra15/RuangKopi-Surabaya"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                text-sm font-medium text-white
                bg-gray-900 hover:bg-gray-800
                transition-colors
              `}
            >
              <Icon icon="mdi:github" className="w-4 h-4" />
              {t.githubButton}
            </a>
          </div>

          {/* Credit */}
          <div className="text-center pt-2">
            <p
              className={`
                text-xs
                ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              `}
            >
              {t.credit}{' '}
              <a 
                href="https://github.com/rigelra15"
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  hover:underline transition-colors
                  ${isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'}
                `}
              >
                Rigel Ramadhani Waloni
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`
            sticky bottom-0 px-6 py-4 border-t
            ${isDarkMode
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-100'
            }
          `}
        >
          <button
            onClick={handleClose}
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
          </button>
        </div>
      </div>
    </div>
  );
}
