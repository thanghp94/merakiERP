import { useState, useEffect } from 'react';
import { Employee } from '@/shared/types';
import { useFormWithValidation, createFormData } from '@/hooks/useFormWithValidation';
import { EmployeeFormData, employeeSchema, ModalState } from '../types/employees.types';

export const useEmployeesForm = (
  modalState: ModalState,
  onSubmit: (data: any, formType: string) => Promise<void>,
  onClose: () => void
) => {
  const [showCustomNationality, setShowCustomNationality] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Use single form validation hook for all modes
  const form = useFormWithValidation<EmployeeFormData>({
    schema: employeeSchema,
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
      position: '',
      department: '',
      hire_date: '',
      id_number: '',
      id_issue_date: '',
      id_expiry_date: '',
      avatar: '',
      experience: '',
      qualifications: '',
      date_of_birth: '',
      nationality: 'Việt Nam',
      customNationality: '',
      notes: '',
    },
    onSubmit: async (data) => {
      if (modalState.mode === 'view') return; // No submission in view mode

      const submitData = createFormData(data, [
        'email', 'phone', 'address', 'hire_date', 'id_number', 'id_issue_date', 'id_expiry_date', 'experience', 'qualifications', 'date_of_birth', 'nationality', 'notes'
      ]);

      // Handle avatar file upload
      if (avatarFile) {
        submitData.files = { avatar: avatarFile };
      }

      // Handle custom nationality
      if (data.nationality === 'other' && data.customNationality) {
        submitData.data.nationality = data.customNationality;
      }

      if (modalState.mode === 'edit' && modalState.employee) {
        // Add the ID for editing
        submitData.id = modalState.employee.id;
      }

      await onSubmit(submitData, 'Employee');
      onClose();
    },
    onSuccess: () => {
      form.resetForm();
      setShowCustomNationality(false);
      setAvatarFile(null);
    }
  });

  // Auto-populate form when modal opens in edit or view mode
  useEffect(() => {
    if (modalState.isOpen && (modalState.mode === 'edit' || modalState.mode === 'view') && modalState.employee) {
      const employee = modalState.employee;
      form.resetForm();
      form.setValue('full_name', employee.full_name);
      form.setValue('email', employee.data?.email || '');
      form.setValue('phone', employee.data?.phone || '');
      form.setValue('address', employee.data?.address || '');
      form.setValue('status', employee.status as 'active' | 'inactive' | 'terminated');
      form.setValue('position', employee.position || '');
      form.setValue('department', employee.department || '');
      form.setValue('hire_date', employee.data?.hire_date || '');
      form.setValue('id_number', employee.data?.id_number || '');
      form.setValue('id_issue_date', employee.data?.id_issue_date || '');
      form.setValue('id_expiry_date', employee.data?.id_expiry_date || '');
      form.setValue('avatar', employee.data?.avatar || '');
      form.setValue('experience', employee.data?.experience || '');
      form.setValue('qualifications', employee.data?.qualifications || '');
      form.setValue('date_of_birth', employee.data?.date_of_birth || '');
      form.setValue('nationality', employee.data?.nationality || '');
      form.setValue('notes', employee.data?.notes || '');

      // Set custom nationality visibility
      setShowCustomNationality(employee.data?.nationality === 'other');
    } else if (modalState.isOpen && modalState.mode === 'create') {
      form.resetForm();
      form.setValue('nationality', 'Việt Nam');
      setShowCustomNationality(false);
    }
  }, [modalState.isOpen, modalState.mode, modalState.employee]);

  const handleNationalityChange = (value: string) => {
    form.setValue('nationality', value);
    setShowCustomNationality(value === 'other');
  };

  return {
    form,
    showCustomNationality,
    avatarFile,
    setAvatarFile,
    handleNationalityChange
  };
};
