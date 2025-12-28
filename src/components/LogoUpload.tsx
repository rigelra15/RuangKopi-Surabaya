import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { 
  uploadImage, 
  validateImageFile, 
  getThumbnailUrl,
  isCloudinaryConfigured,
} from '../services/imageService';

interface LogoUploadProps {
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
  disabled?: boolean;
  language?: 'id' | 'en';
}

const translations = {
  id: {
    uploadLogo: 'Upload Logo',
    dragDrop: 'Drag & drop logo di sini',
    or: 'atau',
    browse: 'Pilih File',
    uploading: 'Mengupload...',
    downloading: 'Mengunduh dari URL...',
    remove: 'Hapus Logo',
    change: 'Ganti Logo',
    notConfigured: 'Cloudinary belum dikonfigurasi',
    urlTab: 'Dari URL',
    fileTab: 'Upload File',
    urlPlaceholder: 'Paste URL gambar di sini...',
    downloadAndUpload: 'Unduh & Upload',
    urlError: 'Gagal mengunduh gambar dari URL. Coba copy gambarnya lalu upload via file.',
    previewLabel: 'Preview:',
    useThisImage: 'Gunakan Gambar Ini',
  },
  en: {
    uploadLogo: 'Upload Logo',
    dragDrop: 'Drag & drop logo here',
    or: 'or',
    browse: 'Browse Files',
    uploading: 'Uploading...',
    downloading: 'Downloading from URL...',
    remove: 'Remove Logo',
    change: 'Change Logo',
    notConfigured: 'Cloudinary not configured',
    urlTab: 'From URL',
    fileTab: 'Upload File',
    urlPlaceholder: 'Paste image URL here...',
    downloadAndUpload: 'Download & Upload',
    urlError: 'Failed to download image from URL. Try copying the image and upload via file.',
    previewLabel: 'Preview:',
    useThisImage: 'Use This Image',
  }
};

