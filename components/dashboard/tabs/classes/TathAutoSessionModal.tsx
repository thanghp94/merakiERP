import React, { useState, useEffect } from 'react';
import { FormModal, FormGrid, FormField } from '../../shared';

interface Employee {
  id: string;
  full_name: string;
  position: string;
}

interface Room {
  id: string;
  name: string;
}

interface Class {
  id: string;
  class_name: string;
  facility_id: string;
  facilities?: {
    name: string;
  };
  data?: {
    program_type?: string;
    unit?: string;
    schedule_entries?: Array<{
      id: string;
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

interface WeeklyScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  subjectType: string;
  teacher_id: string;
  teaching_assistant_id: string;
}

interface TathAutoSessionFormData {
  numberOfSessions: number;
  start_date: string;
  teacher_id: string;
  teaching_assistant_id: string;
  room_id: string;
}

interface TathAutoSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedClass: Class | null;
}

const TathAutoSessionModal: React.FC<TathAutoSessionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedClass 
}): JSX.Element => {
  // State for dropdown data
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [teachingAssistants, setTeachingAssistants] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<TathAutoSessionFormData>({
    numberOfSessions: 1,
    start_date: '',
    teacher_id: '',
    teaching_assistant_id: '',
    room_id: ''
  });

  // Weekly schedule state for TATH classes
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleEntry[]>([]);

  // Subject type options for TATH classes
  const getSubjectTypeOptions = () => {
    return [
      { value: 'Cambridge', label: 'Cambridge' },
      { value: 'Phổ thông Mỹ', label: 'Phổ thông Mỹ' },
      { value: 'Ôn tập online', label: 'Ôn tập online' },
      { value: 'Grammar', label: 'Grammar' },
      { value: 'Speaking', label: 'Speaking' },
      { value: 'Writing', label: 'Writing' },
      { value: 'Reading', label: 'Reading' },
      { value: 'Listening', label: 'Listening' }
    ];
  };

  // Load dropdown data on component mount
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      initializeWeeklySchedule();
    }
  }, [isOpen, selectedClass]);

  // Initialize weekly schedule for TATH classes
  const initializeWeeklySchedule = () => {
    if (selectedClass?.data?.schedule_entries) {
      const schedule = selectedClass.data.schedule_entries.map(entry => ({
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectType: '',
        teacher_id: '',
        teaching_assistant_id: ''
      }));
      setWeeklySchedule(schedule);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        numberOfSessions: 1,
        start_date: '',
        teacher_id: '',
        teaching_assistant_id: '',
        room_id: ''
      });
      setWeeklySchedule([]);
    }
  }, [isOpen]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      // Fetch all employees
      const employeesResponse = await fetch('/api/employees');
      const employeesResult = await employeesResponse.json();
      
      if (employeesResult.success) {
        // Filter teachers
        const teachersList = employeesResult.data.filter((emp: Employee) => {
          const position = emp.position?.toLowerCase() || '';
          return position.includes('giáo viên') || 
                 position.includes('teacher') || 
                 position.includes('gv') ||
                 position === 'teacher';
        });
        setTeachers(teachersList);

        // Filter teaching assistants
        const assistantsList = employeesResult.data.filter((emp: Employee) => {
          const position = emp.position?.toLowerCase() || '';
          return position.includes('trợ giảng') || 
                 position.includes('assistant') || 
                 position.includes('ta') ||
                 position === 'assistant';
        });
        setTeachingAssistants(assistantsList);
      }

      // Fetch rooms from facilities data
      const facilitiesResponse = await fetch('/api/facilities');
      const facilitiesResult = await facilitiesResponse.json();
      if (facilitiesResult.success) {
        const roomsList: Room[] = [];
        
        // Filter rooms by class facility if available
        const classFacilityId = selectedClass?.facility_id;
        
        facilitiesResult.data.forEach((facility: any) => {
          // If class has a facility, only show rooms from that facility
          if (classFacilityId && facility.id !== classFacilityId) {
            return;
          }
          
          if (facility.data?.rooms && Array.isArray(facility.data.rooms)) {
            facility.data.rooms.forEach((room: any) => {
              roomsList.push({
                id: room.id || `${facility.id}_${room.name}`,
                name: `${room.name} (${facility.name})`
              });
            });
          }
          
          if (facility.data?.type === 'classroom' || 
              facility.data?.type === 'room' ||
              facility.name?.toLowerCase().includes('phòng') ||
              facility.name?.toLowerCase().includes('room')) {
            roomsList.push({
              id: facility.id,
              name: facility.name
            });
          }
        });
        setRooms(roomsList);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfSessions' ? parseInt(value) || 1 : value
    }));
  };

  // Handle weekly schedule changes
  const handleWeeklyScheduleChange = (index: number, field: keyof WeeklyScheduleEntry, value: string) => {
    setWeeklySchedule(prev => 
      prev.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!selectedClass) {
      return 'Không có lớp học được chọn';
    }

    if (!formData.start_date) {
      return 'Ngày bắt đầu không được để trống';
    }

    if (formData.numberOfSessions < 1) {
      return 'Số buổi học phải lớn hơn 0';
    }

    if (!formData.room_id) {
      return 'Vui lòng chọn phòng học';
    }

    // Check if we have at least one teacher or subject type filled in weekly schedule
    const hasWeeklyScheduleData = weeklySchedule.some(entry => 
      entry.subjectType || entry.teacher_id
    );
    
    if (!hasWeeklyScheduleData && !formData.teacher_id) {
      return 'Vui lòng chọn ít nhất một giáo viên mặc định hoặc điền thông tin cho lịch học trong tuần';
    }

    // If weekly schedule has entries, validate them
    for (const entry of weeklySchedule) {
      if (entry.subjectType && !entry.teacher_id && !formData.teacher_id) {
        return `Vui lòng chọn giáo viên cho ${entry.day} hoặc chọn giáo viên mặc định`;
      }
    }

    return null;
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for the TATH API
      const submitData = {
        class_id: selectedClass?.id,
        numberOfSessions: formData.numberOfSessions,
        start_date: formData.start_date,
        teacher_id: formData.teacher_id,
        teaching_assistant_id: formData.teaching_assistant_id,
        room_id: formData.room_id,
        weeklySchedule: weeklySchedule,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      console.log('Submitting TATH auto-session data:', submitData);
      
      // Call the TATH-specific API
      const response = await fetch('/api/auto-sessions/tath', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Tạo buổi học TATH thành công!');
        onSubmit(submitData);
        handleModalCancel();
      } else {
        if (response.status === 409) {
          alert(`⚠️ Xung đột lịch dạy!\n\n${result.message}`);
        } else {
          alert(`Lỗi: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error creating TATH auto sessions:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setFormData({
      numberOfSessions: 1,
      start_date: '',
      teacher_id: '',
      teaching_assistant_id: '',
      room_id: ''
    });
    setWeeklySchedule([]);
    onClose();
  };

  const subjectTypeOptions = getSubjectTypeOptions();

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm buổi dạy tự động - Tiếng Anh Tiểu Học"
      onSubmit={handleFormSubmit}
      onCancel={handleModalCancel}
      submitLabel="Tạo buổi TATH"
      cancelLabel="Hủy"
      isSubmitting={isSubmitting}
      maxWidth="5xl"
    >
      {/* Class Information */}
      {selectedClass && (
        <div className="mb-4 p-4 bg-purple-50 rounded-md">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Thông tin lớp Tiếng Anh Tiểu Học</h3>
          <div className="text-sm text-purple-700">
            <p><strong>Lớp:</strong> {selectedClass.class_name}</p>
            <p><strong>Chương trình:</strong> {selectedClass.data?.program_type || 'Tiếng Anh Tiểu Học'}</p>
            <p><strong>Cơ sở:</strong> {selectedClass.facilities?.name || 'Chưa xác định'}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        
        <FormGrid columns={3} gap="md">
          <FormField label="Số buổi" required>
            <input
              type="number"
              name="numberOfSessions"
              value={formData.numberOfSessions}
              onChange={handleInputChange}
              min="1"
              max="50"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </FormField>

          <FormField label="Ngày bắt đầu" required>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </FormField>

          <FormField label="Phòng học" required>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoadingDropdowns}
              required
            >
              <option value="">Chọn phòng học</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </FormField>
        </FormGrid>
      </div>

      {/* Weekly Schedule for TATH classes */}
      {weeklySchedule.length > 0 && (
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Lịch học trong tuần</h3>
          
          <div className="space-y-4">
            {weeklySchedule.map((entry, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-purple-700 mb-3">
                  {entry.day} ({entry.startTime} - {entry.endTime})
                </h4>
                
                <FormGrid columns={3} gap="md">
                  <FormField label="Loại môn học" required>
                    <select
                      value={entry.subjectType}
                      onChange={(e) => handleWeeklyScheduleChange(index, 'subjectType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Chọn loại môn học</option>
                      {subjectTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Giáo viên">
                    <select
                      value={entry.teacher_id}
                      onChange={(e) => handleWeeklyScheduleChange(index, 'teacher_id', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn giáo viên</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Trợ giảng">
                    <select
                      value={entry.teaching_assistant_id}
                      onChange={(e) => handleWeeklyScheduleChange(index, 'teaching_assistant_id', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn trợ giảng</option>
                      {teachingAssistants.map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </FormGrid>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General teacher/assistant (fallback) */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin giảng dạy (mặc định)</h3>
        <p className="text-xs text-gray-500 mb-3">Sẽ được sử dụng khi không có giáo viên được chọn cho buổi học cụ thể</p>
        
        <FormGrid columns={2} gap="md">
          <FormField label="Giáo viên mặc định">
            <select
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoadingDropdowns}
            >
              <option value="">Chọn giáo viên mặc định</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Trợ giảng mặc định">
            <select
              name="teaching_assistant_id"
              value={formData.teaching_assistant_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoadingDropdowns}
            >
              <option value="">Chọn trợ giảng mặc định</option>
              {teachingAssistants.map((assistant) => (
                <option key={assistant.id} value={assistant.id}>
                  {assistant.full_name}
                </option>
              ))}
            </select>
          </FormField>
        </FormGrid>
      </div>

      {/* Summary */}
      {formData.numberOfSessions > 0 && (
        <div className="bg-purple-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-purple-800 mb-2">Tóm tắt TATH</h4>
          <div className="text-sm text-purple-700">
            <p>Sẽ tạo <strong>{formData.numberOfSessions}</strong> buổi học Tiếng Anh Tiểu Học</p>
            <p>Thời gian: Theo lịch học của lớp, bắt đầu từ {formData.start_date}</p>
            <p>Phòng học: {rooms.find(r => r.id === formData.room_id)?.name || 'Chưa chọn'}</p>
            {weeklySchedule.length > 0 && (
              <p>Lịch học: {weeklySchedule.length} buổi/tuần</p>
            )}
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default TathAutoSessionModal;
