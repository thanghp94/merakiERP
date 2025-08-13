import React, { useState, useEffect } from 'react';
import { Class, Student, Enrollment } from './shared/types';
import { formatDate, getStatusBadge } from './shared/utils';

interface ClassEnrollmentModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedClass: Class | null;
  onEnrollmentSuccess: () => void;
}

export default function ClassEnrollmentModal({
  showModal,
  setShowModal,
  selectedClass,
  onEnrollmentSuccess
}: ClassEnrollmentModalProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [tuitionFee, setTuitionFee] = useState('2000000');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showModal && selectedClass) {
      fetchEnrolledStudents();
      fetchAvailableStudents();
    }
  }, [showModal, selectedClass]);

  const fetchEnrolledStudents = async () => {
    if (!selectedClass) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments?class_id=${selectedClass.id}`);
      const result = await response.json();
      
      if (result.success) {
        setEnrolledStudents(result.data);
      } else {
        console.error('Failed to fetch enrolled students:', result.message);
        setEnrolledStudents([]);
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      setEnrolledStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active');
      const result = await response.json();
      
      if (result.success) {
        setAvailableStudents(result.data);
      } else {
        console.error('Failed to fetch students:', result.message);
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setAvailableStudents([]);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedClass || !selectedStudent) {
      alert('Vui lòng chọn học sinh');
      return;
    }

    setIsSubmitting(true);
    try {
      const enrollmentData = {
        student_id: selectedStudent,
        class_id: selectedClass.id,
        enrollment_date: enrollmentDate,
        status: 'active',
        data: {
          payment_status: paymentStatus,
          notes: notes
        }
      };

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      });

      const result = await response.json();

      if (response.ok) {
        // Also create finance record for tuition
        if (tuitionFee && parseFloat(tuitionFee) > 0) {
          const financeData = {
            student_id: selectedStudent,
            type: 'tuition',
            amount: parseFloat(tuitionFee),
            status: paymentStatus === 'paid' ? 'paid' : 'pending',
            due_date: enrollmentDate,
            data: {
              description: `Học phí lớp ${selectedClass.class_name}`,
              payment_method: paymentStatus === 'paid' ? 'cash' : null
            }
          };

          await fetch('/api/finances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(financeData),
          });
        }

        alert('Đăng ký học sinh thành công!');
        setSelectedStudent('');
        setNotes('');
        fetchEnrolledStudents();
        onEnrollmentSuccess();
      } else {
        throw new Error(result.message || 'Failed to enroll student');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert(`Lỗi khi đăng ký: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Đăng ký học sinh vào lớp - {selectedClass.class_name}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrolled Students List */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Học sinh đã đăng ký ({enrolledStudents.length})
              </h4>
              
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Đang tải...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Chưa có học sinh nào đăng ký
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Học sinh
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Ngày ĐK
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrolledStudents.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {enrollment.students?.full_name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {formatDate(enrollment.enrollment_date)}
                          </td>
                          <td className="px-3 py-2">
                            {getStatusBadge(enrollment.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Enrollment Form */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Đăng ký học sinh mới</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học sinh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn học sinh</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày đăng ký <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái thanh toán
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Chưa thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="partial">Thanh toán một phần</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học phí (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú về đăng ký"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleEnrollStudent}
                    disabled={isSubmitting || !selectedStudent}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      'Đăng ký'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
