import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { 
  uploadMultipleImages, 
  validateImageFile, 
  getThumbnailUrl,
  isCloudinaryConfigured,
  type CloudinaryUploadResult 
} from '../services/imageService';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  language?: 'id' | 'en';
}

const translations = {
  id: {
    addPhoto: 'Tambah Foto',
    dragDrop: 'Drag & drop foto di sini',
    or: 'atau',
    browse: 'Pilih File',
    maxPhotos: 'Maksimal',
    photos: 'foto',
    uploading: 'Mengupload...',
    uploadSuccess: 'Berhasil diupload!',
    uploadError: 'Gagal upload',
    remove: 'Hapus',
    notConfigured: 'Cloudinary belum dikonfigurasi',
    configureInstructions: 'Tambahkan VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di file .env'
  },
  en: {
    addPhoto: 'Add Photo',
    dragDrop: 'Drag & drop photos here',
    or: 'or',
    browse: 'Browse Files',
    maxPhotos: 'Maximum',
    photos: 'photos',
    uploading: 'Uploading...',
    uploadSuccess: 'Upload successful!',
    uploadError: 'Upload failed',
    remove: 'Remove',
    notConfigured: 'Cloudinary not configured',
    configureInstructions: 'Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file'
  }
};

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
  language = 'id'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const configured = isCloudinaryConfigured();

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

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (remainingSlots <= 0) {
      setError(`${t.maxPhotos} ${maxImages} ${t.photos}`);
      return;
    }

    // Limit files to remaining slots
    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    // Validate files
    for (const file of filesToUpload) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || t.uploadError);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    const results = await uploadMultipleImages(
      filesToUpload,
      'ruangkopi-cafes',
      (current, total) => setUploadProgress({ current, total })
    );

    const newImages: string[] = [];
    const errors: string[] = [];

    results.forEach((result: CloudinaryUploadResult) => {
      if (result.success && result.url) {
        newImages.push(result.url);
      } else if (result.error) {
        errors.push(result.error);
      }
    });

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    if (errors.length > 0) {
      setError(errors[0]);
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
  }, [images, maxImages, onImagesChange, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading || !configured) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, isUploading, configured, handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleRemoveImage = useCallback((index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const openFilePicker = useCallback(() => {
    if (!disabled && !isUploading && configured) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading, configured]);

  // Show configuration warning if not set up
  if (!configured) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:alert" className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium text-sm">{t.notConfigured}</p>
            <p className="text-amber-400/70 text-xs mt-1">{t.configureInstructions}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800"
            >
              <img
                src={getThumbnailUrl(url)}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled || isUploading}
                className="absolute top-1 right-1 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
              {/* Image number */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`
            relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
            ${isDragging 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
            }
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <div className="flex flex-col items-center text-center">
            {isUploading ? (
              <>
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mb-3">
                  <Icon icon="mdi:loading" className="w-6 h-6 text-primary-400 animate-spin" />
                </div>
                <p className="text-white font-medium">{t.uploading}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {uploadProgress.current} / {uploadProgress.total}
                </p>
                {/* Progress bar */}
                <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%` 
                    }}
                    className="h-full bg-primary-500 rounded-full"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                  <Icon icon="mdi:image-plus" className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">{t.dragDrop}</p>
                <p className="text-gray-500 text-xs mt-1">{t.or}</p>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFilePicker();
                  }}
                >
                  {t.browse}
                </button>
                <p className="text-gray-500 text-xs mt-3">
                  {t.maxPhotos} {maxImages} {t.photos} • JPG, PNG, WebP, GIF • Max 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-500/20 rounded"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-gray-500 text-xs text-center">
          {images.length} / {maxImages} {t.photos}
        </p>
      )}
    </div>
  );
}
