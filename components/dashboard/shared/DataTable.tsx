import React from 'react';
import ActionButton from './ActionButton';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  priority?: 'high' | 'medium' | 'low'; // Responsive priority
  hideOnMobile?: boolean; // Hide on mobile screens
  hideOnTablet?: boolean; // Hide on tablet screens
  minWidth?: string; // Minimum width for the column
}

export interface TableAction<T = any> {
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  show?: (row: T) => boolean;
  iconOnly?: boolean;
  tooltip?: string;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  isLoading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
  };
  onRowClick?: (row: T) => void;
  className?: string;
  actionColumnWidth?: string;
}

export default function DataTable<T = any>({
  data,
  columns,
  actions = [],
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
  actionColumnWidth
}: DataTableProps<T>) {
  const defaultEmptyState = {
    icon: (
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Không có dữ liệu',
    description: 'Chưa có dữ liệu nào được tạo.'
  };

  const finalEmptyState = emptyState || defaultEmptyState;

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            {finalEmptyState.icon}
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">{finalEmptyState.title}</h4>
          <p className="text-gray-600">{finalEmptyState.description}</p>
        </div>
      </div>
    );
  }


  // Helper function to get responsive classes for columns
  const getColumnClasses = (column: TableColumn<T>) => {
    let classes = `px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider`;
    
    // Add responsive visibility classes
    if (column.hideOnMobile) {
      classes += ' hidden sm:table-cell';
    }
    if (column.hideOnTablet) {
      classes += ' hidden md:table-cell';
    }
    
    // Add width classes
    if (column.width) {
      classes += ` w-${column.width}`;
    }
    if (column.minWidth) {
      classes += ` min-w-[${column.minWidth}]`;
    }
    
    // Add alignment classes
    if (column.align === 'center') {
      classes += ' text-center';
    } else if (column.align === 'right') {
      classes += ' text-right';
    }
    
    return classes;
  };

  const getCellClasses = (column: TableColumn<T>) => {
    let classes = `px-6 py-2 whitespace-nowrap`;
    
    // Add responsive visibility classes
    if (column.hideOnMobile) {
      classes += ' hidden sm:table-cell';
    }
    if (column.hideOnTablet) {
      classes += ' hidden md:table-cell';
    }
    
    // Add alignment classes
    if (column.align === 'center') {
      classes += ' text-center';
    } else if (column.align === 'right') {
      classes += ' text-right';
    } else {
      classes += ' text-left';
    }
    
    return classes;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={getColumnClasses(column)}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-center text-xs font-semibold text-orange-800 uppercase tracking-wider min-w-[140px] w-auto sticky right-0 bg-gradient-to-r from-orange-50 to-orange-100">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={getCellClasses(column)}
                  >
                    {column.render 
                      ? column.render((row as any)[column.key], row)
                      : (
                        <div className="text-sm text-gray-900">
                          {(row as any)[column.key] || '-'}
                        </div>
                      )
                    }
                  </td>
                ))}
                {actions.length > 0 && (
                  <td 
                    className="px-3 py-1 text-sm font-medium min-w-[140px] w-auto sticky right-0 bg-white"
                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                  >
                    <div className="flex flex-wrap justify-start items-center space-x-1 space-y-0.5">
                      {actions
                        .filter(action => !action.show || action.show(row))
                        .map((action, actionIndex) => (
                          <ActionButton
                            key={actionIndex}
                            label={action.label}
                            icon={action.icon}
                            variant={action.variant}
                            iconOnly={action.iconOnly}
                            tooltip={action.tooltip}
                            onClick={() => action.onClick(row)}
                          />
                        ))
                      }
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
