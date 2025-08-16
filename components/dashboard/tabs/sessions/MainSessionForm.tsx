import React, { useState, useEffect } from 'react';

interface Session {
  subject_type: string;
  teacher_id: string;
  teaching_assistant_id: string;
  location_id: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number; // Keep for UI display only
}

interface MainSessionFormData {
  main_session_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  class_id: string;
  sessions: Session[];
}

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
  };
}

interface MainSessionFormProps {
  onSubmit: (data: MainSessionFormData) => void;
  onCancel?: () => void;
  classId?: string; // Add class ID prop
}

const MainSessionForm: React.FC<MainSessionFormProps> = ({ onSubmit, onCancel, classId }) => {
  // State for dropdown data
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [teachingAssistants, setTeachingAssistants] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  
  // State quản lý dữ liệu form
  const [formData, setFormData] = useState<MainSessionFormData>({
    main_session_name: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    total_duration_minutes: 0,
    class_id: classId || '',
    sessions: [
      {
        subject_type: '',
        teacher_id: '',
        teaching_assistant_id: '',
        location_id: '',
        start_time: '',
        end_time: '',
        duration_minutes: 0
      }
    ]
  });

  // State for selected class info
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [lessonNumbers, setLessonNumbers] = useState<Array<{value: string, label: string}>>([]);
  const [selectedLessonNumber, setSelectedLessonNumber] = useState<string>('');

  // Load dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Function to generate lesson name based on class program and unit
  const generateLessonName = (classData: Class | null, lessonNumber: string): string => {
    if (!classData || !lessonNumber) return '';
    
    // Check if class has GrapeSEED program
    const programType = classData.data?.program_type || '';
    const currentUnit = classData.data?.unit || '';
    const className = classData.class_name || '';
    
    if (programType === 'GrapeSEED' && currentUnit && lessonNumber && className) {
      return `${className}.${currentUnit}.${lessonNumber}`;
    }
    
    // For non-GrapeSEED classes, return empty (user will input manually)
    return '';
  };

  // Effect to handle class selection and generate lesson numbers
  useEffect(() => {
    if (formData.class_id && classes.length > 0) {
      const selectedClassData = classes.find(cls => cls.id === formData.class_id);
      setSelectedClass(selectedClassData || null);
      
      // Generate lesson numbers L1 to L40
      const lessonOptions = [];
      for (let i = 1; i <= 40; i++) {
        lessonOptions.push({
          value: `L${i}`,
          label: `L${i}`
        });
      }
      setLessonNumbers(lessonOptions);
    }
  }, [formData.class_id, classes]);

  // Effect to auto-generate lesson name when lesson number changes
  useEffect(() => {
    if (selectedClass && selectedLessonNumber) {
      const generatedName = generateLessonName(selectedClass, selectedLessonNumber);
      if (generatedName) {
        setFormData(prev => ({
          ...prev,
          main_session_name: generatedName
        }));
      }
    }
  }, [selectedClass, selectedLessonNumber]);

  // Tự động tính tổng thời gian và thời gian bắt đầu/kết thúc khi sessions thay đổi
  useEffect(() => {
    const totalDuration = formData.sessions.reduce((sum: number, session: Session) => sum + (session.duration_minutes || 0), 0);
    
    // Tính thời gian bắt đầu và kết thúc từ sessions
    const validSessions = formData.sessions.filter(session => session.start_time && session.end_time);
    let calculatedStartTime = '';
    let calculatedEndTime = '';
    
    if (validSessions.length > 0) {
      // Sắp xếp sessions theo thời gian bắt đầu
      const sortedSessions = [...validSessions].sort((a, b) => a.start_time.localeCompare(b.start_time));
      calculatedStartTime = sortedSessions[0].start_time; // Thời gian bắt đầu của session đầu tiên
      calculatedEndTime = sortedSessions[sortedSessions.length - 1].end_time; // Thời gian kết thúc của session cuối cùng
    }
    
    setFormData((prev: MainSessionFormData) => ({
      ...prev,
      total_duration_minutes: totalDuration,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime
    }));
  }, [formData.sessions]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      // Fetch all employees first
      const employeesResponse = await fetch('/api/employees');
      const employeesResult = await employeesResponse.json();
      
      if (employeesResult.success) {
        // Filter teachers (employees with position containing "giáo viên" or "teacher")
        const teachersList = employeesResult.data.filter((emp: Employee) => {
          const position = emp.position?.toLowerCase() || '';
          return position.includes('giáo viên') || 
                 position.includes('teacher') || 
                 position.includes('gv') ||
                 position === 'teacher';
        });
        setTeachers(teachersList);

        // Filter teaching assistants (employees with position containing "trợ giảng" or "assistant")
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
        facilitiesResult.data.forEach((facility: any) => {
          // Check if facility has rooms in JSONB data
          if (facility.data?.rooms && Array.isArray(facility.data.rooms)) {
            facility.data.rooms.forEach((room: any) => {
              roomsList.push({
                id: room.id || `${facility.id}_${room.name}`,
                name: `${room.name} (${facility.name})`
              });
            });
          }
          
          // Check if facility itself is a room/classroom
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

      // Fetch classes
      const classesResponse = await fetch('/api/classes');
      const classesResult = await classesResponse.json();
      if (classesResult.success) {
        setClasses(classesResult.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Hàm xử lý thay đổi thông tin chung của buổi học
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: MainSessionFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm tính thời lượng từ thời gian bắt đầu và kết thúc
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (end <= start) return 0;
    
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Convert to minutes
  };

  // Hàm xử lý thay đổi thông tin của từng session
  const handleSessionChange = (sessionIndex: number, field: keyof Session, value: string | number) => {
    setFormData((prev: MainSessionFormData) => {
      const updatedSessions = prev.sessions.map((session: Session, index: number) => {
        if (index === sessionIndex) {
          const updatedSession = { ...session, [field]: value };
          
          // Auto-calculate duration when start_time or end_time changes
          if (field === 'start_time' || field === 'end_time') {
            const startTime = field === 'start_time' ? value as string : session.start_time;
            const endTime = field === 'end_time' ? value as string : session.end_time;
            updatedSession.duration_minutes = calculateDuration(startTime, endTime);
          }
          
          return updatedSession;
        }
        return session;
      });
      
      return {
        ...prev,
        sessions: updatedSessions
      };
    });
  };

  // Hàm thêm session mới
  const handleAddSession = () => {
    const newSession: Session = {
      subject_type: '',
      teacher_id: '',
      teaching_assistant_id: '',
      location_id: '',
      start_time: '',
      end_time: '',
      duration_minutes: 0
    };

    setFormData((prev: MainSessionFormData) => ({
      ...prev,
      sessions: [...prev.sessions, newSession]
    }));
  };

  // Hàm xóa session
  const handleRemoveSession = (sessionIndex: number) => {
    if (formData.sessions.length > 1) {
      setFormData((prev: MainSessionFormData) => ({
        ...prev,
        sessions: prev.sessions.filter((_: Session, index: number) => index !== sessionIndex)
      }));
    }
  };

  // Hàm validation cơ bản
  const validateForm = (): string | null => {
    if (!formData.class_id) {
      return 'Lớp học không được để trống';
    }

    // For GrapeSEED classes, check lesson number selection
    if (selectedClass?.data?.program_type === 'GrapeSEED') {
      if (!selectedLessonNumber) {
        return 'Số bài học không được để trống cho lớp GrapeSEED';
      }
    } else {
      // For non-GrapeSEED classes, check manual lesson name input
      if (!formData.main_session_name.trim()) {
        return 'Tên bài học không được để trống';
      }
    }

    if (!formData.scheduled_date) {
      return 'Ngày học không được để trống';
    }

    if (formData.sessions.length === 0) {
      return 'Phải có ít nhất một session';
    }

    for (let i = 0; i < formData.sessions.length; i++) {
      const session = formData.sessions[i];
      if (!session.subject_type) {
        return `Session ${i + 1}: Loại môn học không được để trống`;
      }
      if (!session.teacher_id) {
        return `Session ${i + 1}: Giáo viên không được để trống`;
      }
      if (!session.location_id) {
        return `Session ${i + 1}: Phòng học không được để trống`;
      }
      if (!session.start_time) {
        return `Session ${i + 1}: Thời gian bắt đầu không được để trống`;
      }
      if (!session.end_time) {
        return `Session ${i + 1}: Thời gian kết thúc không được để trống`;
      }
      if ((session.duration_minutes || 0) <= 0) {
        return `Session ${i + 1}: Thời lượng phải lớn hơn 0 (kiểm tra thời gian bắt đầu và kết thúc)`;
      }
    }

    // Kiểm tra xem có ít nhất một session hợp lệ để tính thời gian buổi học
    if (!formData.start_time || !formData.end_time) {
      return 'Cần có ít nhất một session với thời gian hợp lệ để tự động tính thời gian buổi học';
    }

    return null;
  };

  // Hàm xử lý submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      // Detect user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Prepare data with lesson number and timezone
      const submitData = {
        ...formData,
        lesson_number: selectedLessonNumber, // Include the selected lesson number
        timezone: userTimezone // Include user's timezone
      };

      console.log('Submitting with timezone:', userTimezone); // Debug log

      // Submit to main-sessions API
      const response = await fetch('/api/main-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Tạo bài học thành công!');
        // Reset form or call onSubmit callback
        onSubmit(formData);
      } else {
        // Handle different types of errors
        if (response.status === 409) {
          // Schedule conflict error
          alert(`⚠️ Xung đột lịch dạy!\n\n${result.message}`);
        } else {
          // Other errors
          alert(`Lỗi: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Có lỗi xảy ra khi tạo bài học');
    }
  };

  // Danh sách các loại môn học
  const subjectTypes = [
    { value: 'TSI', label: 'TSI (Teaching Speaking & Interaction)' },
    { value: 'REP', label: 'REP (Repetition)' },
    { value: 'GRA', label: 'GRA (Grammar)' },
    { value: 'VOC', label: 'VOC (Vocabulary)' },
    { value: 'LIS', label: 'LIS (Listening)' },
    { value: 'REA', label: 'REA (Reading)' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Tạo Bài Học Mới</h2>
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Thông tin chung của buổi học */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Thông tin chung</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">
                Lớp học *
              </label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoadingDropdowns}
              >
                <option value="">Chọn lớp học</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.facilities?.name || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Show lesson number selector for GrapeSEED classes */}
            {selectedClass?.data?.program_type === 'GrapeSEED' && (
              <div>
                <label htmlFor="lesson_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Số bài học *
                </label>
                <select
                  id="lesson_number"
                  value={selectedLessonNumber}
                  onChange={(e) => setSelectedLessonNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn số bài học</option>
                  {lessonNumbers.map((lesson) => (
                    <option key={lesson.value} value={lesson.value}>
                      {lesson.label}
                    </option>
                  ))}
                </select>
                {selectedClass?.data?.unit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tên bài học sẽ là: {selectedClass.class_name}.{selectedClass.data.unit}.{selectedLessonNumber || 'L?'}
                  </p>
                )}
              </div>
            )}

            {/* Show manual input for non-GrapeSEED classes */}
            {(!selectedClass?.data?.program_type || selectedClass?.data?.program_type !== 'GrapeSEED') && (
              <div>
                <label htmlFor="main_session_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên bài học *
                </label>
                <input
                  type="text"
                  id="main_session_name"
                  name="main_session_name"
                  value={formData.main_session_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên bài học"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày học *
              </label>
              <input
                type="date"
                id="scheduled_date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian bắt đầu buổi học * <span className="text-xs text-blue-600">(Tự động tính)</span>
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                readOnly
                placeholder="--:--"
              />
              <p className="text-xs text-gray-500 mt-1">Thời gian bắt đầu của session đầu tiên</p>
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian kết thúc buổi học * <span className="text-xs text-blue-600">(Tự động tính)</span>
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                readOnly
                placeholder="--:--"
              />
              <p className="text-xs text-gray-500 mt-1">Thời gian kết thúc của session cuối cùng</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="text-sm font-medium text-blue-800">
                Tổng thời gian: {formData.total_duration_minutes} phút
              </span>
            </div>
          </div>
        </div>

        {/* Chi tiết Sessions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Chi tiết Sessions</h3>
            <button
              type="button"
              onClick={handleAddSession}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Thêm Session</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.sessions.map((session: Session, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-700">Session {index + 1}</h4>
                  {formData.sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ❌ Xóa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại môn học *
                    </label>
                    <select
                      value={session.subject_type}
                      onChange={(e) => handleSessionChange(index, 'subject_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn loại môn học</option>
                      {subjectTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giáo viên *
                    </label>
                    <select
                      value={session.teacher_id}
                      onChange={(e) => handleSessionChange(index, 'teacher_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn giáo viên</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trợ giảng
                    </label>
                    <select
                      value={session.teaching_assistant_id}
                      onChange={(e) => handleSessionChange(index, 'teaching_assistant_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn trợ giảng</option>
                      {teachingAssistants.map((assistant) => (
                        <option key={assistant.id} value={assistant.id}>
                          {assistant.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phòng học *
                    </label>
                    <select
                      value={session.location_id}
                      onChange={(e) => handleSessionChange(index, 'location_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isLoadingDropdowns}
                    >
                      <option value="">Chọn phòng học</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian bắt đầu *
                    </label>
                    <input
                      type="time"
                      value={session.start_time}
                      onChange={(e) => handleSessionChange(index, 'start_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian kết thúc *
                    </label>
                    <input
                      type="time"
                      value={session.end_time}
                      onChange={(e) => handleSessionChange(index, 'end_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời lượng (phút) *
                    </label>
                    <input
                      type="number"
                      value={session.duration_minutes || 0}
                      onChange={(e) => handleSessionChange(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="1"
                      required
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Tạo Bài học
          </button>
        </div>
      </form>
    </div>
  );
};

export default MainSessionForm;
