import React, { ReactNode } from 'react';
import ActionButton from './ActionButton';
import { useEscapeKey } from '../../../lib/hooks/useEscapeKey';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'near-full' | 'full';
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Lưu',
  cancelLabel = 'Hủy',
  isSubmitting = false,
  maxWidth = '6xl'
}: FormModalProps) {
  // Add ESC key handler
  useEscapeKey(() => {
    if (!isSubmitting) {
      handleCancel();
    }
  }, isOpen);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const getMaxWidthClass = () => {
    const widthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      'near-full': 'max-w-[95vw]',
      full: 'max-w-full'
    };
    return widthClasses[maxWidth];
  };

  const getModalHeight = () => {
    if (maxWidth === 'near-full') {
      return 'max-h-[95vh]';
    }
    return 'max-h-[90vh]';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className={`relative w-full ${getMaxWidthClass()} mx-2 sm:mx-4`}>
          <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${getModalHeight()} flex flex-col`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-orange-800 truncate pr-4">
                  {title}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  {/* Action Buttons */}
                  {onSubmit && (
                    <ActionButton
                      label={submitLabel}
                      variant="primary"
                      size="sm"
                      onClick={() => onSubmit()}
                      disabled={isSubmitting}
                    />
                  )}
                  <ActionButton
                    label={cancelLabel}
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  />
                  {/* Close X Button */}
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="p-1 rounded-md text-orange-600 hover:text-orange-800 hover:bg-orange-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Đóng (ESC)"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                <div className="text-sm">
                  {children}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Grid Component for consistent layout
export interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FormGrid({ 
  children, 
  columns = 3, 
  gap = 'md',
  className = '' 
}: FormGridProps) {
  const getGridClass = () => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };
    
    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    };
    
    return `grid ${columnClasses[columns]} ${gapClasses[gap]}`;
  };

  return (
    <div className={`${getGridClass()} ${className}`}>
      {children}
    </div>
  );
}

// Form Field Component for consistent styling
export interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormField({ 
  label, 
  children, 
  required = false, 
  error,
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
