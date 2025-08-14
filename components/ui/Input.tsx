import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputClasses = [
    'block',
    'px-3',
    'py-2',
    'border',
    'rounded-md',
    'text-sm',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-orange-500',
    'focus:border-orange-500',
    'disabled:bg-gray-50',
    'disabled:text-gray-500',
    'disabled:cursor-not-allowed',
    'min-h-[44px]', // Touch target size
  ];

  const stateClasses = error
    ? ['border-red-300', 'text-red-900', 'placeholder-red-300', 'focus:ring-red-500', 'focus:border-red-500']
    : ['border-gray-300', 'text-gray-900', 'placeholder-gray-400'];

  const widthClasses = fullWidth ? ['w-full'] : [];

  const paddingClasses = [];
  if (startIcon) paddingClasses.push('pl-10');
  if (endIcon) paddingClasses.push('pr-10');

  const inputClasses = [
    ...baseInputClasses,
    ...stateClasses,
    ...widthClasses,
    ...paddingClasses,
    className,
  ].join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{startIcon}</div>
          </div>
        )}
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{endIcon}</div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
