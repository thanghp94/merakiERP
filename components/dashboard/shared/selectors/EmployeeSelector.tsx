import React from 'react';
import { useEmployees, useTeachers, useTeachingAssistants } from '../../../../lib/hooks/useApiData';

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'all' | 'teachers' | 'assistants';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export default function EmployeeSelector({
  value,
  onChange,
  type = 'all',
  placeholder = 'Chọn nhân viên',
  required = false,
  disabled = false,
  className = '',
  name,
}: EmployeeSelectorProps) {
  // Use appropriate hook based on type
  const { data: allEmployees, isLoading: loadingAll } = useEmployees();
  const { data: teachers, isLoading: loadingTeachers } = useTeachers();
  const { data: assistants, isLoading: loadingAssistants } = useTeachingAssistants();

  // Select appropriate data and loading state
  let employees, isLoading;
  switch (type) {
    case 'teachers':
      employees = teachers;
      isLoading = loadingTeachers;
      break;
    case 'assistants':
      employees = assistants;
      isLoading = loadingAssistants;
      break;
    default:
      employees = allEmployees;
      isLoading = loadingAll;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const baseClassName = `w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <select
      name={name}
      value={value}
      onChange={handleChange}
      required={required}
      disabled={disabled || isLoading}
      className={baseClassName}
    >
      <option value="">
        {isLoading ? 'Đang tải...' : placeholder}
      </option>
      {employees.map((employee: any) => (
        <option key={employee.id} value={employee.id}>
          {employee.full_name} {employee.position && `(${employee.position})`}
        </option>
      ))}
    </select>
  );
}

// Specialized components for common use cases
export function TeacherSelector(props: Omit<EmployeeSelectorProps, 'type'>) {
  return (
    <EmployeeSelector
      {...props}
      type="teachers"
      placeholder={props.placeholder || 'Chọn giáo viên'}
    />
  );
}

export function TeachingAssistantSelector(props: Omit<EmployeeSelectorProps, 'type'>) {
  return (
    <EmployeeSelector
      {...props}
      type="assistants"
      placeholder={props.placeholder || 'Chọn trợ giảng'}
    />
  );
}
