import { useState, useEffect, useCallback } from 'react';

export interface UseApiDataOptions<T> {
  endpoint: string;
  fallbackData?: T[];
  transform?: (data: any) => T[];
  dependencies?: any[];
  autoFetch?: boolean;
}

export interface ApiDataState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiData<T = any>({
  endpoint,
  fallbackData = [],
  transform,
  dependencies = [],
  autoFetch = true,
}: UseApiDataOptions<T>): ApiDataState<T> {
  const [data, setData] = useState<T[]>(fallbackData);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success) {
        const processedData = transform ? transform(result.data) : result.data;
        setData(processedData);
      } else {
        console.error(`Failed to fetch ${endpoint}:`, result.message);
        setData(fallbackData);
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setData(fallbackData);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, transform, fallbackData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch, ...dependencies]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Specialized hooks for common API endpoints
export function useEmployees(filterBy?: { position?: string; department?: string }) {
  return useApiData({
    endpoint: '/api/employees',
    transform: (data) => {
      if (!filterBy) return data;
      
      return data.filter((emp: any) => {
        if (filterBy.position) {
          const position = emp.position?.toLowerCase() || '';
          const targetPosition = filterBy.position.toLowerCase();
          if (!position.includes(targetPosition)) return false;
        }
        
        if (filterBy.department) {
          const department = emp.department?.toLowerCase() || '';
          const targetDepartment = filterBy.department.toLowerCase();
          if (!department.includes(targetDepartment)) return false;
        }
        
        return true;
      });
    },
    dependencies: [filterBy?.position, filterBy?.department],
  });
}

export function useTeachers() {
  return useEmployees({ 
    position: 'giáo viên' 
  });
}

export function useTeachingAssistants() {
  return useEmployees({ 
    position: 'trợ giảng' 
  });
}

export function useFacilities() {
  return useApiData({
    endpoint: '/api/facilities',
  });
}

export function useClasses() {
  return useApiData({
    endpoint: '/api/classes',
  });
}

export function useRooms() {
  return useApiData({
    endpoint: '/api/facilities',
    transform: (facilities) => {
      const rooms: Array<{ id: string; name: string }> = [];
      
      facilities.forEach((facility: any) => {
        // Check if facility has rooms in JSONB data
        if (facility.data?.rooms && Array.isArray(facility.data.rooms)) {
          facility.data.rooms.forEach((room: any) => {
            rooms.push({
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
          rooms.push({
            id: facility.id,
            name: facility.name
          });
        }
      });
      
      return rooms;
    },
  });
}

export function useEnumData(type: string, fallback: Array<{value: string, label: string}> = []) {
  return useApiData({
    endpoint: `/api/metadata/enums?type=${type}`,
    fallbackData: fallback,
  });
}

// Specialized hooks for business options
export function usePositions() {
  return useEnumData('position', [
    { value: 'Giáo viên', label: 'Giáo viên' },
    { value: 'Trợ giảng', label: 'Trợ giảng' },
    { value: 'Tổ trưởng', label: 'Tổ trưởng' },
    { value: 'Nhân viên', label: 'Nhân viên' },
    { value: 'Thực tập sinh', label: 'Thực tập sinh' },
    { value: 'Quản lý', label: 'Quản lý' },
    { value: 'Phó giám đốc', label: 'Phó giám đốc' },
    { value: 'Giám đốc', label: 'Giám đốc' }
  ]);
}

export function useDepartments() {
  return useEnumData('department', [
    { value: 'Hành chính nhân sự', label: 'Hành chính nhân sự' },
    { value: 'Vận hành', label: 'Vận hành' },
    { value: 'Chăm sóc khách hàng', label: 'Chăm sóc khách hàng' },
    { value: 'Tài chính', label: 'Tài chính' },
    { value: 'Ban giám đốc', label: 'Ban giám đốc' }
  ]);
}
