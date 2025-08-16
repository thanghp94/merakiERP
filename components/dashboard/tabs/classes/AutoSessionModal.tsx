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

interface AutoSessionFormData {
  numberOfSessions: number;
  sessionType: 'TSI_first' | 'REP_first' | 'single';
  teacher_id: string;
  teaching_assistant_id: string;
  room_id: string;
  start_date: string;
  startingLesson: string; // For Grapeseed classes (L1, L2, etc.)
}

interface WeeklyScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  subjectType: string;
  teacher_id: string;
  teaching_assistant_id: string;
}

interface AutoSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedClass: Class | null;
}

const AutoSessionModal: React.FC<AutoSessionModalProps> = ({ 
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
  const [formData, setFormData] = useState<AutoSessionFormData>({
    numberOfSessions: 1,
    sessionType: 'single',
    teacher_id: '',
    teaching_assistant_id: '',
    room_id: '',
    start_date: '',
    startingLesson: 'L1'
  });

  // Grapeseed-specific state
  const [tsiFirst, setTsiFirst] = useState(false);
  const [repFirst, setRepFirst] = useState(false);
  const [tsiTeacher, setTsiTeacher] = useState('');
  const [repTeacher, setRepTeacher] = useState('');
  const [repAssistant, setRepAssistant] = useState('');

  // Non-Grapeseed weekly schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleEntry[]>([]);

  // Check if class is Grapeseed
  const isGrapeseed = selectedClass?.data?.program_type === 'GrapeSEED';

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

  // Subject type options for non-Grapeseed classes
  const getSubjectTypeOptions = () => {
    const programType = selectedClass?.data?.program_type;
    
    if (programType === 'TATH' || programType === 'Tiếng Anh Tiểu Học') {
      return [
        { value: 'Cambridge', label: 'Cambridge' },
        { value: 'Phổ thông Mỹ', label: 'Phổ thông Mỹ' },
        { value: 'Ôn tập online', label: 'Ôn tập online' },
        { value: 'Grammar', label: 'Grammar' },
        { value: 'Speaking', label: 'Speaking' },
        { value: 'Writing', label: 'Writing' }
      ];
    }
    
    return [
      { value: 'General', label: 'General' },
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

  // Initialize weekly schedule for non-Grapeseed classes
  const initializeWeeklySchedule = () => {
    if (!isGrapeseed && selectedClass?.data?.schedule_entries) {
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
        sessionType: 'single',
        teacher_id: '',
        teaching_assistant_id: '',
        room_id: '',
        start_date: '',
        startingLesson: 'L1'
      });
      setTsiFirst(false);
      setRepFirst(false);
      setTsiTeacher('');
      setRepTeacher('');
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

  // Handle checkbox changes for Grapeseed
  const handleTsiFirstChange = (checked: boolean) => {
    setTsiFirst(checked);
    if (checked) {
      setRepFirst(false);
      setFormData(prev => ({ ...prev, sessionType: 'TSI_first' }));
    } else {
      setFormData(prev => ({ ...prev, sessionType: 'single' }));
    }
  };

  const handleRepFirstChange = (checked: boolean) => {
    setRepFirst(checked);
    if (checked) {
      setTsiFirst(false);
      setFormData(prev => ({ ...prev, sessionType: 'REP_first' }));
    } else {
      setFormData(prev => ({ ...prev, sessionType: 'single' }));
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

  // Handle weekly schedule changes for non-Grapeseed classes
  const handleWeeklyScheduleChange = (index: number, field: keyof WeeklyScheduleEntry, value: string) => {
    setWeeklySchedule(prev => 
      prev.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Calculate next lesson date based on class schedule
  const getNextLessonDate = (startDate: Date, targetDay: string, weekOffset: number = 0): Date => {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const targetDayNum = dayMap[targetDay.toLowerCase()];
    const currentDay = startDate.getDay();
    
    let daysUntilTarget = (targetDayNum - currentDay + 7) % 7;
    if (daysUntilTarget === 0 && weekOffset === 0) {
      // If today is the target day and it's the first session, use today
      daysUntilTarget = 0;
    }
    
    const resultDate = new Date(startDate);
    resultDate.setDate(resultDate.getDate() + daysUntilTarget + (weekOffset * 7));
    
    return resultDate;
  };

  // Generate sessions based on class schedule and form data
  const generateSessions = () => {
    if (!selectedClass?.data?.schedule_entries || selectedClass.data.schedule_entries.length === 0) {
      throw new Error('Lớp học chưa có lịch học được thiết lập');
    }

    const startDate = new Date(formData.start_date);
    const scheduleEntries = selectedClass.data.schedule_entries;
    const durations = getSessionDurations();
    const sessions = [];
    
    // Sort schedule entries by day of week
    const sortedEntries = [...scheduleEntries].sort((a, b) => {
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      return dayMap[a.day.toLowerCase()] - dayMap[b.day.toLowerCase()];
    });

    if (isGrapeseed && (tsiFirst || repFirst)) {
      // Grapeseed lesson progression logic
      let currentLessonNum = parseInt(formData.startingLesson.replace('L', ''));
      let weekOffset = 0;
      let sessionCount = 0;

      while (sessionCount < formData.numberOfSessions) {
        for (const scheduleEntry of sortedEntries) {
          if (sessionCount >= formData.numberOfSessions) break;

          const sessionDate = getNextLessonDate(startDate, scheduleEntry.day, weekOffset);
          const sessionDateStr = sessionDate.toISOString().split('T')[0];
          const currentUnit = selectedClass.data?.unit || 'U1';
          const lessonId = `${currentUnit}.L${currentLessonNum}`;

          // Create two sessions for Grapeseed
          const startTime = scheduleEntry.startTime;
          const [startHour, startMinute] = startTime.split(':').map(Number);
          
          let firstSessionType, secondSessionType;
          let firstTeacher, secondTeacher, secondAssistant;
          let firstDuration, secondDuration;
          
          if (tsiFirst) {
            firstSessionType = 'TSI';
            secondSessionType = 'REP';
            firstTeacher = tsiTeacher;
            secondTeacher = repTeacher;
            secondAssistant = repAssistant;
            firstDuration = durations.tsi;
            secondDuration = durations.rep;
          } else {
            firstSessionType = 'REP';
            secondSessionType = 'TSI';
            firstTeacher = repTeacher;
            secondTeacher = tsiTeacher;
            secondAssistant = repAssistant;
            firstDuration = durations.rep;
            secondDuration = durations.tsi;
          }

          // First session
          const firstEndTime = new Date();
          firstEndTime.setHours(startHour, startMinute + firstDuration);
          
          sessions.push({
            session_date: sessionDateStr,
            subject_type: firstSessionType,
            teacher_id: firstTeacher,
            teaching_assistant_id: firstSessionType === 'REP' ? secondAssistant : '',
            location_id: formData.room_id,
            start_time: startTime,
            end_time: `${firstEndTime.getHours().toString().padStart(2, '0')}:${firstEndTime.getMinutes().toString().padStart(2, '0')}`,
            duration_minutes: firstDuration,
            lesson_id: lessonId
          });

          // Second session (5 minutes break)
          const secondStartTime = new Date();
          secondStartTime.setHours(startHour, startMinute + firstDuration + 5);
          
          const secondEndTime = new Date();
          secondEndTime.setHours(startHour, startMinute + firstDuration + 5 + secondDuration);
          
          sessions.push({
            session_date: sessionDateStr,
            subject_type: secondSessionType,
            teacher_id: secondTeacher,
            teaching_assistant_id: secondSessionType === 'REP' ? secondAssistant : '',
            location_id: formData.room_id,
            start_time: `${secondStartTime.getHours().toString().padStart(2, '0')}:${secondStartTime.getMinutes().toString().padStart(2, '0')}`,
            end_time: `${secondEndTime.getHours().toString().padStart(2, '0')}:${secondEndTime.getMinutes().toString().padStart(2, '0')}`,
            duration_minutes: secondDuration,
            lesson_id: lessonId
          });

          currentLessonNum++;
          sessionCount++;
        }
        weekOffset++;
      }
    } else {
      // Non-Grapeseed classes - use weekly schedule
      let weekOffset = 0;
      let sessionCount = 0;

      while (sessionCount < formData.numberOfSessions) {
        for (const scheduleEntry of weeklySchedule) {
          if (sessionCount >= formData.numberOfSessions) break;

          const sessionDate = getNextLessonDate(startDate, scheduleEntry.day, weekOffset);
          const sessionDateStr = sessionDate.toISOString().split('T')[0];

          sessions.push({
            session_date: sessionDateStr,
            subject_type: scheduleEntry.subjectType || 'General',
            teacher_id: scheduleEntry.teacher_id || formData.teacher_id,
            teaching_assistant_id: scheduleEntry.teaching_assistant_id || formData.teaching_assistant_id,
            location_id: formData.room_id,
            start_time: scheduleEntry.startTime,
            end_time: scheduleEntry.endTime,
            duration_minutes: 90 // Default duration for non-Grapeseed
          });

          sessionCount++;
        }
        weekOffset++;
      }
    }

    return sessions;
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

    if (isGrapeseed) {
      if (!tsiFirst && !repFirst) {
        return 'Vui lòng chọn TSI trước hoặc REP trước';
      }

      if (!formData.startingLesson) {
        return 'Vui lòng chọn lesson bắt đầu';
      }

      // Teacher/assistant/room fields are now optional - no validation required
    } else {
      // For non-Grapeseed classes, we need at least one teacher or subject type filled
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
      // Prepare data for the new API structure
      const submitData = {
        numberOfSessions: formData.numberOfSessions,
        tsiFirst: tsiFirst,
        tsiTeacherId: tsiTeacher || null,
        repTeacherId: repTeacher || null,
        tsiAssistantId: formData.teaching_assistant_id || null,
        repAssistantId: repAssistant || null,
        roomId: formData.room_id || null,
        startingLesson: formData.startingLesson,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      console.log('Submitting auto-session data:', submitData);
      await onSubmit(submitData);
      handleModalCancel();
    } catch (error) {
      console.error('Error creating auto sessions:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setFormData({
      numberOfSessions: 1,
      sessionType: 'single',
      teacher_id: '',
      teaching_assistant_id: '',
      room_id: '',
      start_date: '',
      startingLesson: 'L1'
    });
    setTsiFirst(false);
    setRepFirst(false);
    setTsiTeacher('');
    setRepTeacher('');
    setRepAssistant('');
    setWeeklySchedule([]);
    onClose();
  };

  const durations = getSessionDurations();
  const lessonOptions = getLessonOptions();
  const subjectTypeOptions = getSubjectTypeOptions();

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm buổi dạy tự động"
      onSubmit={handleFormSubmit}
      onCancel={handleModalCancel}
      submitLabel="Tạo buổi tự động"
      cancelLabel="Hủy"
      isSubmitting={isSubmitting}
      maxWidth="5xl"
    >
      {/* Class Information */}
      {selectedClass && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin lớp học</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Lớp:</strong> {selectedClass.class_name}</p>
            <p><strong>Chương trình:</strong> {selectedClass.data?.program_type || 'Chưa xác định'}</p>
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
        
        <FormGrid columns={3} gap="md">
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

          {/* Starting Lesson for Grapeseed */}
          {isGrapeseed && (
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
          )}
        </FormGrid>
      </div>

      {/* Grapeseed-specific options */}
      {isGrapeseed && (
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
                    {selectedClass?.data?.schedule_entries && selectedClass.data.schedule_entries.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">
                        Thời gian: {selectedClass.data.schedule_entries[0].startTime} - 
                        {(() => {
                          const [hour, minute] = selectedClass.data.schedule_entries[0].startTime.split(':').map(Number);
                          const endTime = new Date();
                          endTime.setHours(hour, minute + durations.rep);
                          return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    )}
                  </h4>
                  
                  <FormGrid columns={3} gap="md">
                    <FormField label="Giáo viên REP">
                      <select
                        value={repTeacher}
                        onChange={(e) => setRepTeacher(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
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

                    <FormField label="Phòng học REP">
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
                      >
                        <option value="">Chọn phòng học REP</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormGrid>
                </div>
              )}

              {/* Show TSI first when tsiFirst is selected, or second when repFirst is selected */}
              {(tsiFirst || repFirst) && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">
                    Session TSI ({durations.tsi} phút)
                    {selectedClass?.data?.schedule_entries && selectedClass.data.schedule_entries.length > 0 && (
                      <span className="text-xs text-blue-600 ml-2">
                        Thời gian: 
                        {(() => {
                          const [hour, minute] = selectedClass.data.schedule_entries[0].startTime.split(':').map(Number);
                          let startTime, endTime;
                          
                          if (tsiFirst) {
                            // TSI starts at the beginning
                            startTime = new Date();
                            startTime.setHours(hour, minute);
                            endTime = new Date();
                            endTime.setHours(hour, minute + durations.tsi);
                          } else {
                            // TSI starts after REP + 5 min break
                            startTime = new Date();
                            startTime.setHours(hour, minute + durations.rep + 5);
                            endTime = new Date();
                            endTime.setHours(hour, minute + durations.rep + 5 + durations.tsi);
                          }
                          
                          return `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    )}
                  </h4>
                  
                  <FormGrid columns={3} gap="md">
                    <FormField label="Giáo viên TSI">
                      <select
                        value={tsiTeacher}
                        onChange={(e) => setTsiTeacher(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
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
                        value={formData.teaching_assistant_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, teaching_assistant_id: e.target.value }))}
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

                    <FormField label="Phòng học TSI">
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
                      >
                        <option value="">Chọn phòng học TSI</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormGrid>
                </div>
              )}

              {/* Show REP second when tsiFirst is selected */}
              {tsiFirst && (
                <div className="bg-green-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-3">
                    Session REP ({durations.rep} phút)
                    {selectedClass?.data?.schedule_entries && selectedClass.data.schedule_entries.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">
                        Thời gian: 
                        {(() => {
                          const [hour, minute] = selectedClass.data.schedule_entries[0].startTime.split(':').map(Number);
                          const repStartTime = new Date();
                          repStartTime.setHours(hour, minute + durations.tsi + 5); // TSI duration + 5 min break
                          const repEndTime = new Date();
                          repEndTime.setHours(hour, minute + durations.tsi + 5 + durations.rep);
                          return `${repStartTime.getHours().toString().padStart(2, '0')}:${repStartTime.getMinutes().toString().padStart(2, '0')} - ${repEndTime.getHours().toString().padStart(2, '0')}:${repEndTime.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    )}
                  </h4>
                  
                  <FormGrid columns={3} gap="md">
                    <FormField label="Giáo viên REP">
                      <select
                        value={repTeacher}
                        onChange={(e) => setRepTeacher(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
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

                    <FormField label="Phòng học REP">
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        disabled={isLoadingDropdowns}
                      >
                        <option value="">Chọn phòng học REP</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
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
      )}

      {/* Non-Grapeseed weekly schedule */}
      {!isGrapeseed && weeklySchedule.length > 0 && (
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Lịch học trong tuần</h3>
          
          <div className="space-y-4">
            {weeklySchedule.map((entry, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {entry.day} ({entry.startTime} - {entry.endTime})
                </h4>
                
                <FormGrid columns={3} gap="md">
                  <FormField label="Loại môn học" required>
                    <select
                      value={entry.subjectType}
                      onChange={(e) => handleWeeklyScheduleChange(index, 'subjectType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

      {/* General teacher/assistant for non-Grapeseed (fallback) */}
      {!isGrapeseed && (
        <div className="mb-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Thông tin giảng dạy (mặc định)</h3>
          
          <FormGrid columns={2} gap="md">
            <FormField label="Giáo viên mặc định">
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
      )}


      {/* Summary */}
      {formData.numberOfSessions > 0 && (
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-green-800 mb-2">Tóm tắt</h4>
          <div className="text-sm text-green-700">
            <p>Sẽ tạo <strong>{formData.numberOfSessions}</strong> buổi học</p>
            {isGrapeseed && (tsiFirst || repFirst) && (
              <>
                <p>Mỗi buổi có 2 session: <strong>{tsiFirst ? 'TSI → REP' : 'REP → TSI'}</strong></p>
                <p>Bắt đầu từ lesson: <strong>{formData.startingLesson}</strong></p>
              </>
            )}
            <p>Thời gian: Theo lịch học của lớp, bắt đầu từ {formData.start_date}</p>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default AutoSessionModal;
