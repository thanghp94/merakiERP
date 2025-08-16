import React from 'react';
import FinancesTabCrud from '../../crud/FinancesTabCrud';
import { Finance, Student } from '../../shared/types';

interface FinancesTabProps {
  showFinanceForm: boolean;
  setShowFinanceForm: (show: boolean) => void;
  finances: Finance[];
  students: Student[];
  isLoadingFinances: boolean;
  handleFormSubmit: (data: any, formType: string) => void;
}

export default function FinancesTab({
  showFinanceForm,
  setShowFinanceForm,
  finances,
  students,
  isLoadingFinances,
  handleFormSubmit
}: FinancesTabProps) {
  const handleSubmit = async (data: any, formType: string) => {
    if (formType === 'RefreshFinances') {
      // Just refresh the finances list - this would be handled by parent component
      return;
    }

    await handleFormSubmit(data, formType);
  };

  const handleViewFinance = (finance: Finance) => {
    // TODO: Implement view finance details modal
    console.log('View finance:', finance);
  };

  const handleEditFinance = (finance: Finance) => {
    // TODO: Implement edit finance functionality with modal
    console.log('Edit finance:', finance);
  };

  const handleDeleteFinance = async (finance: Finance) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khoản tài chính này?`)) {
      try {
        const response = await fetch(`/api/finances/${finance.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Refresh the finances list by calling the parent's form submit handler
          await handleFormSubmit({ refresh: true }, 'RefreshFinances');
          alert('Xóa khoản tài chính thành công!');
        } else {
          alert(`Lỗi khi xóa khoản tài chính: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting finance:', error);
        alert('Có lỗi xảy ra khi xóa khoản tài chính');
      }
    }
  };

  return (
    <div className="space-y-6">
      <FinancesTabCrud
        finances={finances}
        students={students}
        isLoading={isLoadingFinances}
        onSubmit={handleSubmit}
        onView={handleViewFinance}
        onEdit={handleEditFinance}
        onDelete={handleDeleteFinance}
      />
    </div>
  );
}
