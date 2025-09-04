import { useState, useEffect } from 'react';

export const useForeignTeachersData = () => {
  const [positionOptions, setPositionOptions] = useState<Array<{value: string, label: string}>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{value: string, label: string}>>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(false);

  useEffect(() => {
    fetchEnumValues();
  }, []);

  const fetchEnumValues = async () => {
    setIsLoadingEnums(true);
    try {
      const [positionResponse, departmentResponse] = await Promise.all([
        fetch('/api/metadata/enums?type=position'),
        fetch('/api/metadata/enums?type=department')
      ]);

      const [positionResult, departmentResult] = await Promise.all([
        positionResponse.json(),
        departmentResponse.json()
      ]);

      if (positionResult.success && positionResult.data) {
        setPositionOptions(positionResult.data);
      } else {
        // Fallback to hardcoded values
        setPositionOptions([
          { value: 'teacher', label: 'Giáo viên' },
          { value: 'teaching_assistant', label: 'Trợ giảng' },
          { value: 'manager', label: 'Quản lý' },
          { value: 'admin', label: 'Quản trị viên' },
          { value: 'other', label: 'Khác' }
        ]);
      }

      if (departmentResult.success && departmentResult.data) {
        setDepartmentOptions(departmentResult.data);
      } else {
        // Fallback to hardcoded values
        setDepartmentOptions([
          { value: 'teaching', label: 'Giảng dạy' },
          { value: 'administration', label: 'Hành chính' },
          { value: 'finance', label: 'Tài chính' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'hr', label: 'Nhân sự' },
          { value: 'it', label: 'Công nghệ thông tin' },
          { value: 'other', label: 'Khác' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching enum values:', error);
      // Fallback to hardcoded values
      setPositionOptions([
        { value: 'teacher', label: 'Giáo viên' },
        { value: 'teaching_assistant', label: 'Trợ giảng' },
        { value: 'manager', label: 'Quản lý' },
        { value: 'admin', label: 'Quản trị viên' },
        { value: 'other', label: 'Khác' }
      ]);
      setDepartmentOptions([
        { value: 'teaching', label: 'Giảng dạy' },
        { value: 'administration', label: 'Hành chính' },
        { value: 'finance', label: 'Tài chính' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'hr', label: 'Nhân sự' },
        { value: 'it', label: 'Công nghệ thông tin' },
        { value: 'other', label: 'Khác' }
      ]);
    } finally {
      setIsLoadingEnums(false);
    }
  };

  return {
    positionOptions,
    departmentOptions,
    isLoadingEnums
  };
};
