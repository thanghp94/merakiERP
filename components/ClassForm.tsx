import React, { useState, useEffect } from 'react';

interface ScheduleEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ClassFormProps {
  onSubmit: (classData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const ClassForm: React.FC<ClassFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    class_name: initialData.class_name || '',
    facility_id: initialData.facility_id || '',
    status: initialData.status || 'active',
    start_date: initialData.start_date || '',
    program_type: initialData.data?.program_type || '',
    unit: initialData.data?.unit || '',
    description: initialData.data?.description || ''
  });

  // Schedule management state
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(
    initialData.data?.schedule_entries || []
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    day: '',
    startTime: '',
    endTime: ''
  });

  const [facilities, setFacilities] = useState([]);
  const [programTypes, setProgramTypes] = useState<Array<{value: string, label: string}>>([]);
  const [unitOptions, setUnitOptions] = useState<Array<{value: string, label: string}>>([]);
  const [showUnitField, setShowUnitField] = useState(
    initialData.data?.program_type === 'GrapeSEED' || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const dayOptions = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ];

  useEffect(() => {
    fetchFacilities();
    fetchProgramTypes();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();
      if (result.success) {
        setFacilities(result.data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  const fetchProgramTypes = async () => {
    try {
      const response = await fetch('/api/metadata/enums?type=program_type');
      const result = await response.json();
      
      if (result.success) {
        setProgramTypes(result.data);
      } else {
        console.error('Failed to fetch program types:', result.message);
        // Fallback to hardcoded values
        setProgramTypes([
          { value: 'GrapeSEED', label: 'GrapeSEED' },
          { value: 'Pre-WSC', label: 'Pre-WSC' },
          { value: 'WSC', label: 'WSC' },
          { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
          { value: 'Gavel club', label: 'Gavel club' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching program types:', error);
      // Fallback to hardcoded values
      setProgramTypes([
        { value: 'GrapeSEED', label: 'GrapeSEED' },
        { value: 'Pre-WSC', label: 'Pre-WSC' },
        { value: 'WSC', label: 'WSC' },
        { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
        { value: 'Gavel club', label: 'Gavel club' }
      ]);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const fetchUnitOptions = async () => {
    setIsLoadingUnits(true);
    try {
      const response = await fetch('/api/metadata/enums?type=unit_grapeseed');
      const result = await response.json();
      
      if (result.success) {
        setUnitOptions(result.data);
      } else {
        console.error('Failed to fetch unit options:', result.message);
        // Fallback to hardcoded values
        const fallbackUnits = [];
        for (let i = 1; i <= 30; i++) {
          fallbackUnits.push({ value: `U${i}`, label: `U${i}` });
        }
        setUnitOptions(fallbackUnits);
      }
    } catch (error) {
      console.error('Error fetching unit options:', error);
      // Fallback to hardcoded values
      const fallbackUnits = [];
      for (let i = 1; i <= 30; i++) {
        fallbackUnits.push({ value: `U${i}`, label: `U${i}` });
      }
      setUnitOptions(fallbackUnits);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Show/hide unit field based on program type selection
    if (name === 'program_type') {
      const shouldShowUnit = value === 'GrapeSEED';
      setShowUnitField(shouldShowUnit);
      
      // Fetch unit options when GrapeSEED is selected
      if (shouldShowUnit && unitOptions.length === 0) {
        fetchUnitOptions();
      }
      
      // Clear unit value when switching away from GrapeSEED
      if (!shouldShowUnit) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          unit: ''
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Schedule management functions
  const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addScheduleEntry = () => {
    if (scheduleForm.day && scheduleForm.startTime && scheduleForm.endTime) {
      const newEntry: ScheduleEntry = {
        id: Date.now().toString(),
        day: scheduleForm.day,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime
      };
      
      setScheduleEntries(prev => [...prev, newEntry]);
      setScheduleForm({ day: '', startTime: '', endTime: '' });
      setShowScheduleModal(false);
    }
  };

  const editScheduleEntry = (entry: ScheduleEntry) => {
    setEditingSchedule(entry);
    setScheduleForm({
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime
    });
    setShowScheduleModal(true);
  };

  const updateScheduleEntry = () => {
    if (editingSchedule && scheduleForm.day && scheduleForm.startTime && scheduleForm.endTime) {
      setScheduleEntries(prev => 
        prev.map(entry => 
          entry.id === editingSchedule.id 
            ? { ...entry, day: scheduleForm.day, startTime: scheduleForm.startTime, endTime: scheduleForm.endTime }
            : entry
        )
      );
      setEditingSchedule(null);
      setScheduleForm({ day: '', startTime: '', endTime: '' });
      setShowScheduleModal(false);
    }
  };

  const deleteScheduleEntry = (id: string) => {
    setScheduleEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const getDayLabel = (day: string) => {
    return dayOptions.find(option => option.value === day)?.label || day;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log('Form submitted!');
    console.log('Form data:', formData);
    console.log('Schedule entries:', scheduleEntries);

    try {
      const submitData = {
        class_name: formData.class_name,
        facility_id: formData.facility_id || null,
        status: formData.status,
        start_date: formData.start_date,
        data: {
          program_type: formData.program_type,
          unit: formData.unit,
          description: formData.description,
          schedule_entries: scheduleEntries
        }
      };

      console.log('Submitting data:', submitData);
      await onSubmit(submitData);
      console.log('Form submission completed successfully');
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          class_name: '',
          facility_id: '',
          status: 'active',
          start_date: '',
          program_type: '',
          unit: '',
          description: ''
        });
        setScheduleEntries([]);
        setShowUnitField(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 3-column grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
            <label htmlFor="class_name" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
              Tên lớp học *
            </label>
            <input
              type="text"
              id="class_name"
              name="class_name"
              value={formData.class_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên lớp học"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="facility_id" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
              Cơ sở
            </label>
            <select
              id="facility_id"
              name="facility_id"
              value={formData.facility_id}
              onChange={handleChange}
              disabled={isLoadingFacilities}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn cơ sở</option>
              {facilities.map((facility: any) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
              Ngày bắt đầu *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="program_type" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
              Chương trình
            </label>
            <select
              id="program_type"
              name="program_type"
              value={formData.program_type}
              onChange={handleChange}
              disabled={isLoadingPrograms}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingPrograms ? 'Đang tải...' : 'Chọn chương trình'}
              </option>
              {programTypes.map((program) => (
                <option key={program.value} value={program.value}>
                  {program.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit field - only show when GrapeSEED is selected */}
          {showUnitField && (
            <div className="flex items-center space-x-2">
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
                Chọn Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                disabled={isLoadingUnits}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingUnits ? 'Đang tải...' : 'Chọn unit'}
                </option>
                {unitOptions.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Description field - spans full width */}
        <div className="flex items-center space-x-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 whitespace-nowrap mb-1">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mô tả về lớp học"
          />
        </div>

        {/* Schedule Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Lịch học</h3>
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Thêm buổi học
            </button>
          </div>

          {/* Display current schedule entries */}
          {scheduleEntries.length > 0 && (
            <div className="space-y-2 mb-4">
              {scheduleEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm">
                    {getDayLabel(entry.day)} - {entry.startTime} đến {entry.endTime}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editScheduleEntry(entry)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteScheduleEntry(entry.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduleEntries.length === 0 && (
            <p className="text-gray-500 text-sm mb-4">Chưa có lịch học nào được thêm.</p>
          )}
        </div>

        {/* Form buttons */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {editingSchedule ? 'Chỉnh sửa buổi học' : 'Thêm buổi học mới'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="schedule_day" className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ trong tuần *
                  </label>
                  <select
                    id="schedule_day"
                    name="day"
                    value={scheduleForm.day}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn thứ</option>
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="schedule_start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    id="schedule_start_time"
                    name="startTime"
                    value={scheduleForm.startTime}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="schedule_end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    id="schedule_end_time"
                    name="endTime"
                    value={scheduleForm.endTime}
                    onChange={handleScheduleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={editingSchedule ? updateScheduleEntry : addScheduleEntry}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingSchedule ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingSchedule(null);
                    setScheduleForm({ day: '', startTime: '', endTime: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
  );
};

export default ClassForm;
