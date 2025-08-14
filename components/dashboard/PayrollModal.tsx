import React, { useState } from 'react';
import { FormModal, FormGrid, FormField } from './shared';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  recordForm: {
    employee_id: string;
    payroll_period_id: string;
    base_salary: string;
    working_days: string;
    actual_working_days: string;
    allowances: {
      transport: string;
      lunch: string;
      phone: string;
    };
    bonuses: {
      performance: string;
      holiday: string;
    };
    other_deductions: {
      advance: string;
      union_fee: string;
    };
    dependents: string;
  };
  setRecordForm: (form: any) => void;
  employees: Array<{
    id: string;
    full_name: string;
    employee_code: string;
  }>;
}

export default function PayrollModal({
  isOpen,
  onClose,
  onSubmit,
  recordForm,
  setRecordForm,
  employees
}: PayrollModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({} as React.FormEvent);
    } catch (error) {
      console.error('Error submitting payroll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo bảng lương mới"
      onSubmit={handleModalSubmit}
      onCancel={handleModalCancel}
      submitLabel="Tạo bảng lương"
      cancelLabel="Hủy"
      isSubmitting={isSubmitting}
      maxWidth="6xl"
    >
      {/* Basic Information */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        <FormGrid columns={5} gap="md">
          <FormField label="Nhân viên" required>
            <select
              value={recordForm.employee_id}
              onChange={(e) => setRecordForm({...recordForm, employee_id: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Chọn nhân viên</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Lương cơ bản (VND)" required>
            <input
              type="number"
              value={recordForm.base_salary}
              onChange={(e) => setRecordForm({...recordForm, base_salary: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="15000000"
              required
            />
          </FormField>

          <FormField label="Số ngày làm việc chuẩn">
            <input
              type="number"
              value={recordForm.working_days}
              onChange={(e) => setRecordForm({...recordForm, working_days: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="26"
            />
          </FormField>

          <FormField label="Số ngày làm việc thực tế">
            <input
              type="number"
              value={recordForm.actual_working_days}
              onChange={(e) => setRecordForm({...recordForm, actual_working_days: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="26"
            />
          </FormField>

          <FormField label="Số người phụ thuộc">
            <input
              type="number"
              value={recordForm.dependents}
              onChange={(e) => setRecordForm({...recordForm, dependents: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Allowances */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Phụ cấp</h3>
        <FormGrid columns={3} gap="md">
          <FormField label="Phụ cấp đi lại (VND)">
            <input
              type="number"
              value={recordForm.allowances.transport}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                allowances: {...recordForm.allowances, transport: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>

          <FormField label="Phụ cấp ăn trưa (VND)">
            <input
              type="number"
              value={recordForm.allowances.lunch}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                allowances: {...recordForm.allowances, lunch: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>

          <FormField label="Phụ cấp điện thoại (VND)">
            <input
              type="number"
              value={recordForm.allowances.phone}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                allowances: {...recordForm.allowances, phone: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Bonuses */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thưởng</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Thưởng hiệu suất (VND)">
            <input
              type="number"
              value={recordForm.bonuses.performance}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                bonuses: {...recordForm.bonuses, performance: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>

          <FormField label="Thưởng lễ tết (VND)">
            <input
              type="number"
              value={recordForm.bonuses.holiday}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                bonuses: {...recordForm.bonuses, holiday: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Deductions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Khấu trừ khác</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Tạm ứng (VND)">
            <input
              type="number"
              value={recordForm.other_deductions.advance}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                other_deductions: {...recordForm.other_deductions, advance: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>

          <FormField label="Phí công đoàn (VND)">
            <input
              type="number"
              value={recordForm.other_deductions.union_fee}
              onChange={(e) => setRecordForm({
                ...recordForm, 
                other_deductions: {...recordForm.other_deductions, union_fee: e.target.value}
              })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </FormField>
        </FormGrid>
      </div>
    </FormModal>
  );
}
