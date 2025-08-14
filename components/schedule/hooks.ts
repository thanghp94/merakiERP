import { useState, useEffect, useCallback } from 'react';
import { Session, Employee } from './types';
import { getDateRange, filterEmployeesByPosition } from './utils';

export const useScheduleData = (currentDate: Date, viewMode: 'day' | 'week', classId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { startDate, endDate } = getDateRange(currentDate, viewMode);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/sessions?start_date=${startDate}&end_date=${endDate}`;
      if (classId) {
        url += `&class_id=${classId}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, classId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.success) {
        fetchSessions(); // Refresh sessions
        return true;
      } else {
        alert(`Error updating session: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Error updating session');
      return false;
    }
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    startDate,
    endDate,
    updateSession,
    refetchSessions: fetchSessions
  };
};

export const useEmployeeData = () => {
  const [teachers, setTeachers] = useState<Employee[]>([]);
  const [teachingAssistants, setTeachingAssistants] = useState<Employee[]>([]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      
      if (result.success) {
        const teachersList = filterEmployeesByPosition(result.data, ['giáo viên', 'teacher', 'gv']);
        const assistantsList = filterEmployeesByPosition(result.data, ['trợ giảng', 'assistant', 'ta']);
        
        setTeachers(teachersList);
        setTeachingAssistants(assistantsList);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    teachers,
    teachingAssistants,
    refetchEmployees: fetchEmployees
  };
};
