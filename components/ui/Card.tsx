import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
}) => {
  const baseClasses = [
    'bg-white',
    'rounded-lg',
    'border',
    'border-gray-200',
    'transition-all',
    'duration-200',
  ];

  const paddingClasses = {
    none: [],
    sm: ['p-3'],
    md: ['p-4'],
    lg: ['p-6'],
  };

  const shadowClasses = {
    none: [],
    sm: ['shadow-sm'],
    md: ['shadow-md'],
    lg: ['shadow-lg'],
  };

  const hoverClasses = hover ? ['hover:shadow-lg', 'hover:border-gray-300'] : [];

  const allClasses = [
    ...baseClasses,
    ...paddingClasses[padding],
    ...shadowClasses[shadow],
    ...hoverClasses,
    className,
  ].join(' ');

  return <div className={allClasses}>{children}</div>;
};

export default Card;
