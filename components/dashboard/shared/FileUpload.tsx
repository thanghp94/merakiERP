import React, { useState, useRef } from 'react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect?: (file: File | null) => void;
  currentFile?: string; // URL of current file
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function FileUpload({
  label = 'Chọn file',
  accept = 'image/*',
  maxSize = 5, // 5MB default
  onFileSelect,
  currentFile,
  error,
  disabled = false,
  required = false,
  className = ''
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      onFileSelect?.(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File quá lớn. Kích thước tối đa là ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      alert('Định dạng file không được hỗ trợ');
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    onFileSelect?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentFile;
  const fileName = selectedFile?.name || (currentFile ? 'File hiện tại' : '');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200
          ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-orange-400 hover:bg-orange-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {displayImage ? (
          <div className="relative">
            <img
              src={displayImage}
              alt="Preview"
              className="mx-auto max-h-32 max-w-full object-contain rounded"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ×
            </button>
            {fileName && (
              <p className="mt-2 text-xs text-gray-600 truncate">{fileName}</p>
            )}
          </div>
        ) : (
          <div className="py-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-orange-600">{label}</span>
                {!disabled && ' hoặc kéo thả file vào đây'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept.includes('image') ? 'PNG, JPG, GIF' : 'Các định dạng được hỗ trợ'} tối đa {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* File info */}
      {selectedFile && !displayImage && (
        <div className="flex items-center justify-between bg-gray-50 rounded p-2">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
