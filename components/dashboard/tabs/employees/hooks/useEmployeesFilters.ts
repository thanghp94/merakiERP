import { useState, useMemo } from 'react';
import { Employee } from '@/shared/types';
import { EmployeeFilters, EMPLOYEE_STATUSES } from '../types/employees.types';

export const useEmployeesFilters = (employees: Employee[]) => {
  // Filter state
  const [filters, setFilters] = useState<EmployeeFilters>({
    status: 'all',
    position: 'all',
    department: 'all'
  });

  // Filter employees based on selected filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesStatus = filters.status === 'all' || employee.status === filters.status;
      const matchesPosition = filters.position === 'all' || employee.position === filters.position;
      const matchesDepartment = filters.department === 'all' || employee.department === filters.department;

      return matchesStatus && matchesPosition && matchesDepartment;
    });
  }, [employees, filters]);

  // Extract unique values for filter options
  const getFilterOptions = () => {
    const statuses = Array.from(new Set(employees.map(employee => employee.status).filter(Boolean)));
    const positions = Array.from(new Set(employees.map(employee => employee.position).filter(Boolean)));
    const departments = Array.from(new Set(employees.map(employee => employee.department).filter(Boolean)));

    return {
      statuses,
      positions,
      departments
    };
  };

  const filterOptions = getFilterOptions();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      position: 'all',
      department: 'all'
    });
  };

  return {
    filters,
    filteredEmployees,
    filterOptions,
    handleFilterChange,
    handleClearFilters
  };
};
