import React, { useState, useEffect } from 'react';
import { FormModal, FormGrid, FormField } from './dashboard/shared';

interface AttendanceFormProps {
  onSubmit: (attendanceData: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
  isOpen?: boolean;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData = {}, 
  isEditing = false,
  isOpen = true
}) => {
  const [formData, setFormData] = useState({
    session_id: initialData.session_id || '',
    student_id: initialData.student_id || '',
    status: initialData.status || 'present',
    check_in_time: initialData.check_in_time ? 
      new Date(initialData.check_in_time).toISOString().slice(0, 16) : 
      new Date().toISOString().slice(0, 16),
    notes: initialData.data?.notes || ''
  });

  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsResponse, studentsResponse] = await Promise.all([
        fetch('/api/teaching-sessions'),
        fetch('/api/students')
      ]);

      const sessionsResult = await sessionsResponse.json();
      const studentsResult = await studentsResponse.json();

      if (sessionsResult.success) {
        setSessions(sessionsResult.data);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submitData = {
        session_id: formData.session_id,
        student_id: formData.student_id,
        status: formData.status,
        check_in_time: formData.check_in_time,
        data: {
          notes: formData.notes
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          session_id: '',
          student_id: '',
          status: 'present',
          check_in_time: new Date().toISOString().slice(0, 16),
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const getSelectedSession = (): any => {
    return sessions.find((session: any) => session.id === formData.session_id);
  };

  const getSelectedStudent = (): any => {
    return students.find((student: any) => student.id === formData.student_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      case 'excused': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onCancel || (() => {})}
      title={isEditing ? 'Chỉnh sửa điểm danh' : 'Điểm danh học sinh'}
      onSubmit={handleModalSubmit}
      onCancel={handleModalCancel}
      submitLabel={isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Điểm danh')}
      cancelLabel={isEditing ? 'Hủy' : 'Xóa form'}
      isSubmitting={isSubmitting || isLoadingData}
      maxWidth="5xl"
    >
      {/* Session and Student Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin buổi học</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Buổi học" required>
            <select
              name="session_id"
              value={formData.session_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Chọn buổi học</option>
              {sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.classes?.class_name} - {new Date(session.session_date).toLocaleDateString('vi-VN')} ({session.start_time}-{session.end_time})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Học sinh" required>
            <select
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Chọn học sinh</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} - {student.email}
                </option>
              ))}
            </select>
          </FormField>
        </FormGrid>
      </div>

      {/* Selected Information Display */}
      {(getSelectedSession() || getSelectedStudent()) && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin đã chọn:</h3>
          {getSelectedSession() && (
            <div className="text-sm text-gray-600 mb-2">
              <strong>Buổi học:</strong> {getSelectedSession()?.classes?.class_name} - 
              {new Date(getSelectedSession()?.session_date).toLocaleDateString('vi-VN')} - 
              Giáo viên: {getSelectedSession()?.employees?.full_name}
            </div>
          )}
          {getSelectedStudent() && (
            <div className="text-sm text-gray-600">
              <strong>Học sinh:</strong> {getSelectedStudent()?.full_name} - {getSelectedStudent()?.phone}
            </div>
          )}
        </div>
      )}

      {/* Attendance Details */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Chi tiết điểm danh</h3>
        <FormGrid columns={2} gap="md">
          <FormField label="Trạng thái điểm danh" required>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${getStatusColor(formData.status)}`}
            >
              <option value="present">Có mặt</option>
              <option value="absent">Vắng mặt</option>
              <option value="late">Đi muộn</option>
              <option value="excused">Nghỉ có phép</option>
            </select>
          </FormField>

          <FormField label="Thời gian check-in">
            <input
              type="datetime-local"
              name="check_in_time"
              value={formData.check_in_time}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </FormField>
        </FormGrid>
      </div>

      {/* Status Legend */}
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Ý nghĩa trạng thái:</h4>
        <FormGrid columns={2} gap="sm">
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Có mặt: Học sinh tham gia đầy đủ</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span>Vắng mặt: Không tham gia</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <span>Đi muộn: Tham gia nhưng trễ giờ</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span>Nghỉ có phép: Xin phép trước</span>
          </div>
        </FormGrid>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Ghi chú bổ sung</h3>
        <FormGrid columns={1} gap="md">
          <FormField label="Ghi chú">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ghi chú về tình trạng điểm danh (tùy chọn)"
            />
          </FormField>
        </FormGrid>
      </div>
    </FormModal>
  );
};

export default AttendanceForm;
