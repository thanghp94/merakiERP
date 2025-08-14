import React from 'react';
import DataTable, { TableColumn, TableAction } from './DataTable';
import FilterBar, { FilterConfig } from './FilterBar';

export interface CrudTableProps<T = any> {
  // Data props
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  
  // Filter props
  filters?: Record<string, any>;
  filterConfigs?: FilterConfig[];
  onFilterChange?: (filterKey: string, value: string) => void;
  onClearFilters?: () => void;
  
  // CRUD actions
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: TableAction<T>[];
  
  // UI props
  title?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
  };
  className?: string;
  
  // Table settings
  enableRowClick?: boolean;
  actionColumnWidth?: string;
}

export default function CrudTable<T = any>({
  data,
  columns,
  isLoading = false,
  filters,
  filterConfigs = [],
  onFilterChange,
  onClearFilters,
  onView,
  onEdit,
  onDelete,
  customActions = [],
  title,
  createButtonLabel = 'Thêm mới',
  onCreateClick,
  emptyState,
  className = '',
  enableRowClick = true,
  actionColumnWidth = 'w-32'
}: CrudTableProps<T>): JSX.Element {
  
  // Build standard CRUD actions
  const buildCrudActions = (): TableAction<T>[] => {
    const actions: TableAction<T>[] = [];
    
    // Removed eye icon since users can click on rows to view details
    
    if (onEdit) {
      actions.push({
        label: 'Sửa',
        icon: '✏️',
        onClick: onEdit,
        variant: 'primary',
        iconOnly: true,
        tooltip: 'Chỉnh sửa'
      });
    }
    
    if (onDelete) {
      actions.push({
        label: 'Xóa',
        icon: '🗑️',
        onClick: onDelete,
        variant: 'danger',
        iconOnly: true,
        tooltip: 'Xóa'
      });
    }
    
    // Add custom actions
    return [...actions, ...customActions];
  };

  const actions = buildCrudActions();
  
  // Handle row click - only if enabled and onView is provided
  const handleRowClick = enableRowClick && onView ? onView : undefined;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Bar */}
      {(filterConfigs.length > 0 || onCreateClick) && (
        <FilterBar
          filters={filters || {}}
          filterConfigs={filterConfigs}
          onFilterChange={onFilterChange || (() => {})}
          onClearFilters={onClearFilters || (() => {})}
          actionButton={onCreateClick ? {
            label: createButtonLabel,
            icon: '➕',
            onClick: onCreateClick
          } : undefined}
          isLoading={isLoading}
        />
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {title && (
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">
              {title} ({data.length})
            </h3>
          </div>
        )}
        
        <DataTable
          data={data}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyState={emptyState}
          onRowClick={handleRowClick}
          actionColumnWidth={actionColumnWidth}
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );
}