// Image proxy services for bypassing CORS
const IMAGE_PROXIES = [
  (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export default function LogoUpload({
  logo,
  onLogoChange,
  disabled = false,
  language = 'id'
}: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const configured = isCloudinaryConfigured();

  // Generate preview using image proxy
  const updatePreview = useCallback((url: string) => {
    if (!url.trim()) {
      setPreviewUrl(null);
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError(false);
    
    // Use weserv.nl as it's specifically designed for image proxying
    const proxiedUrl = IMAGE_PROXIES[0](url);
    setPreviewUrl(proxiedUrl);
  }, []);

  // Handle URL input change with debounced preview
  const handleUrlChange = useCallback((value: string) => {
    setUrlInput(value);
    setPreviewError(false);
    
    // Only update preview for URLs that look like images
    if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || value.includes('instagram') || value.includes('fbcdn')) {
      updatePreview(value);
    } else if (value.trim() === '') {
      setPreviewUrl(null);
    }
  }, [updatePreview]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading && configured) {
      setIsDragging(true);
    }
  }, [disabled, isUploading, configured]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Upload gagal');
      return;
    }

    setIsUploading(true);
    
    const result = await uploadImage(file, 'ruangkopi-logos');
    
    if (result.success && result.url) {
      onLogoChange(result.url);
    } else {
      setError(result.error || 'Upload gagal');
    }
    
    setIsUploading(false);
  }, [onLogoChange]);

  // Download image from URL using proxy and upload to Cloudinary
  const handleUrlUpload = useCallback(async () => {
    if (!urlInput.trim()) return;
    
    setError(null);
    setIsDownloading(true);
    
    // Try each proxy in order
    for (const proxyFn of IMAGE_PROXIES) {
      try {
        const proxyUrl = proxyFn(urlInput);
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'image/*',
          },
        });
        
        if (!response.ok) continue;
        
        const blob = await response.blob();
        
        // Check if it's actually an image
        if (!blob.type.startsWith('image/')) {
          continue;
        }
        
        // Convert blob to file
        const ext = blob.type.split('/')[1] || 'jpg';
        const fileName = `logo_${Date.now()}.${ext}`;
        const file = new File([blob], fileName, { type: blob.type });
        
        setIsDownloading(false);
        setIsUploading(true);
        
        // Upload to Cloudinary
        const result = await uploadImage(file, 'ruangkopi-logos');
        
        if (result.success && result.url) {
          onLogoChange(result.url);
          setUrlInput('');
          setPreviewUrl(null);
          setIsUploading(false);
          return; // Success!
        }
      } catch (err) {
        console.warn('Proxy failed:', err);
        continue; // Try next proxy
      }
    }
    
    // All proxies failed
    setError(t.urlError);
    setIsDownloading(false);
    setIsUploading(false);
  }, [urlInput, onLogoChange, t.urlError]);

  // Use preview as final image (copy from proxy to Cloudinary)
  const handleUsePreview = useCallback(async () => {
    if (!previewUrl) return;
    
    setError(null);
    setIsDownloading(true);
    
    try {
      const response = await fetch(previewUrl);
      
      if (!response.ok) throw new Error('Failed to fetch preview');
      
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      const fileName = `logo_${Date.now()}.${ext}`;
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      
      setIsDownloading(false);
      setIsUploading(true);
      
      const result = await uploadImage(file, 'ruangkopi-logos');
      
      if (result.success && result.url) {
        onLogoChange(result.url);
        setUrlInput('');
        setPreviewUrl(null);
      } else {
        setError(result.error || 'Upload gagal');
      }
    } catch (err) {
      console.error('Error uploading preview:', err);
      setError(t.urlError);
    } finally {
      setIsDownloading(false);
      setIsUploading(false);
    }
  }, [previewUrl, onLogoChange, t.urlError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading || !configured) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, isUploading, configured, handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const openFilePicker = useCallback(() => {
    if (!disabled && !isUploading && configured) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, configured]);

  // Show configuration warning if not set up
  if (!configured) {
    return (
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <Icon icon="mdi:alert" className="w-4 h-4" />
          <span>{t.notConfigured}</span>
        </div>
      </div>
    );
  }

  const isProcessing = isUploading || isDownloading;

  return (
    <div className="space-y-3">
      {/* Current Logo */}
      {logo ? (
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-800 border-2 border-gray-600"
          >
            <img
              src={getThumbnailUrl(logo)}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </motion.div>
          
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onLogoChange(null);
                setActiveTab('file');
              }}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Icon icon="mdi:pencil" className="w-4 h-4" />
              {t.change}
            </button>
            <button
              type="button"
              onClick={() => onLogoChange(null)}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <Icon icon="mdi:delete" className="w-4 h-4" />
              {t.remove}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'file'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon icon="mdi:upload" className="w-4 h-4 inline mr-1.5" />
              {t.fileTab}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'url'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon icon="mdi:link" className="w-4 h-4 inline mr-1.5" />
              {t.urlTab}
            </button>
          </div>

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFilePicker}
              className={`
                relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer
                ${isDragging 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
                }
                ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                {isUploading ? (
                  <>
                    <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center">
                      <Icon icon="mdi:loading" className="w-7 h-7 text-primary-400 animate-spin" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{t.uploading}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center">
                      <Icon icon="mdi:image-area" className="w-7 h-7 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm font-medium">{t.dragDrop}</p>
                      <button
                        type="button"
                        className="mt-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-white text-xs rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                      >
                        {t.browse}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* URL Input Tab */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={t.urlPlaceholder}
                  disabled={disabled || isProcessing}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>

              {/* URL Preview */}
              {urlInput.trim() && (
                <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">{t.previewLabel}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {previewLoading && !previewError && (
                        <Icon icon="mdi:loading" className="w-6 h-6 text-gray-400 animate-spin" />
                      )}
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className={`w-full h-full object-contain ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => {
                            setPreviewLoading(false);
                            setPreviewError(false);
                          }}
                          onError={() => {
                            setPreviewLoading(false);
                            setPreviewError(true);
                          }}
                        />
                      )}
                      {previewError && (
                        <Icon icon="mdi:image-off" className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {!previewError ? (
                        <button
                          type="button"
                          onClick={handleUsePreview}
                          disabled={disabled || isProcessing || previewLoading}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                              {t.downloading}
                            </>
                          ) : isUploading ? (
                            <>
                              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                              {t.uploading}
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:check" className="w-4 h-4" />
                              {t.useThisImage}
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Preview tidak tersedia, coba upload langsung
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback download button */}
              {urlInput.trim() && previewError && (
                <button
                  type="button"
                  onClick={handleUrlUpload}
                  disabled={disabled || isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                      {t.downloading}
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:download" className="w-4 h-4" />
                      {t.downloadAndUpload}
                    </>
                  )}
                </button>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Paste link gambar dari Instagram, Facebook, dll.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg"
          >
            <Icon icon="mdi:alert-circle" className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-xs">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-500/20 rounded"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
