import React from 'react';
import Button from '../../ui/Button';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  disabled?: boolean;
}

interface FilterBarProps {
  filters: Record<string, string>;
  filterConfigs: FilterConfig[];
  onFilterChange: (filterKey: string, value: string) => void;
  onClearFilters: () => void;
  actionButton?: {
    label: string;
    icon: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  isLoading?: boolean;
}

export default function FilterBar({
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilters,
  actionButton,
  isLoading = false
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-2">
      <div className="flex items-end gap-3">
        {/* Dynamic Filter Dropdowns */}
        {filterConfigs.map((config) => (
          <div key={config.key} className="flex-1 min-w-0">
            <label 
              htmlFor={`${config.key}-filter`} 
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              {config.label}
            </label>
            <select
              id={`${config.key}-filter`}
              value={filters[config.key] || 'all'}
              onChange={(e) => onFilterChange(config.key, e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={config.disabled || isLoading}
            >
              {config.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Clear Filters Button */}
        <Button
          variant="text"
          size="sm"
          onClick={onClearFilters}
          disabled={isLoading}
          className="whitespace-nowrap flex-shrink-0"
        >
          Xóa bộ lọc
        </Button>
        
        {/* Action Button (Add/Create) */}
        {actionButton && (
          <Button
            variant={actionButton.variant === 'secondary' ? 'secondary' : 'primary'}
            size="sm"
            onClick={actionButton.onClick}
            disabled={isLoading}
            className="whitespace-nowrap flex-shrink-0"
          >
            <span className="mr-2">{actionButton.icon}</span>
            <span>{actionButton.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
