import React from 'react';

export interface ActionButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({
  label,
  icon,
  onClick,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  className = ''
}: ActionButtonProps) {
  const getButtonClass = () => {
    const baseClass = "inline-flex items-center border border-transparent font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    // Variant classes
    const variantClasses = {
      primary: 'text-orange-700 bg-orange-100 hover:bg-orange-200 focus:ring-orange-500 disabled:hover:bg-orange-100',
      secondary: 'text-teal-700 bg-teal-100 hover:bg-teal-200 focus:ring-teal-500 disabled:hover:bg-teal-100',
      danger: 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500 disabled:hover:bg-red-100'
    };
    
    return `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClass()}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );
}
