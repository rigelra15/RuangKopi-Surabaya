import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getVersionInfo, formatCommitDate, type CommitInfo } from '../services/versionService';

interface ChangelogModalProps {
  isDarkMode: boolean;
  language: 'id' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({
  isDarkMode,
  language,
  isOpen,
  onClose,
}: ChangelogModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState('1.0.0');
  const [commitCount, setCommitCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      
      // Fetch commits - setIsLoading is called in promise callbacks
      getVersionInfo().then((info) => {
        setCommits(info.commits);
        setVersion(info.version);
        setCommitCount(info.commitCount);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
    return () => setIsVisible(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  const content = {
    id: {
      title: 'Changelog',
      subtitle: 'Riwayat Perubahan',
      version: 'Versi',
      commits: 'total commit',
      loading: 'Memuat riwayat...',
      noCommits: 'Tidak ada riwayat commit',
      viewOnGithub: 'Lihat di GitHub',
      close: 'Tutup',
    },
    en: {
      title: 'Changelog',
      subtitle: 'Change History',
      version: 'Version',
      commits: 'total commits',
      loading: 'Loading history...',
      noCommits: 'No commit history',
      viewOnGithub: 'View on GitHub',
      close: 'Close',
    },
  };

  const t = content[language];

  // Group commits by date
  const groupedCommits: { [key: string]: CommitInfo[] } = {};
  commits.forEach((commit) => {
    const date = new Date(commit.date).toLocaleDateString(
      language === 'id' ? 'id-ID' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
    if (!groupedCommits[date]) {
      groupedCommits[date] = [];
    }
    groupedCommits[date].push(commit);
  });

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
          relative w-full max-w-lg mx-auto max-h-[85vh] flex flex-col
          rounded-3xl overflow-hidden
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
            flex-shrink-0 px-6 py-5 border-b
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
                <Icon icon="mdi:history" className="w-6 h-6 text-white" />
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
                <p className="text-xs text-gray-500">
                  {t.version} {version} • {commitCount} {t.commits}
                </p>
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon 
                icon="mdi:loading" 
                className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
              />
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.loading}
              </p>
            </div>
          ) : commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon 
                icon="mdi:source-commit" 
                className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} 
              />
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.noCommits}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCommits).map(([date, dateCommits]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon 
                      icon="mdi:calendar" 
                      className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} 
                    />
                    <span
                      className={`
                        text-xs font-semibold uppercase tracking-wide
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                      `}
                    >
                      {date}
                    </span>
                  </div>
                  
                  {/* Commits for this date */}
                  <div className="space-y-2 ml-1">
                    {dateCommits.map((commit) => (
                      <a
                        key={commit.sha}
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          block p-3 rounded-xl transition-all
                          border-l-2 border-primary-500
                          ${isDarkMode
                            ? 'bg-gray-800/50 hover:bg-gray-800'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`
                              text-sm font-medium flex-1
                              ${isDarkMode ? 'text-white' : 'text-gray-900'}
                            `}
                          >
                            {commit.message}
                          </p>
                          <code
                            className={`
                              text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0
                              ${isDarkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-200 text-gray-600'
                              }
                            `}
                          >
                            {commit.sha}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Icon 
                            icon="mdi:account" 
                            className={`w-3 h-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} 
                          />
                          <span
                            className={`
                              text-xs
                              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                            `}
                          >
                            {commit.author}
                          </span>
                          <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>•</span>
                          <span
                            className={`
                              text-xs
                              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                            `}
                          >
                            {formatCommitDate(commit.date, language)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`
            flex-shrink-0 px-6 py-4 border-t
            ${isDarkMode
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-100'
            }
          `}
        >
          <div className="flex gap-3">
            <a
              href="https://github.com/rigelra15/RuangKopi-Surabaya/commits/main"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex-1 py-2.5 px-4 rounded-xl
                font-medium text-sm text-center
                flex items-center justify-center gap-2
                ${isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }
                transition-colors
              `}
            >
              <Icon icon="mdi:github" className="w-4 h-4" />
              {t.viewOnGithub}
            </a>
            <button
              onClick={handleClose}
              className={`
                py-2.5 px-6 rounded-xl
                font-medium text-sm
                bg-primary-500 hover:bg-primary-400 text-white
                transition-colors
              `}
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
