import React, { useState } from 'react';
import { Employee } from '@/shared/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { ForeignTeachersTabCrudProps, ModalState } from './types/foreign-teachers.types';
import { useForeignTeachersData } from './hooks/useForeignTeachersData';
import ForeignTeachersTable from './ForeignTeachersTable';
import ForeignTeachersFormModal from './ForeignTeachersFormModal';

export default function ForeignTeachersCrudContainer({
  employees,
  isLoading,
  onSubmit,
  onEdit,
  onDelete,
  onView,
  onWorkSchedule
}: ForeignTeachersTabCrudProps) {
  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    employee: null
  });

  // Load enum data
  const { positionOptions, departmentOptions, isLoadingEnums } = useForeignTeachersData();

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
      <ForeignTeachersTable
        employees={employees}
        isLoading={isLoading}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onDelete={onDelete}
        onWorkSchedule={onWorkSchedule}
        onCreateClick={handleCreateClick}
      />

      {/* Employee Modal */}
      {modalState.isOpen && (
        <ForeignTeachersFormModal
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
