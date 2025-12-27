import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { submitIssueReport, type IssueReportData } from '../services/customCafeService';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  language: 'id' | 'en';
  cafeId: string;
  cafeName: string;
  onSuccess?: () => void;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  isDarkMode,
  language,
  cafeId,
  cafeName,
  onSuccess,
}: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<IssueReportData['issueType']>('wrong_info');
  const [description, setDescription] = useState('');
  const [suggestedFix, setSuggestedFix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = {
    id: {
      title: 'Laporkan Masalah',
      subtitle: 'Bantu kami memperbaiki informasi',
      issueType: 'Jenis Masalah',
      wrongInfo: 'Informasi Salah',
      closed: 'Tempat Sudah Tutup',
      wrongLocation: 'Lokasi Tidak Tepat',
      addInfo: 'Tambah Informasi',
      other: 'Lainnya',
      description: 'Jelaskan masalahnya',
      descriptionPlaceholder: 'Contoh: Jam buka salah, seharusnya buka jam 9 pagi...',
      suggestedFix: 'Saran perbaikan (opsional)',
      suggestedFixPlaceholder: 'Contoh: Jam buka yang benar adalah 09:00-22:00',
      submit: 'Kirim Laporan',
      submitting: 'Mengirim...',
      success: 'Terima kasih! Laporan Anda telah diterima.',
      cancel: 'Batal',
      close: 'Tutup',
    },
    en: {
      title: 'Report an Issue',
      subtitle: 'Help us improve the information',
      issueType: 'Issue Type',
      wrongInfo: 'Wrong Information',
      closed: 'Place Closed',
      wrongLocation: 'Wrong Location',
      addInfo: 'Add Information',
      other: 'Other',
      description: 'Describe the issue',
      descriptionPlaceholder: 'Example: Opening hours are wrong, should be opens at 9am...',
      suggestedFix: 'Suggested fix (optional)',
      suggestedFixPlaceholder: 'Example: Correct hours are 09:00-22:00',
      submit: 'Submit Report',
      submitting: 'Submitting...',
      success: 'Thank you! Your report has been received.',
      cancel: 'Cancel',
      close: 'Close',
    },
  };

  const text = t[language];

  const issueTypes = [
    { value: 'wrong_info' as const, label: text.wrongInfo, icon: 'mdi:alert-circle' },
    { value: 'closed' as const, label: text.closed, icon: 'mdi:door-closed' },
    { value: 'wrong_location' as const, label: text.wrongLocation, icon: 'mdi:map-marker-off' },
    { value: 'add_info' as const, label: text.addInfo, icon: 'mdi:plus-circle' },
    { value: 'other' as const, label: text.other, icon: 'mdi:help-circle' },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await submitIssueReport({
        cafeId,
        cafeName,
        issueType,
        description: description.trim(),
        suggestedFix: suggestedFix.trim() || undefined,
      });
      setIsSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setDescription('');
        setSuggestedFix('');
        setIssueType('wrong_info');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500/50
    ${isDarkMode 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
    }
  `;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
              relative w-full max-w-lg max-h-[90vh] overflow-hidden
              rounded-3xl shadow-2xl
              ${isDarkMode ? 'bg-gray-900' : 'bg-white'}
            `}
          >
            {/* Header */}
            <div className={`
              sticky top-0 z-10 px-6 py-4 border-b
              ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
            `}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {text.title}
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {cafeName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`
                    p-2 rounded-xl transition-colors
                    ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
                  `}
                >
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:check-circle" className="w-10 h-10 text-green-500" />
                  </div>
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {text.success}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Issue type selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {text.issueType}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {issueTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setIssueType(type.value)}
                          className={`
                            flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all
                            ${issueType === type.value
                              ? 'bg-primary-500 text-white'
                              : isDarkMode
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <Icon icon={type.icon} className="w-4 h-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {text.description} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={text.descriptionPlaceholder}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  {/* Suggested fix */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {text.suggestedFix}
                    </label>
                    <textarea
                      value={suggestedFix}
                      onChange={(e) => setSuggestedFix(e.target.value)}
                      placeholder={text.suggestedFixPlaceholder}
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isSuccess && (
              <div className={`
                sticky bottom-0 px-6 py-4 border-t flex gap-3
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
              `}>
                <button
                  onClick={onClose}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-medium transition-colors
                    ${isDarkMode 
                      ? 'bg-gray-800 text-white hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {text.cancel}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim()}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-medium transition-colors
                    bg-primary-500 text-white hover:bg-primary-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {isSubmitting && <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? text.submitting : text.submit}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
