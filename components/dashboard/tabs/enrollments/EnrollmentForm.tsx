import React, { useState, useEffect } from 'react';

interface EnrollmentFormProps {
  onSubmit: (enrollmentData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    student_id: initialData.student_id || '',
    class_id: initialData.class_id || '',
    enrollment_date: initialData.enrollment_date || new Date().toISOString().split('T')[0],
    status: initialData.status || 'active',
    payment_status: initialData.data?.payment_status || 'pending',
    enrollment_fee: initialData.data?.enrollment_fee || '',
    notes: initialData.data?.notes || ''
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsResponse, classesResponse] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes')
      ]);

      const studentsResult = await studentsResponse.json();
      const classesResult = await classesResponse.json();

      if (studentsResult.success) {
        setStudents(studentsResult.data);
      }
      if (classesResult.success) {
        setClasses(classesResult.data);
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
        student_id: formData.student_id,
        class_id: formData.class_id,
        enrollment_date: formData.enrollment_date,
        status: formData.status,
        data: {
          payment_status: formData.payment_status,
          enrollment_fee: formData.enrollment_fee ? parseFloat(formData.enrollment_fee) : null,
          notes: formData.notes
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          student_id: '',
          class_id: '',
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active',
          payment_status: 'pending',
          enrollment_fee: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedStudent = (): any => {
    return students.find((student: any) => student.id === formData.student_id);
  };

  const getSelectedClass = (): any => {
    return classes.find((cls: any) => cls.id === formData.class_id);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa đăng ký' : 'Đăng ký học sinh vào lớp'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student and Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">
              Lớp học *
            </label>
            <select
              id="class_id"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              required
              disabled={isLoadingData}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn lớp học</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} - {cls.facilities?.name || 'Không có cơ sở'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Information Display */}
        {(getSelectedStudent() || getSelectedClass()) && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin đã chọn:</h3>
            {getSelectedStudent() && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>Học sinh:</strong> {getSelectedStudent()?.full_name} - {getSelectedStudent()?.phone}
              </div>
            )}
            {getSelectedClass() && (
              <div className="text-sm text-gray-600">
                <strong>Lớp học:</strong> {getSelectedClass()?.class_name} - 
                Bắt đầu: {getSelectedClass()?.start_date ? new Date(getSelectedClass()?.start_date).toLocaleDateString('vi-VN') : 'Chưa có'}
              </div>
            )}
          </div>
        )}

        {/* Enrollment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="enrollment_date" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày đăng ký *
            </label>
            <input
              type="date"
              id="enrollment_date"
              name="enrollment_date"
              value={formData.enrollment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái đăng ký
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Đang học</option>
              <option value="pending">Chờ xử lý</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="suspended">Tạm nghỉ</option>
            </select>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin thanh toán</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái thanh toán
              </label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
                <option value="paid">Đã thanh toán</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <div>
              <label htmlFor="enrollment_fee" className="block text-sm font-medium text-gray-700 mb-1">
                Học phí (VNĐ)
              </label>
              <input
                type="number"
                id="enrollment_fee"
                name="enrollment_fee"
                value={formData.enrollment_fee}
                onChange={handleChange}
                min="0"
                step="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2000000"
              />
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
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ghi chú về đăng ký"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Đăng ký')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  student_id: '',
                  class_id: '',
                  enrollment_date: new Date().toISOString().split('T')[0],
                  status: 'active',
                  payment_status: 'pending',
                  enrollment_fee: '',
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

export default EnrollmentForm;
