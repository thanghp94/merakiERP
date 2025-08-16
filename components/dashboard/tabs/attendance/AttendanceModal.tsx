import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  full_name: string;
  english_name?: string;
}

interface Enrollment {
  id: string;
  students: Student;
}

interface AttendanceRecord {
  id?: string;
  enrollment_id: string;
  status: 'present' | 'absent' | null;
  performance_note?: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionInfo?: {
    lessonName: string;
    time: string;
    className: string;
    classId?: string;
  };
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionInfo
}) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceRecord }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, sessionId]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let classId = sessionInfo?.classId;
      let mainSessionId: string;
      
      // Get session details to find the main_session_id
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session details');
      }
      const sessionResult = await sessionResponse.json();
      
      if (!sessionResult.success) {
        throw new Error(sessionResult.message || 'Failed to get session details');
      }

      const session = sessionResult.data;
      mainSessionId = session.main_session_id; // Get the correct main_session_id
      
      // If classId is not provided, get it from main session
      if (!classId) {
        const mainSessionResponse = await fetch(`/api/main-sessions/${mainSessionId}`);
        if (!mainSessionResponse.ok) {
          throw new Error('Failed to fetch main session details');
        }
        const mainSessionResult = await mainSessionResponse.json();
        
        if (!mainSessionResult.success) {
          throw new Error(mainSessionResult.message || 'Failed to get main session details');
        }

        classId = mainSessionResult.data.class_id;
      }
      
      if (!classId) {
        throw new Error('No class found for this session');
      }

      // First, create bulk attendance records for all enrolled students
      const bulkCreateResponse = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bulk_create: true,
          main_session_id: mainSessionId,
          class_id: classId
        })
      });

      if (!bulkCreateResponse.ok) {
        console.warn('Failed to create bulk attendance, continuing...');
      }

      // Fetch existing attendance records for this main session
      const attendanceResponse = await fetch(`/api/attendance?main_session_id=${mainSessionId}`);
      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      const attendanceResult = await attendanceResponse.json();
      
      if (!attendanceResult.success) {
        throw new Error(attendanceResult.message || 'Failed to get attendance records');
      }

      // Extract enrollments and attendance data
      const attendanceRecords = attendanceResult.data || [];
      const enrollmentData: Enrollment[] = attendanceRecords.map((record: any) => ({
        id: record.enrollment_id,
        students: {
          id: record.enrollments.students.id,
          full_name: record.enrollments.students.full_name,
          english_name: record.enrollments.students.email // Using email as placeholder for english_name
        }
      }));
      
      setEnrollments(enrollmentData);
      
      // Initialize attendance records from existing data
      const initialAttendance: { [key: string]: AttendanceRecord } = {};
      attendanceRecords.forEach((record: any) => {
        initialAttendance[record.enrollment_id] = {
          id: record.id,
          enrollment_id: record.enrollment_id,
          status: record.status,
          performance_note: record.data?.performance_note || ''
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Show error message instead of fallback data
      alert('Không thể tải danh sách học sinh. Vui lòng thử lại sau.');
      setEnrollments([]);
      setAttendance({});
    } finally {
      setIsLoading(false);
    }
  };

  const updateAttendanceStatus = (enrollmentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status: prev[enrollmentId]?.status === status ? null : status
      }
    }));
  };

  const updatePerformanceNote = (enrollmentId: string, note: string) => {
    setAttendance(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        performance_note: note
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update each attendance record
      const updatePromises = Object.entries(attendance).map(async ([enrollmentId, record]) => {
        if (record.id) {
          // Update existing attendance record
          const response = await fetch(`/api/attendance/${record.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: record.status,
              data: {
                performance_note: record.performance_note
              }
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update attendance for enrollment ${enrollmentId}`);
          }
          
          return response.json();
        }
      });

      await Promise.all(updatePromises);
      alert('Điểm danh đã được lưu thành công!');
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Có lỗi xảy ra khi lưu điểm danh!');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-cyan-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-white hover:bg-cyan-600 rounded p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold">Điểm danh</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-white hover:bg-cyan-600 rounded p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-white hover:bg-cyan-600 rounded p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="text-white hover:bg-cyan-600 rounded p-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="bg-gray-50 p-3 border-b">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{sessionInfo.className}</span> - {sessionInfo.lessonName} ({sessionInfo.time})
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="ml-2 text-gray-600">Đang tải danh sách học sinh...</span>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="bg-gray-100 p-4 border-b">
                <h3 className="font-medium text-gray-800">Học sinh</h3>
              </div>

              {/* Student List */}
              <div className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => {
                  const record = attendance[enrollment.id];
                  const student = enrollment.students;
                  return (
                    <div key={enrollment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {student.full_name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Present Button - Thumbs Up */}
                          <button
                            onClick={() => updateAttendanceStatus(enrollment.id, 'present')}
                            className={`p-2 rounded-full transition-colors ${
                              record?.status === 'present'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                            }`}
                            title="Có mặt"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10.08L23,10M1,21H5V9H1V21Z" />
                            </svg>
                          </button>

                          {/* Absent Button - X */}
                          <button
                            onClick={() => updateAttendanceStatus(enrollment.id, 'absent')}
                            className={`p-2 rounded-full transition-colors ${
                              record?.status === 'absent'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                            }`}
                            title="Vắng mặt"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                          </button>

                          {/* Performance Note Button */}
                          <button
                            onClick={() => {
                              const note = prompt('Nhập ghi chú về học sinh:', record?.performance_note || '');
                              if (note !== null) {
                                updatePerformanceNote(enrollment.id, note);
                              }
                            }}
                            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-blue-100 transition-colors"
                            title="Ghi chú"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                          </button>

                          {/* Heart Button - Colored */}
                          <button className="p-2 rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                            </svg>
                          </button>

                          {/* Minus Button - Colored */}
                          <button className="p-2 rounded-full bg-orange-100 text-orange-500 hover:bg-orange-200 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19,13H5V11H19V13Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Performance Note Display */}
                      {record?.performance_note && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>Ghi chú:</strong> {record.performance_note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600">
            Tổng: {enrollments.length} học sinh
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
