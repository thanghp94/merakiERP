import React, { useState, useEffect } from 'react';
import MainSessionModal from '../sessions/MainSessionModal';
import GrapeSeedAutoSessionModal from './GrapeSeedAutoSessionModal';
import TathAutoSessionModal from './TathAutoSessionModal';
import ClassForm from './ClassForm';
import { Class, Facility, ProgramType, UnitOption } from '../../shared/types';
import { formatDate, getStatusBadge, getNextSuggestedUnit } from '../../shared/utils';
import { CrudTable, FilterBar, DataTable, FilterConfig, TableColumn, TableAction, FormModal, FormGrid, FormField } from '../../shared';
import { useEscapeKey } from '../../../../lib/hooks/useEscapeKey';

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
}: ClassesTabProps): JSX.Element {
  // State for edit/view functionality
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  // Enrollment counts state
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  // State for auto session modal
  const [showAutoSessionModal, setShowAutoSessionModal] = useState(false);
  const [selectedClassForAutoSession, setSelectedClassForAutoSession] = useState<Class | null>(null);

  // ESC key handlers for modals
  useEscapeKey(() => setShowClassForm(false), showClassForm);
  useEscapeKey(() => setShowEditModal(false), showEditModal);
  useEscapeKey(() => {
    setViewingClass(null);
    setShowViewModal(false);
  }, showViewModal);
  useEscapeKey(() => {
    setShowDeleteConfirm(false);
    setClassToDelete(null);
  }, showDeleteConfirm);
  useEscapeKey(() => {
    setShowAutoSessionModal(false);
    setSelectedClassForAutoSession(null);
  }, showAutoSessionModal);

  // Fetch enrollment counts for current classes
  useEffect(() => {
    async function fetchEnrollmentCounts() {
      if (classes.length === 0) {
        setEnrollmentCounts({});
        return;
      }
      try {
        const classIds = classes.map(cls => cls.id);
        // Fetch enrollments filtered by class IDs
        const response = await fetch(`/api/enrollments?limit=1000`);
        const result = await response.json();
        if (result.success) {
          const counts: Record<string, number> = {};
          for (const clsId of classIds) {
            counts[clsId] = result.data.filter((enr: any) => enr.class_id === clsId && enr.status === 'active').length;
          }
          setEnrollmentCounts(counts);
        } else {
          setEnrollmentCounts({});
        }
      } catch (error) {
        console.error('Error fetching enrollment counts:', error);
        setEnrollmentCounts({});
      }
    }
    fetchEnrollmentCounts();
  }, [classes]);

  // Handler functions for CRUD operations
  const handleViewClass = (classItem: Class) => {
    console.log('handleViewClass called with:', classItem);
    // Show the detailed form modal in view-only mode instead of simple view modal
    setEditingClass(classItem);
    setShowEditModal(true);
    console.log('Edit modal state set to true for view-only');
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowEditModal(true);
  };

  const handleDeleteClass = (classItem: Class) => {
    setClassToDelete(classItem);
    setShowDeleteConfirm(true);
  };

  const handleAutoSession = (classItem: Class) => {
    setSelectedClassForAutoSession(classItem);
    setShowAutoSessionModal(true);
  };

  const handleAutoSessionSubmit = async (data: any) => {
    if (!selectedClassForAutoSession) {
      alert('Không có lớp học được chọn');
      return;
    }

    try {
      // Determine which API endpoint to use based on program type
      const programType = selectedClassForAutoSession.data?.program_type;
      const apiEndpoint = programType === 'GrapeSEED' 
        ? '/api/auto-sessions/grapeseed'
        : '/api/auto-sessions/tath';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          class_id: selectedClassForAutoSession.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        const sessionCount = result.data.mainSessions?.length || 0;
        const individualSessionCount = result.data.sessions?.length || 0;
        alert(`Đã tạo thành công ${sessionCount} buổi học ${programType} với ${individualSessionCount} session!`);
        setShowAutoSessionModal(false);
        setSelectedClassForAutoSession(null);
        // Optionally refresh the page or update state
        window.location.reload();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating auto sessions:', error);
      alert('Có lỗi xảy ra khi tạo buổi học tự động');
    }
  };

  const handleCreateSubmit = async (classData: any) => {
    console.log('handleCreateSubmit called with:', classData);
    try {
      console.log('Calling handleFormSubmit...');
      await handleFormSubmit(classData, 'Class');
      console.log('handleFormSubmit completed successfully');
      setShowClassForm(false);
      // Remove the alert that might cause page reload
      console.log('Lớp học đã được tạo thành công!');
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Có lỗi xảy ra khi tạo lớp học: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleEditSubmit = async (classData: any) => {
    if (!editingClass) return;
    
    try {
      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
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
        render: (value, row) => {
          const enrollmentCount = enrollmentCounts[row.id] || 0;
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-1">
                {`Cơ sở: ${row.facilities?.name || 'Chưa chọn cơ sở'} | Unit: ${row.data?.unit || '-'} | Số học sinh: ${enrollmentCount}`}
              </div>
            </div>
          );
        }
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
            label: 'Thêm buổi dạy tự động',
            icon: '🤖',
            onClick: (cls: Class) => handleAutoSession(cls),
            variant: 'secondary',
            tooltip: 'Tạo nhiều buổi học tự động'
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

      {/* Class Form Modal - Create */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Thêm lớp học mới</h2>
              <button
                onClick={() => setShowClassForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ClassForm
              onSubmit={handleCreateSubmit}
              isEditing={false}
            />
          </div>
        </div>
      )}

      {/* Class Form Modal - Edit */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa lớp học</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ClassForm
              onSubmit={handleEditSubmit}
              initialData={editingClass}
              isEditing={true}
            />
          </div>
        </div>
      )}

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

      {/* Auto Session Modals - Program Specific */}
      {selectedClassForAutoSession?.data?.program_type === 'GrapeSEED' ? (
        <GrapeSeedAutoSessionModal
          isOpen={showAutoSessionModal}
          onClose={() => {
            setShowAutoSessionModal(false);
            setSelectedClassForAutoSession(null);
          }}
          onSubmit={handleAutoSessionSubmit}
          selectedClass={selectedClassForAutoSession}
        />
      ) : (
        <TathAutoSessionModal
          isOpen={showAutoSessionModal}
          onClose={() => {
            setShowAutoSessionModal(false);
            setSelectedClassForAutoSession(null);
          }}
          onSubmit={handleAutoSessionSubmit}
          selectedClass={selectedClassForAutoSession}
        />
      )}
    </div>
  );
}
