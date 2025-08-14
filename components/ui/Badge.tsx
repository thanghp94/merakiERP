import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'font-medium',
    'rounded-full',
    'text-center',
    'whitespace-nowrap',
  ];

  const variantClasses = {
    default: [
      'bg-gray-100',
      'text-gray-800',
    ],
    success: [
      'bg-green-100',
      'text-green-800',
    ],
    warning: [
      'bg-yellow-100',
      'text-yellow-800',
    ],
    error: [
      'bg-red-100',
      'text-red-800',
    ],
    info: [
      'bg-blue-100',
      'text-blue-800',
    ],
    secondary: [
      'bg-teal-100',
      'text-teal-800',
    ],
  };

  const sizeClasses = {
    sm: ['px-2', 'py-0.5', 'text-xs'],
    md: ['px-2.5', 'py-0.5', 'text-sm'],
    lg: ['px-3', 'py-1', 'text-base'],
  };

  const allClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    className,
  ].join(' ');

  return <span className={allClasses}>{children}</span>;
};

export default Badge;
