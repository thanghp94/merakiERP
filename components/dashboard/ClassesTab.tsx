import React, { useState, useEffect } from 'react';
import MainSessionModal from './sessions/MainSessionModal';
import { Class, Facility, ProgramType, UnitOption } from './shared/types';
import { formatDate, getStatusBadge, getNextSuggestedUnit } from './shared/utils';
import { CrudTable, FilterBar, DataTable, FilterConfig, TableColumn, TableAction, FormModal, FormGrid, FormField } from './shared';

interface ClassesTabProps {
  showClassForm: boolean;
  setShowClassForm: (show: boolean) => void;
  selectedClassForLesson: string | null;
  setSelectedClassForLesson: (classId: string | null) => void;
  classes: Class[];
  facilities: Facility[];
  programTypes: ProgramType[];
  grapeSeedUnits: UnitOption[];
  isLoadingClasses: boolean;
  isLoadingFacilities: boolean;
  isLoadingPrograms: boolean;
  selectedFacility: string;
  setSelectedFacility: (facility: string) => void;
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  handleFormSubmit: (data: any, formType: string) => void;
  handleUnitTransition: (classItem: Class) => void;
  handleClassEnrollment: (classItem: Class) => void;
}

export default function ClassesTab({
  showClassForm,
  setShowClassForm,
  selectedClassForLesson,
  setSelectedClassForLesson,
  classes,
  facilities,
  programTypes,
  grapeSeedUnits,
  isLoadingClasses,
  isLoadingFacilities,
  isLoadingPrograms,
  selectedFacility,
  setSelectedFacility,
  selectedProgram,
  setSelectedProgram,
  selectedStatus,
  setSelectedStatus,
  handleFormSubmit,
  handleUnitTransition,
  handleClassEnrollment
}: ClassesTabProps) {
  // Form state
  const [formData, setFormData] = useState({
    class_name: '',
    facility_id: '',
    status: 'active',
    start_date: '',
    program_type: '',
    unit: '',
    duration: '',
    schedule: '',
    max_students: '',
    description: ''
  });

  const [unitOptions, setUnitOptions] = useState<Array<{value: string, label: string}>>([]);
  const [showUnitField, setShowUnitField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  
  // New state for edit/view functionality
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  const fetchUnitOptions = async () => {
    setIsLoadingUnits(true);
    try {
      const response = await fetch('/api/metadata/enums?type=unit_grapeseed');
      const result = await response.json();
      
      if (result.success) {
        setUnitOptions(result.data);
      } else {
        console.error('Failed to fetch unit options:', result.message);
        // Fallback to hardcoded values
        const fallbackUnits = [];
        for (let i = 1; i <= 30; i++) {
          fallbackUnits.push({ value: `U${i}`, label: `U${i}` });
        }
        setUnitOptions(fallbackUnits);
      }
    } catch (error) {
      console.error('Error fetching unit options:', error);
      // Fallback to hardcoded values
      const fallbackUnits = [];
      for (let i = 1; i <= 30; i++) {
        fallbackUnits.push({ value: `U${i}`, label: `U${i}` });
      }
      setUnitOptions(fallbackUnits);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Show/hide unit field based on program type selection
    if (name === 'program_type') {
      const shouldShowUnit = value === 'GrapeSEED';
      setShowUnitField(shouldShowUnit);
      
      // Fetch unit options when GrapeSEED is selected
      if (shouldShowUnit && unitOptions.length === 0) {
        fetchUnitOptions();
      }
      
      // Clear unit value when switching away from GrapeSEED
      if (!shouldShowUnit) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          unit: ''
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = {
        class_name: formData.class_name,
        facility_id: formData.facility_id || null,
        status: formData.status,
        start_date: formData.start_date,
        data: {
          program_type: formData.program_type,
          unit: formData.unit,
          duration: formData.duration,
          schedule: formData.schedule,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
          description: formData.description
        }
      };

      await handleFormSubmit(submitData, 'Class');
      
      // Reset form after successful creation
      setFormData({
        class_name: '',
        facility_id: '',
        status: 'active',
        start_date: '',
        program_type: '',
        unit: '',
        duration: '',
        schedule: '',
        max_students: '',
        description: ''
      });
      setShowUnitField(false);
      setShowClassForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setFormData({
      class_name: '',
      facility_id: '',
      status: 'active',
      start_date: '',
      program_type: '',
      unit: '',
      duration: '',
      schedule: '',
      max_students: '',
      description: ''
    });
    setShowUnitField(false);
    setShowClassForm(false);
  };

  // New handler functions for CRUD operations
  const handleViewClass = (classItem: Class) => {
    console.log('handleViewClass called with:', classItem);
    setViewingClass(classItem);
    setShowViewModal(true);
    console.log('Modal state set to true');
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    // Populate form with existing data
    setFormData({
      class_name: classItem.class_name || '',
      facility_id: classItem.facility_id || '',
      status: classItem.status || 'active',
      start_date: classItem.start_date || '',
      program_type: classItem.data?.program_type || '',
      unit: classItem.data?.unit || '',
      duration: classItem.data?.duration || '',
      schedule: classItem.data?.schedule || '',
      max_students: classItem.data?.max_students?.toString() || '',
      description: classItem.data?.description || ''
    });
    
    // Show unit field if GrapeSEED is selected
    if (classItem.data?.program_type === 'GrapeSEED') {
      setShowUnitField(true);
      if (unitOptions.length === 0) {
        fetchUnitOptions();
      }
    }
    
    setShowEditModal(true);
  };

  const handleDeleteClass = (classItem: Class) => {
    setClassToDelete(classItem);
    setShowDeleteConfirm(true);
  };

  const handleEditSubmit = async () => {
    if (!editingClass) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        class_name: formData.class_name,
        facility_id: formData.facility_id || null,
        status: formData.status,
        start_date: formData.start_date,
        data: {
          program_type: formData.program_type,
          unit: formData.unit,
          duration: formData.duration,
          schedule: formData.schedule,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
          description: formData.description
        }
      };

      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Cập nhật lớp học thành công!');
        // Refresh the classes list
        window.location.reload();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Có lỗi xảy ra khi cập nhật lớp học');
    } finally {
      setIsSubmitting(false);
      setShowEditModal(false);
      setEditingClass(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    
    try {
      const response = await fetch(`/api/classes/${classToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Xóa lớp học thành công!');
        // Refresh the classes list
        window.location.reload();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Có lỗi xảy ra khi xóa lớp học');
    } finally {
      setShowDeleteConfirm(false);
      setClassToDelete(null);
    }
  };

  // Create filter configurations for FilterBar
  const getFilterConfigs = (): FilterConfig[] => {
    return [
      {
        key: 'facility',
        label: 'Cơ sở',
        options: [
          { value: '', label: 'Tất cả cơ sở' },
          ...facilities.map(facility => ({
            value: facility.id,
            label: facility.name
          }))
        ],
        disabled: isLoadingFacilities
      },
      {
        key: 'program',
        label: 'Chương trình học',
        options: [
          { value: '', label: 'Tất cả chương trình' },
          ...programTypes.map(program => ({
            value: program.value,
            label: program.label
          }))
        ],
        disabled: isLoadingPrograms
      },
      {
        key: 'status',
        label: 'Trạng thái',
        options: [
          { value: 'active', label: 'Đang hoạt động' },
          { value: 'inactive', label: 'Ngừng hoạt động' },
          { value: 'completed', label: 'Đã hoàn thành' },
          { value: '', label: 'Tất cả trạng thái' }
        ],
        disabled: false
      }
    ];
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    if (filterKey === 'facility') {
      setSelectedFacility(value);
    } else if (filterKey === 'program') {
      setSelectedProgram(value);
    } else if (filterKey === 'status') {
      setSelectedStatus(value);
    }
  };

  const handleClearFilters = () => {
    setSelectedFacility('');
    setSelectedProgram('');
    setSelectedStatus('active'); // Reset to default active status
  };

  // Create table columns configuration
  const getTableColumns = (): TableColumn<Class>[] => {
    return [
      {
        key: 'class_name',
        label: 'Tên lớp học',
        render: (value, row) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            {row.data?.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {row.data.description}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'facilities',
        label: 'Cơ sở',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.facilities?.name || 'Chưa chọn cơ sở'}
          </div>
        )
      },
      {
        key: 'unit',
        label: 'Unit',
        render: (value, row) => (
          <div className="text-sm text-gray-900">
            {row.data?.unit || '-'}
          </div>
        )
      }
    ];
  };

  const filters = {
    facility: selectedFacility,
    program: selectedProgram,
    status: selectedStatus
  };

  return (
    <div className="space-y-3">
      <MainSessionModal
        isOpen={!!selectedClassForLesson}
        onClose={() => setSelectedClassForLesson(null)}
        classId={selectedClassForLesson || undefined}
        onSubmit={(data: any) => {
          console.log('Lesson form submitted for class:', selectedClassForLesson, data);
          alert('Buổi học đã được tạo thành công!');
          setSelectedClassForLesson(null);
        }}
      />
      
      <CrudTable
        data={classes}
        columns={getTableColumns()}
        isLoading={isLoadingClasses}
        filters={filters}
        filterConfigs={getFilterConfigs()}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onView={handleViewClass}
        onEdit={handleEditClass}
        onDelete={handleDeleteClass}
        customActions={[
          {
            label: 'Thêm buổi học',
            icon: '📅',
            onClick: (cls: Class) => setSelectedClassForLesson(cls.id),
            variant: 'primary',
            tooltip: 'Thêm buổi học mới'
          },
          {
            label: 'Đăng ký',
            icon: '👥',
            onClick: (cls: Class) => handleClassEnrollment(cls),
            variant: 'secondary',
            tooltip: 'Quản lý đăng ký'
          },
          {
            label: 'Chuyển Unit',
            icon: '🔄',
            onClick: (cls: Class) => handleUnitTransition(cls),
            variant: 'primary',
            show: (cls: Class) => cls.data?.program_type === 'GrapeSEED',
            tooltip: 'Chuyển Unit'
          }
        ]}
        title="Lớp học đang hoạt động"
        createButtonLabel="Thêm lớp học"
        onCreateClick={() => setShowClassForm(true)}
        emptyState={{
          icon: (
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          title: 'Không có lớp học nào',
          description: 'Không tìm thấy lớp học nào phù hợp với bộ lọc đã chọn.'
        }}
      />

      {/* Class Form Modal */}
      <FormModal
        isOpen={showClassForm}
        onClose={() => setShowClassForm(false)}
        title="Thêm lớp học mới"
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        submitLabel="Thêm mới"
        cancelLabel="Hủy"
        isSubmitting={isSubmitting}
        maxWidth="4xl"
      >
        {/* Basic Information */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={1} gap="md">
            <FormField label="Tên lớp học" required>
              <input
                type="text"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tên lớp học"
              />
            </FormField>
          </FormGrid>
        </div>

        {/* Class Details */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết lớp học</h3>
          <FormGrid columns={2} gap="md">
            <FormField label="Cơ sở">
              <select
                name="facility_id"
                value={formData.facility_id}
                onChange={handleChange}
                disabled={isLoadingFacilities}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn cơ sở</option>
                {facilities.map((facility: any) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trạng thái">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </FormField>

            <FormField label="Ngày bắt đầu" required>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Chương trình">
              <select
                name="program_type"
                value={formData.program_type}
                onChange={handleChange}
                disabled={isLoadingPrograms}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingPrograms ? 'Đang tải...' : 'Chọn chương trình'}
                </option>
                {programTypes.map((program) => (
                  <option key={program.value} value={program.value}>
                    {program.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Thời lượng khóa học">
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="VD: 3 tháng, 12 tuần"
              />
            </FormField>

            <FormField label="Số học sinh tối đa">
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số lượng học sinh"
              />
            </FormField>
          </FormGrid>

          {/* Unit field - only show when GrapeSEED is selected */}
          {showUnitField && (
            <div className="mt-3">
              <FormField label="Chọn Unit">
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  disabled={isLoadingUnits}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingUnits ? 'Đang tải...' : 'Chọn unit'}
                  </option>
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          <div className="mt-3">
            <FormField label="Lịch học">
              <input
                type="text"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="VD: Thứ 2, 4, 6 - 19:00-21:00"
              />
            </FormField>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Mô tả">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả về lớp học"
            />
          </FormField>
        </div>
      </FormModal>

      {/* Edit Class Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Chỉnh sửa lớp học"
        onSubmit={handleEditSubmit}
        onCancel={() => setShowEditModal(false)}
        submitLabel="Cập nhật"
        cancelLabel="Hủy"
        isSubmitting={isSubmitting}
        maxWidth="4xl"
      >
        {/* Same form content as create modal */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
          <FormGrid columns={1} gap="md">
            <FormField label="Tên lớp học" required>
              <input
                type="text"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Nhập tên lớp học"
              />
            </FormField>
          </FormGrid>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết lớp học</h3>
          <FormGrid columns={2} gap="md">
            <FormField label="Cơ sở">
              <select
                name="facility_id"
                value={formData.facility_id}
                onChange={handleChange}
                disabled={isLoadingFacilities}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn cơ sở</option>
                {facilities.map((facility: any) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Trạng thái">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </FormField>

            <FormField label="Ngày bắt đầu" required>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </FormField>

            <FormField label="Chương trình">
              <select
                name="program_type"
                value={formData.program_type}
                onChange={handleChange}
                disabled={isLoadingPrograms}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingPrograms ? 'Đang tải...' : 'Chọn chương trình'}
                </option>
                {programTypes.map((program) => (
                  <option key={program.value} value={program.value}>
                    {program.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Thời lượng khóa học">
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="VD: 3 tháng, 12 tuần"
              />
            </FormField>

            <FormField label="Số học sinh tối đa">
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Số lượng học sinh"
              />
            </FormField>
          </FormGrid>

          {showUnitField && (
            <div className="mt-3">
              <FormField label="Chọn Unit">
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  disabled={isLoadingUnits}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingUnits ? 'Đang tải...' : 'Chọn unit'}
                  </option>
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          <div className="mt-3">
            <FormField label="Lịch học">
              <input
                type="text"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="VD: Thứ 2, 4, 6 - 19:00-21:00"
              />
            </FormField>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin bổ sung</h3>
          <FormField label="Mô tả">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Mô tả về lớp học"
            />
          </FormField>
        </div>
      </FormModal>

      {/* View Class Modal */}
      {viewingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin lớp học</h2>
              <button
                onClick={() => {
                  setViewingClass(null);
                  setShowViewModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp học</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{viewingClass.class_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cơ sở</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.facilities?.name || 'Chưa chọn cơ sở'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.status === 'active' ? 'Hoạt động' : 
                     viewingClass.status === 'inactive' ? 'Không hoạt động' :
                     viewingClass.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.start_date ? new Date(viewingClass.start_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chương trình</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.data?.program_type || 'Chưa chọn'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.data?.unit || 'Chưa có'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.data?.duration || 'Chưa có'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số học sinh tối đa</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingClass.data?.max_students || 'Chưa có'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lịch học</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingClass.data?.schedule || 'Chưa có'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingClass.data?.description || 'Chưa có mô tả'}
                </p>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setViewingClass(null);
                    setShowViewModal(false);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && classToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận xóa lớp học</h3>
              <p className="text-sm text-gray-500 mb-4">
                Bạn có chắc chắn muốn xóa lớp học "<strong>{classToDelete?.class_name}</strong>"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setClassToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
