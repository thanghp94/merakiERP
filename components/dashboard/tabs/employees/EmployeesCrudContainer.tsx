import React, { useState } from 'react';
import { Employee } from '@/shared/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { EmployeesTabCrudProps, ModalState } from './types/employees.types';
import { useEmployeesData } from './hooks/useEmployeesData';
import { useEmployeesFilters } from './hooks/useEmployeesFilters';
import EmployeesTable from './EmployeesTable';
import EmployeesFormModal from './EmployeesFormModal';

export default function EmployeesCrudContainer({
  employees,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onWorkSchedule
}: EmployeesTabCrudProps) {
  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    employee: null
  });

  // Load enum data
  const { positionOptions, departmentOptions, isLoadingEnums } = useEmployeesData();

  // Handle filtering
  const { filters, filteredEmployees, handleFilterChange, handleClearFilters } = useEmployeesFilters(employees);

  // ESC key handler for modal
  useEscapeKey(() => handleModalClose(), modalState.isOpen);

  // Modal handlers
  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      employee: null
    });
  };

  const handleCreateClick = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      employee: null
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      employee: employee
    });
  };

  const handleViewEmployee = (employee: Employee) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      employee: employee
    });
  };

  return (
    <div className="space-y-6">
      <EmployeesTable
        employees={filteredEmployees}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={onDelete}
        onWorkSchedule={onWorkSchedule}
        onCreateClick={handleCreateClick}
      />

      {/* Employee Modal */}
      {modalState.isOpen && (
        <EmployeesFormModal
          modalState={modalState}
          onClose={handleModalClose}
          onSubmit={onSubmit}
          positionOptions={positionOptions}
          departmentOptions={departmentOptions}
          isLoadingEnums={isLoadingEnums}
        />
      )}
    </div>
  );
}
