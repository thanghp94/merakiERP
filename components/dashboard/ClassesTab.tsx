import React from 'react';
import ClassForm from '../ClassForm';
import MainSessionForm from './sessions/MainSessionForm';
import { Class, Facility, ProgramType, UnitOption } from './shared/types';
import { formatDate, getStatusBadge, getNextSuggestedUnit } from './shared/utils';

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
  handleFormSubmit,
  handleUnitTransition,
  handleClassEnrollment
}: ClassesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Lớp học</h2>
        <button
          onClick={() => setShowClassForm(!showClassForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
        >
          <span>{showClassForm ? '📋' : '➕'}</span>
          <span>{showClassForm ? 'Xem danh sách' : 'Thêm lớp học'}</span>
        </button>
      </div>

      {selectedClassForLesson ? (
        <MainSessionForm 
          classId={selectedClassForLesson}
          onSubmit={(data: any) => {
            console.log('Lesson form submitted for class:', selectedClassForLesson, data);
            alert('Buổi học đã được tạo thành công!');
            setSelectedClassForLesson(null);
          }}
          onCancel={() => setSelectedClassForLesson(null)}
        />
      ) : showClassForm ? (
        <ClassForm onSubmit={(data) => handleFormSubmit(data, 'Class')} />
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="facility-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ sở
                </label>
                <select
                  id="facility-filter"
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  disabled={isLoadingFacilities}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Tất cả cơ sở</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="program-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Chương trình học
                </label>
                <select
                  id="program-filter"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={isLoadingPrograms}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Tất cả chương trình</option>
                  {programTypes.map((program) => (
                    <option key={program.value} value={program.value}>
                      {program.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedFacility('');
                    setSelectedProgram('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Lớp học đang hoạt động ({classes.length})
              </h3>
            </div>

            {isLoadingClasses ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Đang tải danh sách lớp học...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Không có lớp học nào</h4>
                <p className="text-gray-600">Không tìm thấy lớp học nào phù hợp với bộ lọc đã chọn.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên lớp học
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cơ sở
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chương trình
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày bắt đầu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sĩ số tối đa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cls.class_name}</div>
                          {cls.data?.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {cls.data.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cls.facilities?.name || 'Chưa chọn cơ sở'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cls.data?.program_type || 'Chưa chọn chương trình'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cls.data?.unit || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(cls.start_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cls.data?.max_students || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(cls.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedClassForLesson(cls.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                            >
                              <span>📅</span>
                              <span>Thêm buổi học</span>
                            </button>
                            <button
                              onClick={() => handleClassEnrollment(cls)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                            >
                              <span>👥</span>
                              <span>Đăng ký</span>
                            </button>
                            {cls.data?.program_type === 'GrapeSEED' && (
                              <button
                                onClick={() => handleUnitTransition(cls)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                              >
                                <span>🔄</span>
                                <span>Chuyển Unit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
