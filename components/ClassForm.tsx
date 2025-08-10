import React, { useState, useEffect } from 'react';

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
    duration: initialData.data?.duration || '',
    schedule: initialData.data?.schedule || '',
    max_students: initialData.data?.max_students || '',
    description: initialData.data?.description || ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        class_name: formData.class_name,
        facility_id: formData.facility_id || null,
        status: formData.status,
        start_date: formData.start_date,
        data: {
          program_type: formData.program_type,
          unit: formData.unit,
          duration: formData.duration,
          schedule: formData.schedule,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
          description: formData.description
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          class_name: '',
          facility_id: '',
          status: 'active',
          start_date: '',
          program_type: '',
          unit: '',
          duration: '',
          schedule: '',
          max_students: '',
          description: ''
        });
        setShowUnitField(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="class_name" className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="facility_id" className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label htmlFor="program_type" className="block text-sm font-medium text-gray-700 mb-1">
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
        </div>

        {/* Unit field - only show when GrapeSEED is selected */}
        {showUnitField && (
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Thời lượng khóa học
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="VD: 3 tháng, 12 tuần"
            />
          </div>

          <div>
            <label htmlFor="max_students" className="block text-sm font-medium text-gray-700 mb-1">
              Số học sinh tối đa
            </label>
            <input
              type="number"
              id="max_students"
              name="max_students"
              value={formData.max_students}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Số lượng học sinh"
            />
          </div>
        </div>

        <div>
          <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
            Lịch học
          </label>
          <input
            type="text"
            id="schedule"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="VD: Thứ 2, 4, 6 - 19:00-21:00"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mô tả về lớp học"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  class_name: '',
                  facility_id: '',
                  status: 'active',
                  start_date: '',
                  program_type: '',
                  unit: '',
                  duration: '',
                  schedule: '',
                  max_students: '',
                  description: ''
                });
                setShowUnitField(false);
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

export default ClassForm;
