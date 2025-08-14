import React from 'react';
import { 
  POSITIONS, 
  DEPARTMENTS, 
  EMPLOYEE_STATUSES, 
  PROGRAM_TYPES, 
  CLASS_STATUSES, 
  CAMPUS_OPTIONS, 
  GRAPESEED_UNITS, 
  LESSON_NUMBERS, 
  SUBJECT_TYPES, 
  DAYS_OF_WEEK, 
  NATIONALITIES,
  OptionItem 
} from '../../../../lib/constants/businessOptions';

interface BusinessOptionSelectorProps {
  type: 'position' | 'department' | 'employee_status' | 'program_type' | 'class_status' | 
        'campus' | 'grapeseed_unit' | 'lesson_number' | 'subject_type' | 'day_of_week' | 'nationality';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  allowCustom?: boolean; // For nationality selector
  onCustomChange?: (value: string) => void;
}

const optionMap: Record<string, OptionItem[]> = {
  position: POSITIONS,
  department: DEPARTMENTS,
  employee_status: EMPLOYEE_STATUSES,
  program_type: PROGRAM_TYPES,
  class_status: CLASS_STATUSES,
  campus: CAMPUS_OPTIONS,
  grapeseed_unit: GRAPESEED_UNITS,
  lesson_number: LESSON_NUMBERS,
  subject_type: SUBJECT_TYPES,
  day_of_week: DAYS_OF_WEEK,
  nationality: NATIONALITIES,
};

const defaultPlaceholders: Record<string, string> = {
  position: 'Chọn chức vụ',
  department: 'Chọn phòng ban',
  employee_status: 'Chọn trạng thái',
  program_type: 'Chọn chương trình',
  class_status: 'Chọn trạng thái',
  campus: 'Chọn cơ sở',
  grapeseed_unit: 'Chọn unit',
  lesson_number: 'Chọn số bài học',
  subject_type: 'Chọn loại môn học',
  day_of_week: 'Chọn ngày',
  nationality: 'Chọn quốc tịch',
};

export default function BusinessOptionSelector({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  name,
  allowCustom = false,
  onCustomChange,
}: BusinessOptionSelectorProps) {
  const options = optionMap[type] || [];
  const defaultPlaceholder = placeholder || defaultPlaceholders[type] || 'Chọn tùy chọn';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (type === 'nationality' && selectedValue === 'other' && allowCustom) {
      // Handle custom nationality input
      onCustomChange?.('');
    }
    
    onChange(selectedValue);
  };

  const baseClassName = `w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <select
      name={name}
      value={value}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      className={baseClassName}
    >
      <option value="">{defaultPlaceholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Specialized components for common use cases
export function PositionSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="position" />;
}

export function DepartmentSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="department" />;
}

export function ProgramTypeSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="program_type" />;
}

export function CampusSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="campus" />;
}

export function GrapeSeedUnitSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="grapeseed_unit" />;
}

export function LessonNumberSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="lesson_number" />;
}

export function SubjectTypeSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="subject_type" />;
}

export function DayOfWeekSelector(props: Omit<BusinessOptionSelectorProps, 'type'>) {
  return <BusinessOptionSelector {...props} type="day_of_week" />;
}

interface NationalitySelectorProps extends Omit<BusinessOptionSelectorProps, 'type' | 'allowCustom'> {
  showCustomInput?: boolean;
  customValue?: string;
  onCustomChange?: (value: string) => void;
}

export function NationalitySelector({
  showCustomInput = false,
  customValue = '',
  onCustomChange,
  ...props
}: NationalitySelectorProps) {
  return (
    <div className="space-y-2">
      <BusinessOptionSelector 
        {...props} 
        type="nationality" 
        allowCustom={true}
        onCustomChange={onCustomChange}
      />
      {showCustomInput && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Nhập quốc tịch (ví dụ: Đan Mạch / Denmark)"
        />
      )}
    </div>
  );
}
