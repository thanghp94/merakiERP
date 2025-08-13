import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase';

const enrollmentSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 chữ số').optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  expected_campus: z.enum(['CS1', 'CS2', 'CS3', 'CS4']).optional(),
  program: z.enum(['GrapeSEED', 'Tiếng Anh Tiểu Học', 'Pre-WSC', 'WSC', 'Gavel club']).optional(),
  student_description: z.string().optional(),
  current_english_level: z.string().optional(),
  parent_name: z.string().min(2, 'Tên phụ huynh phải có ít nhất 2 ký tự'),
  parent_phone: z.string().min(10, 'Số điện thoại phụ huynh phải có ít nhất 10 chữ số'),
  parent_email: z.string().email('Email phụ huynh không hợp lệ').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface StudentEnrollmentFormProps {
  onSuccess?: () => void;
  language?: 'vi' | 'en';
}

export default function StudentEnrollmentForm({ onSuccess, language = 'vi' }: StudentEnrollmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    vi: {
      title: 'Đăng Ký Học Viên',
      studentInfo: 'Thông Tin Học Viên',
      fullName: 'Họ Tên *',
      email: 'Email (nếu có)',
      phone: 'Số Điện Thoại (nếu có)',
      dateOfBirth: 'Ngày Sinh',
      address: 'Địa Chỉ',
      expectedCampus: 'Cơ sở dự kiến',
      program: 'Chương trình học',
      studentDescription: 'Miêu tả về học sinh',
      currentEnglishLevel: 'Trình độ tiếng Anh hiện tại',
      parentInfo: 'Thông Tin Phụ Huynh *',
      parentName: 'Tên Phụ Huynh *',
      parentPhone: 'Số Điện Thoại Phụ Huynh *',
      parentEmail: 'Email Phụ Huynh (nếu có)',
      notes: 'Ghi Chú',
      submit: 'Đăng Ký Học Viên',
      submitting: 'Đang đăng ký...',
      success: 'Đăng ký học viên thành công!',
      error: 'Có lỗi xảy ra',
      placeholders: {
        fullName: 'Nhập họ tên học viên',
        email: 'Nhập email học viên',
        phone: 'Nhập số điện thoại học viên',
        address: 'Nhập địa chỉ',
        studentDescription: 'Miêu tả về học sinh',
        currentEnglishLevel: 'Nhập trình độ tiếng Anh hiện tại',
        parentName: 'Nhập tên phụ huynh',
        parentPhone: 'Nhập số điện thoại phụ huynh',
        parentEmail: 'Nhập email phụ huynh',
        notes: 'Ghi chú thêm về học viên'
      }
    },
    en: {
      title: 'Student Enrollment Form',
      studentInfo: 'Student Information',
      fullName: 'Full Name *',
      email: 'Email (if any)',
      phone: 'Phone (if any)',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
      expectedCampus: 'Expected Campus',
      program: 'Program',
      studentDescription: 'Student Description',
      currentEnglishLevel: 'Current English Level',
      parentInfo: 'Parent Information *',
      parentName: 'Parent Name *',
      parentPhone: 'Parent Phone *',
      parentEmail: 'Parent Email (if any)',
      notes: 'Notes',
      submit: 'Enroll Student',
      submitting: 'Enrolling...',
      success: 'Student enrolled successfully!',
      error: 'An error occurred',
      placeholders: {
        fullName: 'Enter student full name',
        email: 'Enter student email',
        phone: 'Enter student phone',
        address: 'Enter address',
        studentDescription: 'Describe the student',
        currentEnglishLevel: 'Enter current English level',
        parentName: 'Enter parent name',
        parentPhone: 'Enter parent phone',
        parentEmail: 'Enter parent email',
        notes: 'Additional notes about student'
      }
    }
  };

  const currentLabels = labels[language];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
  });

  // Watch student email and phone fields
  const studentEmail = watch('email');
  const studentPhone = watch('phone');

  // Function to copy student info to parent fields
  const copyStudentInfoToParent = () => {
    if (studentPhone) {
      setValue('parent_phone', studentPhone);
    }
    if (studentEmail) {
      setValue('parent_email', studentEmail);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: student, error } = await supabase
        .from('students')
        .insert({
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone || null,
          status: 'active',
            data: {
              date_of_birth: data.date_of_birth,
              address: data.address,
              expected_campus: data.expected_campus,
              program: data.program,
              student_description: data.student_description,
              current_english_level: data.current_english_level,
              parent: {
                name: data.parent_name,
                phone: data.parent_phone,
                email: data.parent_email || null,
              },
              notes: data.notes,
            },
        })
        .select()
        .single();

      if (error) throw error;

      reset();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : currentLabels.error);
    } finally {
      setLoading(false);
    }
  };


  const campusOptions = {
    vi: [
      { value: '', label: 'Chọn cơ sở dự kiến' },
      { value: 'CS1', label: 'CS1' },
      { value: 'CS2', label: 'CS2' },
      { value: 'CS3', label: 'CS3' },
      { value: 'CS4', label: 'CS4' }
    ],
    en: [
      { value: '', label: 'Select expected campus' },
      { value: 'CS1', label: 'CS1' },
      { value: 'CS2', label: 'CS2' },
      { value: 'CS3', label: 'CS3' },
      { value: 'CS4', label: 'CS4' }
    ]
  };

  const programOptions = {
    vi: [
      { value: '', label: 'Chọn chương trình học' },
      { value: 'GrapeSEED', label: 'GrapeSEED' },
      { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
      { value: 'Pre-WSC', label: 'Pre-WSC' },
      { value: 'WSC', label: 'WSC' },
      { value: 'Gavel club', label: 'Gavel club' }
    ],
    en: [
      { value: '', label: 'Select program' },
      { value: 'GrapeSEED', label: 'GrapeSEED' },
      { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
      { value: 'Pre-WSC', label: 'Pre-WSC' },
      { value: 'WSC', label: 'WSC' },
      { value: 'Gavel club', label: 'Gavel club' }
    ]
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{currentLabels.title}</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Information Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">{currentLabels.studentInfo}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{currentLabels.fullName}</label>
              <input
                {...register('full_name')}
                type="text"
                className="form-input"
                placeholder={currentLabels.placeholders.fullName}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">{currentLabels.email}</label>
              <input
                {...register('email')}
                type="email"
                className="form-input"
                placeholder={currentLabels.placeholders.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">{currentLabels.phone}</label>
              <input
                {...register('phone')}
                type="tel"
                className="form-input"
                placeholder={currentLabels.placeholders.phone}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">{currentLabels.dateOfBirth}</label>
              <input
                {...register('date_of_birth')}
                type="date"
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">{currentLabels.address}</label>
              <input
                {...register('address')}
                type="text"
                className="form-input"
                placeholder={currentLabels.placeholders.address}
              />
            </div>
          </div>
        </div>

        {/* Parent Information Section */}
        <div className="border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{currentLabels.parentInfo}</h3>
            <button
              type="button"
              onClick={copyStudentInfoToParent}
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              {language === 'vi' ? 'Sao chép từ thông tin học viên' : 'Copy from student info'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">{currentLabels.parentName}</label>
              <input
                {...register('parent_name')}
                type="text"
                className="form-input"
                placeholder={currentLabels.placeholders.parentName}
              />
              {errors.parent_name && (
                <p className="mt-1 text-sm text-red-600">{errors.parent_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">{currentLabels.parentPhone}</label>
              <input
                {...register('parent_phone')}
                type="tel"
                className="form-input"
                placeholder={currentLabels.placeholders.parentPhone}
              />
              {errors.parent_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.parent_phone.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">{currentLabels.parentEmail}</label>
              <input
                {...register('parent_email')}
                type="email"
                className="form-input"
                placeholder={currentLabels.placeholders.parentEmail}
              />
              {errors.parent_email && (
                <p className="mt-1 text-sm text-red-600">{errors.parent_email.message}</p>
              )}
            </div>
          </div>
        </div>


        {/* Additional Information */}
        <div>
          <div className="space-y-4">
        <div>
          <label className="form-label">{currentLabels.expectedCampus || 'Cơ sở dự kiến'}</label>
          <select {...register('expected_campus')} className="form-input">
            {campusOptions[language].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">{currentLabels.program || 'Chương trình học'}</label>
          <select {...register('program')} className="form-input">
            {programOptions[language].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">{currentLabels.studentDescription || 'Miêu tả về học sinh'}</label>
          <textarea
            {...register('student_description')}
            rows={3}
            className="form-input"
            placeholder={currentLabels.placeholders.studentDescription || ''}
          />
        </div>

        <div>
          <label className="form-label">{currentLabels.currentEnglishLevel || 'Trình độ tiếng Anh hiện tại'}</label>
          <input
            {...register('current_english_level')}
            type="text"
            className="form-input"
            placeholder={currentLabels.placeholders.currentEnglishLevel || ''}
          />
        </div>


        <div>
          <label className="form-label">{currentLabels.notes}</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="form-input"
            placeholder={currentLabels.placeholders.notes}
          />
        </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? currentLabels.submitting : currentLabels.submit}
        </button>
      </form>
    </div>
  );
}
