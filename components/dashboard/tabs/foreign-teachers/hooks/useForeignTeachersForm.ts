import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useFormWithValidation, commonSchemas } from '@/hooks/useFormWithValidation';
import { ModalState } from '../types/foreign-teachers.types';

// Form validation schema
const foreignTeacherSchema = z.object({
  full_name: commonSchemas.requiredString('Họ tên'),
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  address: commonSchemas.optionalString,
  status: z.enum(['active', 'inactive', 'terminated']),
  position: commonSchemas.requiredString('Chức vụ'),
  department: commonSchemas.requiredString('Phòng ban'),
  hire_date: commonSchemas.date,
  id_number: commonSchemas.optionalString,
  id_issue_date: commonSchemas.date,
  id_expiry_date: commonSchemas.date,
  avatar: commonSchemas.optionalString,
  experience: commonSchemas.optionalString,
  qualifications: commonSchemas.optionalString,
  date_of_birth: commonSchemas.date,
  nationality: commonSchemas.requiredString('Quốc tịch'),
  customNationality: commonSchemas.optionalString,
  notes: commonSchemas.optionalString,
});

type ForeignTeacherFormData = z.infer<typeof foreignTeacherSchema>;

export const useForeignTeachersForm = (
  modalState: ModalState,
  onSubmit: (data: any, formType: string) => void,
  onClose: () => void
) => {
  const [showCustomNationality, setShowCustomNationality] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Use the form validation hook
  const form = useFormWithValidation<ForeignTeacherFormData>({
    schema: foreignTeacherSchema,
    defaultValues: {
      full_name: modalState.employee?.full_name || '',
      email: modalState.employee?.data?.email || '',
      phone: modalState.employee?.data?.phone || '',
      address: modalState.employee?.data?.address || '',
      status: (modalState.employee?.status as 'active' | 'inactive' | 'terminated') || 'active',
      position: modalState.employee?.position || '',
      department: modalState.employee?.department || '',
      hire_date: modalState.employee?.data?.hire_date || '',
      id_number: modalState.employee?.data?.id_number || '',
      id_issue_date: modalState.employee?.data?.id_issue_date || '',
      id_expiry_date: modalState.employee?.data?.id_expiry_date || '',
      avatar: modalState.employee?.data?.avatar || '',
      experience: modalState.employee?.data?.experience || '',
      qualifications: modalState.employee?.data?.qualifications || '',
      date_of_birth: modalState.employee?.data?.date_of_birth || '',
      nationality: modalState.employee?.data?.nationality || '',
      customNationality: '',
      notes: modalState.employee?.data?.notes || '',
    },
    onSubmit: async (data) => {
      const submitData = {
        full_name: data.full_name,
        position: data.position,
        department: data.department,
        status: data.status,
        data: {
          email: data.email,
          phone: data.phone,
          address: data.address,
          hire_date: data.hire_date,
          id_number: data.id_number,
          id_issue_date: data.id_issue_date,
          id_expiry_date: data.id_expiry_date,
          experience: data.experience,
          qualifications: data.qualifications,
          date_of_birth: data.date_of_birth,
          nationality: data.nationality === 'other' ? data.customNationality : data.nationality,
          notes: data.notes
        }
      };

      // Add the ID for editing
      if (modalState.mode === 'edit' && modalState.employee?.id) {
        (submitData as any).id = modalState.employee.id;
      }

      await onSubmit(submitData, modalState.mode === 'create' ? 'CreateForeignTeacher' : 'UpdateForeignTeacher');
    },
    onSuccess: () => {
      if (modalState.mode === 'create') {
        form.resetForm();
        setShowCustomNationality(false);
        setAvatarFile(null);
      }
      onClose();
    }
  });

  // Handle nationality change
  const handleNationalityChange = (value: string) => {
    form.setValue('nationality', value);
    setShowCustomNationality(value === 'other');
  };

  // Update form when modal state changes
  useEffect(() => {
    if (modalState.employee) {
      form.resetForm();
      form.setValue('full_name', modalState.employee.full_name || '');
      form.setValue('email', modalState.employee.data?.email || '');
      form.setValue('phone', modalState.employee.data?.phone || '');
      form.setValue('address', modalState.employee.data?.address || '');
      form.setValue('status', (modalState.employee.status as 'active' | 'inactive' | 'terminated') || 'active');
      form.setValue('position', modalState.employee.position || '');
      form.setValue('department', modalState.employee.department || '');
      form.setValue('hire_date', modalState.employee.data?.hire_date || '');
      form.setValue('id_number', modalState.employee.data?.id_number || '');
      form.setValue('id_issue_date', modalState.employee.data?.id_issue_date || '');
      form.setValue('id_expiry_date', modalState.employee.data?.id_expiry_date || '');
      form.setValue('experience', modalState.employee.data?.experience || '');
      form.setValue('qualifications', modalState.employee.data?.qualifications || '');
      form.setValue('date_of_birth', modalState.employee.data?.date_of_birth || '');
      form.setValue('nationality', modalState.employee.data?.nationality || '');
      form.setValue('notes', modalState.employee.data?.notes || '');

      // Check if nationality is custom
      const nationality = modalState.employee.data?.nationality || '';
      const isCustom = !['american', 'british', 'australian', 'canadian', 'french', 'german', 'japanese', 'korean', 'chinese'].includes(nationality);
      setShowCustomNationality(isCustom);
      if (isCustom) {
        form.setValue('customNationality', nationality);
      }
    }
  }, [modalState.employee]);

  return {
    form,
    showCustomNationality,
    avatarFile,
    setAvatarFile,
    handleNationalityChange
  };
};
