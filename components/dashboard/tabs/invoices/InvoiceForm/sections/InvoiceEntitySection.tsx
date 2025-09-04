import React from 'react';
import { Student, Employee, Facility, Class } from '../../types/invoice.types';

interface InvoiceEntitySectionProps {
  form: any; // Accept any form object to avoid TypeScript conflicts
  students: Student[];
  employees: Employee[];
  facilities: Facility[];
  classes: Class[];
  isLoading?: boolean;
}

export const InvoiceEntitySection: React.FC<InvoiceEntitySectionProps> = ({
  form,
  students,
  employees,
  facilities,
  classes,
  isLoading = false,
}) => {
  const { register, watch, formState: { errors } } = form;
  const isIncome = watch('is_income');

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên quan</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student Selection (for income invoices) */}
        {isIncome && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Học sinh {isIncome ? '*' : ''}
            </label>
            <select
              {...register('student_id')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Chọn học sinh</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
            {errors.student_id && (
              <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
            )}
          </div>
        )}

        {/* Employee Selection (for expense invoices) */}
        {!isIncome && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhân viên {!isIncome ? '*' : ''}
            </label>
            <select
              {...register('employee_id')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Chọn nhân viên</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
            )}
          </div>
        )}

        {/* Class Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lớp học
          </label>
          <select
            {...register('class_id')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Chọn lớp</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
          {errors.class_id && (
            <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
          )}
        </div>

        {/* Facility Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cơ sở
          </label>
          <select
            {...register('facility_id')}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Chọn cơ sở</option>
            {facilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          {errors.facility_id && (
            <p className="mt-1 text-sm text-red-600">{errors.facility_id.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="md:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú thêm về hóa đơn..."
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
};
