import React, { useState, useEffect } from 'react';
import StudentsTabCrud from '../crud/StudentsTabCrud';
import { Student } from '../shared/types';

interface StudentsTabProps {
  showStudentForm: boolean;
  setShowStudentForm: (show: boolean) => void;
  onViewStudent?: (student: Student) => void;
}

export default function StudentsTab({
  showStudentForm,
  setShowStudentForm,
  onViewStudent
}: StudentsTabProps): JSX.Element {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch('/api/students');
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data || []);
      } else {
        console.error('Failed to fetch students:', result.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
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

  return (
    <div className="space-y-6">
      <StudentsTabCrud
        students={students}
        isLoading={isLoadingStudents}
        onSubmit={handleSubmit}
        onView={handleViewStudent}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onEnroll={handleEnrollStudent}
      />
    </div>
  );
}
