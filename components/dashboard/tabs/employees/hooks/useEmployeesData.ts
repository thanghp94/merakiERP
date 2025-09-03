import { useState, useEffect } from 'react';
import { Employee } from '@/shared/types';
import { EnumOption, POSITIONS, DEPARTMENTS } from '../types/employees.types';

export const useEmployeesData = () => {
  // State for enum values
  const [positionOptions, setPositionOptions] = useState<EnumOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<EnumOption[]>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);

  // Load enum values on component mount
  useEffect(() => {
    loadEnumValues();
  }, []);

  const loadEnumValues = async () => {
    try {
      setIsLoadingEnums(true);

      // Fetch position enum values
      const [positionResponse, departmentResponse] = await Promise.all([
        fetch('/api/metadata/enums?type=position'),
        fetch('/api/metadata/enums?type=department')
      ]);

      const [positionData, departmentData] = await Promise.all([
        positionResponse.json(),
        departmentResponse.json()
      ]);

      // Set position options
      if (positionData.success && positionData.data) {
        setPositionOptions(positionData.data);
      } else {
        // Fallback to hardcoded values
        setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      }

      // Set department options
      if (departmentData.success && departmentData.data) {
        setDepartmentOptions(departmentData.data);
      } else {
        // Fallback to hardcoded values
        setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
      }

    } catch (error) {
      console.error('Error loading enum values:', error);
      // Fallback to hardcoded values
      setPositionOptions(Object.entries(POSITIONS).map(([value, label]) => ({ value, label })));
      setDepartmentOptions(Object.entries(DEPARTMENTS).map(([value, label]) => ({ value, label })));
    } finally {
      setIsLoadingEnums(false);
    }
  };

  return {
    positionOptions,
    departmentOptions,
    isLoadingEnums,
    loadEnumValues
  };
};
