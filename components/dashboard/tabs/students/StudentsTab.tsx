import React, { useState, useEffect } from 'react';
import StudentsTabCrud from './StudentsTabCrud';
import TuitionTab from './TuitionTab';
import { Student } from '@/components/dashboard/shared/types';

interface StudentsTabProps {
  showStudentForm: boolean;
  setShowStudentForm: (show: boolean) => void;
  onViewStudent?: (student: Student) => void;
  students?: Student[];
  isLoadingStudents?: boolean;
  onRefreshStudents?: () => Promise<void>;
}

type SubTab = 'list' | 'tuition';

export default function StudentsTab({
  showStudentForm,
  setShowStudentForm,
  onViewStudent,
  students: propStudents,
  isLoadingStudents: propIsLoading,
  onRefreshStudents
}: StudentsTabProps): JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);

  // Use props if available, otherwise use local state
  const students = propStudents || localStudents;
  const isLoadingStudents = propIsLoading !== undefined ? propIsLoading : localIsLoading;

  // Fetch students on component mount only if no props are provided
  useEffect(() => {
    if (activeSubTab === 'list' && !propStudents) {
      fetchStudents();
    }
  }, [activeSubTab, propStudents]);

  const fetchStudents = async () => {
    if (onRefreshStudents) {
      // Use parent's refresh function if available
      await onRefreshStudents();
    } else {
      // Fallback to local fetching
      setLocalIsLoading(true);
      try {
        const response = await fetch('/api/students');
        const result = await response.json();
        
        if (result.success) {
          setLocalStudents(result.data || []);
        } else {
          console.error('Failed to fetch students:', result.message);
          setLocalStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setLocalStudents([]);
      } finally {
        setLocalIsLoading(false);
      }
    }
  };

  const handleSubmit = async (data: any, formType: string) => {
    if (formType === 'RefreshStudents') {
      // Just refresh the students list
      await fetchStudents();
      return;
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        // Refresh the students list
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  };

  const handleViewStudent = (student: Student) => {
    if (onViewStudent) {
      onViewStudent(student);
    } else {
      console.log('View student:', student);
    }
  };

  const handleEditStudent = async (student: Student) => {
    // TODO: Implement edit student functionality with modal
    console.log('Edit student:', student);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.full_name}"?`)) {
      try {
        const response = await fetch(`/api/students/${student.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          // Refresh the students list
          await fetchStudents();
          alert('Xóa học sinh thành công!');
        } else {
          alert(`Lỗi khi xóa học sinh: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Có lỗi xảy ra khi xóa học sinh');
      }
    }
  };

  const handleEnrollStudent = (student: Student) => {
    // TODO: Implement enrollment functionality
    console.log('Enroll student:', student);
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'list':
        return (
          <StudentsTabCrud
            students={students}
            isLoading={isLoadingStudents}
            onSubmit={handleSubmit}
            onView={handleViewStudent}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            onEnroll={handleEnrollStudent}
          />
        );
      case 'tuition':
        return (
          <TuitionTab
            onViewStudent={handleViewStudent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>📋</span>
              <span>Danh sách học sinh</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('tuition')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'tuition'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>💰</span>
              <span>Học phí</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Sub-tab Content */}
      {renderSubTabContent()}
    </div>
  );
}
