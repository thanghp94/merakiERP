import React from 'react';

export interface ActionButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  iconOnly?: boolean;
  tooltip?: string;
}

export default function ActionButton({
  label,
  icon,
  onClick,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  className = '',
  iconOnly = false,
  tooltip
}: ActionButtonProps) {
  const getButtonClass = () => {
    const baseClass = "inline-flex items-center justify-center border border-transparent font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Size classes - different for icon-only vs with text
    const sizeClasses = iconOnly ? {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base'
    } : {
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

  const buttonContent = iconOnly ? (
    <span className="flex items-center justify-center">{icon}</span>
  ) : (
    <>
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </>
  );

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClass()}
      title={tooltip || (iconOnly ? label : undefined)}
    >
      {buttonContent}
    </button>
  );

  return button;
}
