import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-md',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'min-h-[44px]', // Touch target size
  ];

  const variantClasses = {
    primary: [
      'bg-orange-500',
      'text-white',
      'border-transparent',
      'hover:bg-orange-600',
      'focus:ring-orange-500',
      'active:bg-orange-700',
    ],
    secondary: [
      'bg-transparent',
      'text-orange-500',
      'border-2',
      'border-orange-500',
      'hover:bg-orange-500',
      'hover:text-white',
      'focus:ring-orange-500',
    ],
    text: [
      'bg-transparent',
      'text-teal-600',
      'border-transparent',
      'hover:text-teal-700',
      'hover:underline',
      'focus:ring-teal-500',
    ],
    danger: [
      'bg-red-500',
      'text-white',
      'border-transparent',
      'hover:bg-red-600',
      'focus:ring-red-500',
      'active:bg-red-700',
    ],
  };

  const sizeClasses = {
    sm: ['px-3', 'py-2', 'text-sm'],
    md: ['px-4', 'py-2', 'text-base'],
    lg: ['px-6', 'py-3', 'text-lg'],
  };

  const widthClasses = fullWidth ? ['w-full'] : [];

  const allClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    ...widthClasses,
    className,
  ].join(' ');

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
