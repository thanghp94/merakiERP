import React, { useState, useRef } from 'react';
import { compressMediaFile, formatFileSize, isImage, isVideo } from '../../../lib/utils/media-compression';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  originalSize: number;
  compressedSize?: number;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionInfo?: {
    lessonName: string;
    className: string;
    time: string;
  };
}

const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionInfo
}) => {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    setIsCompressing(true);
    setUploadStatus('compressing');
    
    try {
      const processedFiles: MediaFile[] = [];
      
      for (const file of files) {
        // Check file size
        if (file.size > maxFileSize) {
          alert(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`);
          continue;
        }

        // Check file type
        if (!isImage(file) && !isVideo(file)) {
          alert(`File ${file.name} is not a supported image or video format.`);
          continue;
        }

        try {
          // Compress the file
          const compressedFile = await compressMediaFile(file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
            maxSizeKB: 500
          });

          // Create preview URL
          const preview = URL.createObjectURL(compressedFile);
          
          processedFiles.push({
            file: compressedFile,
            preview,
            type: isImage(file) ? 'image' : 'video',
            originalSize: file.size,
            compressedSize: compressedFile.size
          });
        } catch (compressionError) {
          console.error(`Error compressing ${file.name}:`, compressionError);
          // If compression fails, use original file (if it's small enough)
          if (file.size <= 2 * 1024 * 1024) { // 2MB fallback
            const preview = URL.createObjectURL(file);
            processedFiles.push({
              file,
              preview,
              type: isImage(file) ? 'image' : 'video',
              originalSize: file.size
            });
          } else {
            alert(`Failed to compress ${file.name}. File too large.`);
          }
        }
      }

      setSelectedFiles(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      setErrorMessage('Error processing files');
    } finally {
      setIsCompressing(false);
      setUploadStatus('idle');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const uploadPromises = selectedFiles.map(async (mediaFile, index) => {
        const formData = new FormData();
        formData.append('file', mediaFile.file);
        formData.append('sessionId', sessionId);
        formData.append('className', sessionInfo?.className || 'Unknown Class');
        formData.append('sessionName', sessionInfo?.lessonName || 'Unknown Session');

        const response = await fetch('/api/sessions/upload-media-supabase', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const result = await response.json();
        
        // Update progress
        const progress = ((index + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);
        
        return result;
      });

      await Promise.all(uploadPromises);
      
      setUploadStatus('success');
      setUploadProgress(100);
      
      // Clear selected files
      selectedFiles.forEach(mediaFile => {
        URL.revokeObjectURL(mediaFile.preview);
      });
      setSelectedFiles([]);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading || isCompressing) return; // Prevent closing during upload/compression
    
    // Clean up object URLs
    selectedFiles.forEach(mediaFile => {
      URL.revokeObjectURL(mediaFile.preview);
    });
    setSelectedFiles([]);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-teal-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">📷 Upload Media</h2>
              {sessionInfo && (
                <p className="text-sm opacity-90">
                  {sessionInfo.lessonName} - {sessionInfo.className}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading || isCompressing}
              className="text-white hover:text-gray-200 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* File Selection */}
          <div className="mb-6">
            <div
              onClick={() => !isCompressing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors ${
                isCompressing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isCompressing ? 'Processing files...' : 'Click to select images or videos'}
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, GIF, MP4, MOV (Max {formatFileSize(maxFileSize)} each)
              </p>
              <p className="text-xs text-orange-600 mt-2">
                Files will be automatically compressed for optimal viewing
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isCompressing}
            />
          </div>

          {/* Compression Status */}
          {uploadStatus === 'compressing' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                <span className="text-blue-700 font-medium">
                  Compressing files for optimal size...
                </span>
              </div>
            </div>
          )}

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedFiles.map((mediaFile, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {mediaFile.type === 'image' ? (
                        <img
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={mediaFile.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>
                    
                    {/* File info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                      <p className="truncate">{mediaFile.file.name}</p>
                      <div className="flex justify-between">
                        <span>{formatFileSize(mediaFile.file.size)}</span>
                        {mediaFile.compressedSize && mediaFile.compressedSize !== mediaFile.originalSize && (
                          <span className="text-green-300">
                            ↓{Math.round((1 - mediaFile.compressedSize / mediaFile.originalSize) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isUploading || isCompressing}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      ×
                    </button>
                    
                    {/* File type indicator */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {mediaFile.type === 'image' ? '🖼️' : '🎥'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 text-xl mr-2">✅</span>
                <span className="text-green-700 font-medium">
                  Files uploaded successfully to Supabase Storage!
                </span>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">❌</span>
                <span className="text-red-700 font-medium">
                  Upload failed: {errorMessage}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Files will be organized in Supabase Storage by class and session
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading || isCompressing}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading || isCompressing}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : isCompressing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  📤 Upload to Storage
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadModal;
