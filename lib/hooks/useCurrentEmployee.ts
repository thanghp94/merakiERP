// Phase 4: React hook to get current employee
// This implements the frontend integration from USER_EMPLOYEE_MAPPING_PLAN.md

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  status: string;
  data: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface UseCurrentEmployeeReturn {
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCurrentEmployee = (): UseCurrentEmployeeReturn => {
  const { user, getAuthHeaders } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentEmployee = async (): Promise<void> => {
    if (!user) {
      setEmployee(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the getAuthHeaders method from AuthContext
      const headers = getAuthHeaders();
      
      // Check if we have authorization header
      if (!headers.Authorization) {
        setError('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/employees/current', {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmployee(result.data);
        setError(null);
      } else {
        setEmployee(null);
        setError(result.message || 'Failed to fetch employee data');
        
        // Log additional details for debugging
        if (result.details) {
          console.warn('Employee not found details:', result.details);
        }
      }
    } catch (err) {
      console.error('Error fetching current employee:', err);
      setEmployee(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee when user changes
  useEffect(() => {
    fetchCurrentEmployee();
  }, [user]);

  return {
    employee,
    loading,
    error,
    refetch: fetchCurrentEmployee
  };
};

// Alternative hook that doesn't depend on auth context (for cases where you have the token)
export const useCurrentEmployeeWithToken = (token: string | null): UseCurrentEmployeeReturn => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentEmployee = async (): Promise<void> => {
    if (!token) {
      setEmployee(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/employees/current', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmployee(result.data);
        setError(null);
      } else {
        setEmployee(null);
        setError(result.message || 'Failed to fetch employee data');
      }
    } catch (err) {
      console.error('Error fetching current employee:', err);
      setEmployee(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentEmployee();
  }, [token]);

  return {
    employee,
    loading,
    error,
    refetch: fetchCurrentEmployee
  };
};
