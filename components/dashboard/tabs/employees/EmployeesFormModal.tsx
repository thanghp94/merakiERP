import React from 'react';
import { formatDate } from '@/shared/utils';
import { FormField } from '@/dashboard/shared';
import FileUpload from '@/dashboard/shared/FileUpload';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { EmployeesFormModalProps, EMPLOYEE_STATUSES, NATIONALITIES } from './types/employees.types';
import { useEmployeesForm } from './hooks/useEmployeesForm';

export default function EmployeesFormModal({
  modalState,
  onClose,
  onSubmit,
  positionOptions,
  departmentOptions,
  isLoadingEnums
}: EmployeesFormModalProps) {
  const { form, showCustomNationality, avatarFile, setAvatarFile, handleNationalityChange } = useEmployeesForm(
    modalState,
    onSubmit,
    onClose
  );

  // ESC key handler for modal
  useEscapeKey(() => onClose(), modalState.isOpen);

  const isReadOnly = modalState.mode === 'view';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👨‍💼</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {modalState.mode === 'create' ? 'Thêm nhân viên mới' :
                 modalState.mode === 'edit' ? 'Chỉnh sửa nhân viên' :
                 'Chi tiết nhân viên'}
              </h2>
              <p className="text-sm text-gray-500">
                {modalState.mode === 'create' ? 'Nhập thông tin nhân viên mới' :
                 modalState.mode === 'edit' ? 'Cập nhật thông tin nhân viên' :
                 'Xem thông tin chi tiết về nhân viên'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {form.submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {form.submitError}
            </div>
          )}

          <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Basic Information - 3 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Thông tin cá nhân
                </h3>

                <FormField label="Họ và tên" required>
                  <input
                    {...form.register('full_name')}
                    type="text"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Nhập họ và tên"
                  />
                  {form.formState.errors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.full_name.message}</p>
                  )}
                </FormField>

                <FormField label="Email" required>
                  <input
                    {...form.register('email')}
                    type="email"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="email@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </FormField>

                <FormField label="Số điện thoại" required>
                  <input
                    {...form.register('phone')}
                    type="tel"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="0901234567"
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.phone.message}</p>
                  )}
                </FormField>

                <FormField label="Ngày sinh">
                  <input
                    {...form.register('date_of_birth')}
                    type="date"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                </FormField>

                <FormField label="Địa chỉ">
                  <textarea
                    {...form.register('address')}
                    rows={2}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Nhập địa chỉ"
                  />
                </FormField>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Thông tin công việc
                </h3>

                <FormField label="Chức vụ" required>
                  <select
                    {...form.register('position')}
                    disabled={isReadOnly || isLoadingEnums}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  >
                    <option value="">Chọn chức vụ</option>
                    {positionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.position && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.position.message}</p>
                  )}
                </FormField>

                <FormField label="Phòng ban" required>
                  <select
                    {...form.register('department')}
                    disabled={isReadOnly || isLoadingEnums}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.department && (
                    <p className="mt-1 text-xs text-red-600">{form.formState.errors.department.message}</p>
                  )}
                </FormField>

                <FormField label="Trạng thái">
                  <select
                    {...form.register('status')}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  >
                    {Object.entries(EMPLOYEE_STATUSES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ngày bắt đầu làm việc">
                  <input
                    {...form.register('hire_date')}
                    type="date"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                </FormField>

                <FormField label="Kinh nghiệm">
                  <textarea
                    {...form.register('experience')}
                    rows={3}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Mô tả kinh nghiệm làm việc"
                  />
                </FormField>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Thông tin giấy tờ
                </h3>

                <FormField label="Số CCCD/CMND">
                  <input
                    {...form.register('id_number')}
                    type="text"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Số CCCD/CMND"
                  />
                </FormField>

                <FormField label="Ngày cấp CCCD">
                  <input
                    {...form.register('id_issue_date')}
                    type="date"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                </FormField>

                <FormField label="Ngày hết hạn CCCD">
                  <input
                    {...form.register('id_expiry_date')}
                    type="date"
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                </FormField>

                <FormField label="Trình độ">
                  <textarea
                    {...form.register('qualifications')}
                    rows={3}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Mô tả bằng cấp, chứng chỉ"
                  />
                </FormField>

                <FormField label="Quốc tịch">
                  <select
                    {...form.register('nationality')}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    onChange={(e) => handleNationalityChange(e.target.value)}
                  >
                    <option value="">Chọn quốc tịch</option>
                    {Object.entries(NATIONALITIES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {showCustomNationality && (
                    <input
                      {...form.register('customNationality')}
                      type="text"
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mt-2 ${isReadOnly ? 'bg-gray-50' : ''}`}
                      placeholder="Nhập quốc tịch khác"
                    />
                  )}
                </FormField>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Thông tin bổ sung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isReadOnly && (
                  <FormField label="Avatar">
                    <FileUpload
                      label="Chọn ảnh đại diện"
                      accept="image/*"
                      maxSize={5}
                      onFileSelect={setAvatarFile}
                      currentFile={modalState.employee?.data?.avatar}
                      error={form.formState.errors.avatar?.message}
                    />
                  </FormField>
                )}

                <FormField label="Ghi chú" className={!isReadOnly ? "md:col-span-1" : "md:col-span-2"}>
                  <textarea
                    {...form.register('notes')}
                    rows={3}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Ghi chú thêm về nhân viên"
                  />
                </FormField>
              </div>
            </div>

            {/* System Information - Only show in view mode */}
            {modalState.mode === 'view' && modalState.employee && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin hệ thống</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 text-gray-900 font-mono">{modalState.employee.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="ml-2 text-gray-900">
                      {modalState.employee.created_at ? formatDate(modalState.employee.created_at) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            💡 Nhấn <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd> để đóng
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {modalState.mode === 'view' ? 'Đóng' : 'Hủy'}
            </button>
            {modalState.mode !== 'view' && (
              <button
                type="submit"
                onClick={form.handleSubmit}
                disabled={form.isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.isSubmitting ? 'Đang xử lý...' : (modalState.mode === 'create' ? 'Thêm mới' : 'Cập nhật')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
