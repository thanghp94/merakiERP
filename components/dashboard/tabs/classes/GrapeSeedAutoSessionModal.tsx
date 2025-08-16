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

interface GrapeSeedAutoSessionFormData {
  numberOfSessions: number;
  sessionType: 'TSI_first' | 'REP_first';
  start_date: string;
  startingLesson: string;
  room_id: string;
}

interface GrapeSeedAutoSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedClass: Class | null;
}

const GrapeSeedAutoSessionModal: React.FC<GrapeSeedAutoSessionModalProps> = ({ 
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
  const [formData, setFormData] = useState<GrapeSeedAutoSessionFormData>({
    numberOfSessions: 1,
    sessionType: 'TSI_first',
    start_date: '',
    startingLesson: 'L1',
    room_id: ''
  });

  // GrapeSeed-specific state
  const [tsiFirst, setTsiFirst] = useState(false);
  const [repFirst, setRepFirst] = useState(false);
  const [tsiTeacher, setTsiTeacher] = useState('');
  const [repTeacher, setRepTeacher] = useState('');
  const [tsiAssistant, setTsiAssistant] = useState('');
  const [repAssistant, setRepAssistant] = useState('');

  // Get unit number for timing calculations
  const getUnitNumber = (): number => {
    if (!selectedClass?.data?.unit) return 1;
    const unitMatch = selectedClass.data.unit.match(/U?(\d+)/);
    return unitMatch ? parseInt(unitMatch[1]) : 1;
  };

  // Calculate session durations based on unit
  const getSessionDurations = () => {
    const unitNumber = getUnitNumber();
    const isHighLevel = unitNumber >= 21;
    
    return {
      tsi: isHighLevel ? 50 : 40, // minutes
      rep: isHighLevel ? 40 : 30  // minutes
    };
  };

  // Generate lesson options (L1 to L40)
  const getLessonOptions = () => {
    const options = [];
    for (let i = 1; i <= 40; i++) {
      options.push({ value: `L${i}`, label: `L${i}` });
    }
    return options;
  };

  // Load dropdown data on component mount
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, selectedClass]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        numberOfSessions: 1,
        sessionType: 'TSI_first',
        start_date: '',
        startingLesson: 'L1',
        room_id: ''
      });
      setTsiFirst(false);
      setRepFirst(false);
      setTsiTeacher('');
      setRepTeacher('');
      setTsiAssistant('');
      setRepAssistant('');
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

  // Handle checkbox changes for GrapeSeed
  const handleTsiFirstChange = (checked: boolean) => {
    setTsiFirst(checked);
    if (checked) {
      setRepFirst(false);
      setFormData(prev => ({ ...prev, sessionType: 'TSI_first' }));
    }
  };

  const handleRepFirstChange = (checked: boolean) => {
    setRepFirst(checked);
    if (checked) {
      setTsiFirst(false);
      setFormData(prev => ({ ...prev, sessionType: 'REP_first' }));
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

    if (!tsiFirst && !repFirst) {
      return 'Vui lòng chọn TSI trước hoặc REP trước';
    }

    if (!formData.startingLesson) {
      return 'Vui lòng chọn lesson bắt đầu';
    }

    if (!formData.room_id) {
      return 'Vui lòng chọn phòng học';
    }

    // Validate teacher assignments
    if (tsiFirst && !tsiTeacher) {
      return 'Vui lòng chọn giáo viên TSI';
    }

    if (repFirst && !repTeacher) {
      return 'Vui lòng chọn giáo viên REP';
    }

    if ((tsiFirst || repFirst) && !repTeacher && !tsiTeacher) {
      return 'Vui lòng chọn ít nhất một giáo viên';
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
      // Prepare data for the GrapeSEED API
      const submitData = {
        class_id: selectedClass?.id,
        numberOfSessions: formData.numberOfSessions,
        start_date: formData.start_date,
        startingLesson: formData.startingLesson,
        sessionType: formData.sessionType,
        tsiFirst: tsiFirst,
        repFirst: repFirst,
        tsiTeacherId: tsiTeacher || null,
        repTeacherId: repTeacher || null,
        tsiAssistantId: tsiAssistant || null,
        repAssistantId: repAssistant || null,
        roomId: formData.room_id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      console.log('Submitting GrapeSEED auto-session data:', submitData);
      
      // Call the GrapeSEED-specific API
      const response = await fetch('/api/auto-sessions/grapeseed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Tạo buổi học GrapeSEED thành công!');
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
      console.error('Error creating GrapeSEED auto sessions:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setFormData({
      numberOfSessions: 1,
      sessionType: 'TSI_first',
      start_date: '',
      startingLesson: 'L1',
      room_id: ''
    });
    setTsiFirst(false);
    setRepFirst(false);
    setTsiTeacher('');
    setRepTeacher('');
    setTsiAssistant('');
    setRepAssistant('');
    onClose();
  };

  const durations = getSessionDurations();
  const lessonOptions = getLessonOptions();

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm buổi dạy tự động - GrapeSEED"
      onSubmit={handleFormSubmit}
      onCancel={handleModalCancel}
      submitLabel="Tạo buổi GrapeSEED"
      cancelLabel="Hủy"
      isSubmitting={isSubmitting}
      maxWidth="5xl"
    >
      {/* Class Information */}
      {selectedClass && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin lớp GrapeSEED</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Lớp:</strong> {selectedClass.class_name}</p>
            <p><strong>Chương trình:</strong> {selectedClass.data?.program_type || 'GrapeSEED'}</p>
            {selectedClass.data?.unit && (
              <p><strong>Unit:</strong> {selectedClass.data.unit}</p>
            )}
            <p><strong>Cơ sở:</strong> {selectedClass.facilities?.name || 'Chưa xác định'}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin cơ bản</h3>
        
        <FormGrid columns={4} gap="md">
          <FormField label="Số buổi" required>
            <input
              type="number"
              name="numberOfSessions"
              value={formData.numberOfSessions}
              onChange={handleInputChange}
              min="1"
              max="50"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </FormField>

          <FormField label="Ngày bắt đầu" required>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </FormField>

          <FormField label="Lesson bắt đầu" required>
            <select
              name="startingLesson"
              value={formData.startingLesson}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              {lessonOptions.map((lesson) => (
                <option key={lesson.value} value={lesson.value}>
                  {lesson.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Phòng học" required>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

      {/* GrapeSeed Session Type Selection */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Tùy chọn GrapeSEED</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Chọn thứ tự session (chỉ được chọn 1):</p>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tsiFirst}
                onChange={(e) => handleTsiFirstChange(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">TSI trước ({durations.tsi} phút)</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={repFirst}
                onChange={(e) => handleRepFirstChange(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">REP trước ({durations.rep} phút)</span>
            </label>
          </div>
        </div>

        {(tsiFirst || repFirst) && (
          <div className="space-y-6">
            {/* Show REP first when repFirst is selected */}
            {repFirst && (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-3">
                  Session REP ({durations.rep} phút)
                </h4>
                
                <FormGrid columns={2} gap="md">
                  <FormField label="Giáo viên REP" required>
                    <select
                      value={repTeacher}
                      onChange={(e) => setRepTeacher(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={isLoadingDropdowns}
                      required
                    >
                      <option value="">Chọn giáo viên REP</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Trợ giảng REP">
                    <select
                      value={repAssistant}
                      onChange={(e) => setRepAssistant(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn trợ giảng REP</option>
                      {teachingAssistants.map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </FormGrid>
              </div>
            )}

            {/* Show TSI */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-3">
                Session TSI ({durations.tsi} phút)
              </h4>
              
              <FormGrid columns={2} gap="md">
                <FormField label="Giáo viên TSI" required>
                  <select
                    value={tsiTeacher}
                    onChange={(e) => setTsiTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={isLoadingDropdowns}
                    required
                  >
                    <option value="">Chọn giáo viên TSI</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Trợ giảng TSI">
                  <select
                    value={tsiAssistant}
                    onChange={(e) => setTsiAssistant(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={isLoadingDropdowns}
                  >
                    <option value="">Chọn trợ giảng TSI</option>
                    {teachingAssistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.full_name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </FormGrid>
            </div>

            {/* Show REP second when tsiFirst is selected */}
            {tsiFirst && (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-3">
                  Session REP ({durations.rep} phút)
                </h4>
                
                <FormGrid columns={2} gap="md">
                  <FormField label="Giáo viên REP" required>
                    <select
                      value={repTeacher}
                      onChange={(e) => setRepTeacher(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={isLoadingDropdowns}
                      required
                    >
                      <option value="">Chọn giáo viên REP</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Trợ giảng REP">
                    <select
                      value={repAssistant}
                      onChange={(e) => setRepAssistant(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn trợ giảng REP</option>
                      {teachingAssistants.map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.full_name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </FormGrid>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {formData.numberOfSessions > 0 && (tsiFirst || repFirst) && (
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-green-800 mb-2">Tóm tắt GrapeSEED</h4>
          <div className="text-sm text-green-700">
            <p>Sẽ tạo <strong>{formData.numberOfSessions}</strong> buổi học GrapeSEED</p>
            <p>Mỗi buổi có 2 session: <strong>{tsiFirst ? 'TSI → REP' : 'REP → TSI'}</strong></p>
            <p>Bắt đầu từ lesson: <strong>{formData.startingLesson}</strong></p>
            <p>Thời gian: Theo lịch học của lớp, bắt đầu từ {formData.start_date}</p>
            <p>Thời lượng TSI: <strong>{durations.tsi} phút</strong>, REP: <strong>{durations.rep} phút</strong></p>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default GrapeSeedAutoSessionModal;
