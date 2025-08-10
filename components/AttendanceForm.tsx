import React, { useState, useEffect } from 'react';

interface AttendanceFormProps {
  onSubmit: (attendanceData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa điểm danh' : 'Điểm danh học sinh'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session and Student Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="session_id" className="block text-sm font-medium text-gray-700 mb-1">
              Buổi học *
            </label>
            <select
              id="session_id"
              name="session_id"
              value={formData.session_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn buổi học</option>
              {sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.classes?.class_name} - {new Date(session.session_date).toLocaleDateString('vi-VN')} ({session.start_time}-{session.end_time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
              Học sinh *
            </label>
            <select
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn học sinh</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} - {student.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Information Display */}
        {(getSelectedSession() || getSelectedStudent()) && (
          <div className="bg-gray-50 p-4 rounded-md">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái điểm danh *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getStatusColor(formData.status)}`}
            >
              <option value="present">Có mặt</option>
              <option value="absent">Vắng mặt</option>
              <option value="late">Đi muộn</option>
              <option value="excused">Nghỉ có phép</option>
            </select>
          </div>

          <div>
            <label htmlFor="check_in_time" className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian check-in
            </label>
            <input
              type="datetime-local"
              id="check_in_time"
              name="check_in_time"
              value={formData.check_in_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Ý nghĩa trạng thái:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Có mặt: Học sinh tham gia đầy đủ</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              <span>Vắng mặt: Không tham gia</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span>Đi muộn: Tham gia nhưng trễ giờ</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span>Nghỉ có phép: Xin phép trước</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ghi chú về tình trạng điểm danh (tùy chọn)"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Điểm danh')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  session_id: '',
                  student_id: '',
                  status: 'present',
                  check_in_time: new Date().toISOString().slice(0, 16),
                  notes: ''
                });
              }
            }}
          >
            {isEditing ? 'Hủy' : 'Xóa form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
