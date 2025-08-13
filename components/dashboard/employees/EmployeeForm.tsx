import React, { useState, useEffect } from 'react';

interface EmployeeFormProps {
  onSubmit: (employeeData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  onSubmit, 
  initialData = {}, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    full_name: initialData.full_name || '',
    position: initialData.position || '',
    department: initialData.department || '',
    status: initialData.status || 'active',
    email: initialData.data?.email || '',
    phone: initialData.data?.phone || '',
    address: initialData.data?.address || '',
    date_of_birth: initialData.data?.date_of_birth || '',
    hire_date: initialData.data?.hire_date || '',
    salary: initialData.data?.salary || '',
    qualifications: initialData.data?.qualifications || '',
    nationality: initialData.data?.nationality || '',
    customNationality: '',
    notes: initialData.data?.notes || ''
  });

  const [positions, setPositions] = useState<Array<{value: string, label: string}>>([]);
  const [departments, setDepartments] = useState<Array<{value: string, label: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [showCustomNationality, setShowCustomNationality] = useState(false);

  // Comprehensive nationalities list in Vietnamese/English format
  const nationalities = [
    // Asia
    { value: 'Việt Nam / Vietnam', label: 'Việt Nam / Vietnam' },
    { value: 'Trung Quốc / China', label: 'Trung Quốc / China' },
    { value: 'Nhật Bản / Japan', label: 'Nhật Bản / Japan' },
    { value: 'Hàn Quốc / South Korea', label: 'Hàn Quốc / South Korea' },
    { value: 'Triều Tiên / North Korea', label: 'Triều Tiên / North Korea' },
    { value: 'Thái Lan / Thailand', label: 'Thái Lan / Thailand' },
    { value: 'Singapore / Singapore', label: 'Singapore / Singapore' },
    { value: 'Malaysia / Malaysia', label: 'Malaysia / Malaysia' },
    { value: 'Indonesia / Indonesia', label: 'Indonesia / Indonesia' },
    { value: 'Philippines / Philippines', label: 'Philippines / Philippines' },
    { value: 'Brunei / Brunei', label: 'Brunei / Brunei' },
    { value: 'Myanmar / Myanmar', label: 'Myanmar / Myanmar' },
    { value: 'Lào / Laos', label: 'Lào / Laos' },
    { value: 'Campuchia / Cambodia', label: 'Campuchia / Cambodia' },
    { value: 'Ấn Độ / India', label: 'Ấn Độ / India' },
    { value: 'Pakistan / Pakistan', label: 'Pakistan / Pakistan' },
    { value: 'Bangladesh / Bangladesh', label: 'Bangladesh / Bangladesh' },
    { value: 'Sri Lanka / Sri Lanka', label: 'Sri Lanka / Sri Lanka' },
    { value: 'Nepal / Nepal', label: 'Nepal / Nepal' },
    { value: 'Bhutan / Bhutan', label: 'Bhutan / Bhutan' },
    { value: 'Maldives / Maldives', label: 'Maldives / Maldives' },
    { value: 'Afghanistan / Afghanistan', label: 'Afghanistan / Afghanistan' },
    { value: 'Iran / Iran', label: 'Iran / Iran' },
    { value: 'Iraq / Iraq', label: 'Iraq / Iraq' },
    { value: 'Syria / Syria', label: 'Syria / Syria' },
    { value: 'Lebanon / Lebanon', label: 'Lebanon / Lebanon' },
    { value: 'Jordan / Jordan', label: 'Jordan / Jordan' },
    { value: 'Israel / Israel', label: 'Israel / Israel' },
    { value: 'Palestine / Palestine', label: 'Palestine / Palestine' },
    { value: 'Saudi Arabia / Saudi Arabia', label: 'Saudi Arabia / Saudi Arabia' },
    { value: 'UAE / United Arab Emirates', label: 'UAE / United Arab Emirates' },
    { value: 'Qatar / Qatar', label: 'Qatar / Qatar' },
    { value: 'Kuwait / Kuwait', label: 'Kuwait / Kuwait' },
    { value: 'Bahrain / Bahrain', label: 'Bahrain / Bahrain' },
    { value: 'Oman / Oman', label: 'Oman / Oman' },
    { value: 'Yemen / Yemen', label: 'Yemen / Yemen' },
    { value: 'Thổ Nhĩ Kỳ / Turkey', label: 'Thổ Nhĩ Kỳ / Turkey' },
    { value: 'Cyprus / Cyprus', label: 'Cyprus / Cyprus' },
    { value: 'Georgia / Georgia', label: 'Georgia / Georgia' },
    { value: 'Armenia / Armenia', label: 'Armenia / Armenia' },
    { value: 'Azerbaijan / Azerbaijan', label: 'Azerbaijan / Azerbaijan' },
    { value: 'Kazakhstan / Kazakhstan', label: 'Kazakhstan / Kazakhstan' },
    { value: 'Uzbekistan / Uzbekistan', label: 'Uzbekistan / Uzbekistan' },
    { value: 'Turkmenistan / Turkmenistan', label: 'Turkmenistan / Turkmenistan' },
    { value: 'Kyrgyzstan / Kyrgyzstan', label: 'Kyrgyzstan / Kyrgyzstan' },
    { value: 'Tajikistan / Tajikistan', label: 'Tajikistan / Tajikistan' },
    { value: 'Mongolia / Mongolia', label: 'Mongolia / Mongolia' },

    // Europe
    { value: 'Anh / United Kingdom', label: 'Anh / United Kingdom' },
    { value: 'Ireland / Ireland', label: 'Ireland / Ireland' },
    { value: 'Pháp / France', label: 'Pháp / France' },
    { value: 'Đức / Germany', label: 'Đức / Germany' },
    { value: 'Ý / Italy', label: 'Ý / Italy' },
    { value: 'Tây Ban Nha / Spain', label: 'Tây Ban Nha / Spain' },
    { value: 'Bồ Đào Nha / Portugal', label: 'Bồ Đào Nha / Portugal' },
    { value: 'Hà Lan / Netherlands', label: 'Hà Lan / Netherlands' },
    { value: 'Bỉ / Belgium', label: 'Bỉ / Belgium' },
    { value: 'Luxembourg / Luxembourg', label: 'Luxembourg / Luxembourg' },
    { value: 'Thụy Sĩ / Switzerland', label: 'Thụy Sĩ / Switzerland' },
    { value: 'Áo / Austria', label: 'Áo / Austria' },
    { value: 'Thụy Điển / Sweden', label: 'Thụy Điển / Sweden' },
    { value: 'Na Uy / Norway', label: 'Na Uy / Norway' },
    { value: 'Đan Mạch / Denmark', label: 'Đan Mạch / Denmark' },
    { value: 'Phần Lan / Finland', label: 'Phần Lan / Finland' },
    { value: 'Iceland / Iceland', label: 'Iceland / Iceland' },
    { value: 'Nga / Russia', label: 'Nga / Russia' },
    { value: 'Ukraine / Ukraine', label: 'Ukraine / Ukraine' },
    { value: 'Belarus / Belarus', label: 'Belarus / Belarus' },
    { value: 'Moldova / Moldova', label: 'Moldova / Moldova' },
    { value: 'Romania / Romania', label: 'Romania / Romania' },
    { value: 'Bulgaria / Bulgaria', label: 'Bulgaria / Bulgaria' },
    { value: 'Hungary / Hungary', label: 'Hungary / Hungary' },
    { value: 'Czech Republic / Czech Republic', label: 'Czech Republic / Czech Republic' },
    { value: 'Slovakia / Slovakia', label: 'Slovakia / Slovakia' },
    { value: 'Poland / Poland', label: 'Poland / Poland' },
    { value: 'Lithuania / Lithuania', label: 'Lithuania / Lithuania' },
    { value: 'Latvia / Latvia', label: 'Latvia / Latvia' },
    { value: 'Estonia / Estonia', label: 'Estonia / Estonia' },
    { value: 'Slovenia / Slovenia', label: 'Slovenia / Slovenia' },
    { value: 'Croatia / Croatia', label: 'Croatia / Croatia' },
    { value: 'Bosnia and Herzegovina / Bosnia and Herzegovina', label: 'Bosnia and Herzegovina / Bosnia and Herzegovina' },
    { value: 'Serbia / Serbia', label: 'Serbia / Serbia' },
    { value: 'Montenegro / Montenegro', label: 'Montenegro / Montenegro' },
    { value: 'North Macedonia / North Macedonia', label: 'North Macedonia / North Macedonia' },
    { value: 'Albania / Albania', label: 'Albania / Albania' },
    { value: 'Greece / Greece', label: 'Greece / Greece' },
    { value: 'Malta / Malta', label: 'Malta / Malta' },

    // North America
    { value: 'Mỹ / United States', label: 'Mỹ / United States' },
    { value: 'Canada / Canada', label: 'Canada / Canada' },
    { value: 'Mexico / Mexico', label: 'Mexico / Mexico' },
    { value: 'Guatemala / Guatemala', label: 'Guatemala / Guatemala' },
    { value: 'Belize / Belize', label: 'Belize / Belize' },
    { value: 'El Salvador / El Salvador', label: 'El Salvador / El Salvador' },
    { value: 'Honduras / Honduras', label: 'Honduras / Honduras' },
    { value: 'Nicaragua / Nicaragua', label: 'Nicaragua / Nicaragua' },
    { value: 'Costa Rica / Costa Rica', label: 'Costa Rica / Costa Rica' },
    { value: 'Panama / Panama', label: 'Panama / Panama' },
    { value: 'Cuba / Cuba', label: 'Cuba / Cuba' },
    { value: 'Jamaica / Jamaica', label: 'Jamaica / Jamaica' },
    { value: 'Haiti / Haiti', label: 'Haiti / Haiti' },
    { value: 'Dominican Republic / Dominican Republic', label: 'Dominican Republic / Dominican Republic' },

    // South America
    { value: 'Brazil / Brazil', label: 'Brazil / Brazil' },
    { value: 'Argentina / Argentina', label: 'Argentina / Argentina' },
    { value: 'Chile / Chile', label: 'Chile / Chile' },
    { value: 'Peru / Peru', label: 'Peru / Peru' },
    { value: 'Colombia / Colombia', label: 'Colombia / Colombia' },
    { value: 'Venezuela / Venezuela', label: 'Venezuela / Venezuela' },
    { value: 'Ecuador / Ecuador', label: 'Ecuador / Ecuador' },
    { value: 'Bolivia / Bolivia', label: 'Bolivia / Bolivia' },
    { value: 'Paraguay / Paraguay', label: 'Paraguay / Paraguay' },
    { value: 'Uruguay / Uruguay', label: 'Uruguay / Uruguay' },
    { value: 'Guyana / Guyana', label: 'Guyana / Guyana' },
    { value: 'Suriname / Suriname', label: 'Suriname / Suriname' },

    // Africa
    { value: 'Nam Phi / South Africa', label: 'Nam Phi / South Africa' },
    { value: 'Ai Cập / Egypt', label: 'Ai Cập / Egypt' },
    { value: 'Libya / Libya', label: 'Libya / Libya' },
    { value: 'Tunisia / Tunisia', label: 'Tunisia / Tunisia' },
    { value: 'Algeria / Algeria', label: 'Algeria / Algeria' },
    { value: 'Morocco / Morocco', label: 'Morocco / Morocco' },
    { value: 'Sudan / Sudan', label: 'Sudan / Sudan' },
    { value: 'Ethiopia / Ethiopia', label: 'Ethiopia / Ethiopia' },
    { value: 'Kenya / Kenya', label: 'Kenya / Kenya' },
    { value: 'Tanzania / Tanzania', label: 'Tanzania / Tanzania' },
    { value: 'Uganda / Uganda', label: 'Uganda / Uganda' },
    { value: 'Rwanda / Rwanda', label: 'Rwanda / Rwanda' },
    { value: 'Nigeria / Nigeria', label: 'Nigeria / Nigeria' },
    { value: 'Ghana / Ghana', label: 'Ghana / Ghana' },
    { value: 'Senegal / Senegal', label: 'Senegal / Senegal' },
    { value: 'Mali / Mali', label: 'Mali / Mali' },
    { value: 'Burkina Faso / Burkina Faso', label: 'Burkina Faso / Burkina Faso' },
    { value: 'Niger / Niger', label: 'Niger / Niger' },
    { value: 'Chad / Chad', label: 'Chad / Chad' },
    { value: 'Cameroon / Cameroon', label: 'Cameroon / Cameroon' },
    { value: 'Congo / Congo', label: 'Congo / Congo' },
    { value: 'Angola / Angola', label: 'Angola / Angola' },
    { value: 'Zambia / Zambia', label: 'Zambia / Zambia' },
    { value: 'Zimbabwe / Zimbabwe', label: 'Zimbabwe / Zimbabwe' },
    { value: 'Botswana / Botswana', label: 'Botswana / Botswana' },
    { value: 'Namibia / Namibia', label: 'Namibia / Namibia' },

    // Oceania
    { value: 'Úc / Australia', label: 'Úc / Australia' },
    { value: 'New Zealand / New Zealand', label: 'New Zealand / New Zealand' },
    { value: 'Fiji / Fiji', label: 'Fiji / Fiji' },
    { value: 'Papua New Guinea / Papua New Guinea', label: 'Papua New Guinea / Papua New Guinea' },
    { value: 'Solomon Islands / Solomon Islands', label: 'Solomon Islands / Solomon Islands' },
    { value: 'Vanuatu / Vanuatu', label: 'Vanuatu / Vanuatu' },
    { value: 'Samoa / Samoa', label: 'Samoa / Samoa' },
    { value: 'Tonga / Tonga', label: 'Tonga / Tonga' },

    // Other option
    { value: 'other', label: 'Khác (tự nhập)' }
  ];

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/metadata/enums?type=position');
      const result = await response.json();
      
      if (result.success) {
        setPositions(result.data);
      } else {
        console.error('Failed to fetch positions:', result.message);
        // Fallback to hardcoded values
        setPositions([
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
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Fallback to hardcoded values
      setPositions([
        { value: 'Giáo viên', label: 'Giáo viên' },
        { value: 'Trợ giảng', label: 'Trợ giảng' },
        { value: 'Tổ trưởng', label: 'Tổ trưởng' },
        { value: 'Nhân viên', label: 'Nhân viên' },
        { value: 'Thực tập sinh', label: 'Thực tập sinh' },
        { value: 'Quản lý', label: 'Quản lý' },
        { value: 'Phó giám đốc', label: 'Phó giám đốc' },
        { value: 'Giám đốc', label: 'Giám đốc' }
      ]);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/metadata/enums?type=department');
      const result = await response.json();
      
      if (result.success) {
        setDepartments(result.data);
      } else {
        console.error('Failed to fetch departments:', result.message);
        // Fallback to hardcoded values
        setDepartments([
          { value: 'Hành chính nhân sự', label: 'Hành chính nhân sự' },
          { value: 'Vận hành', label: 'Vận hành' },
          { value: 'Chăm sóc khách hàng', label: 'Chăm sóc khách hàng' },
          { value: 'Tài chính', label: 'Tài chính' },
          { value: 'Ban giám đốc', label: 'Ban giám đốc' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback to hardcoded values
      setDepartments([
        { value: 'Hành chính nhân sự', label: 'Hành chính nhân sự' },
        { value: 'Vận hành', label: 'Vận hành' },
        { value: 'Chăm sóc khách hàng', label: 'Chăm sóc khách hàng' },
        { value: 'Tài chính', label: 'Tài chính' },
        { value: 'Ban giám đốc', label: 'Ban giám đốc' }
      ]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nationality') {
      if (value === 'other') {
        setShowCustomNationality(true);
        setFormData(prev => ({
          ...prev,
          [name]: '',
          customNationality: ''
        }));
      } else {
        setShowCustomNationality(false);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customNationality: ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        full_name: formData.full_name,
        position: formData.position,
        department: formData.department,
        status: formData.status,
        data: {
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth,
          hire_date: formData.hire_date,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          qualifications: formData.qualifications,
          nationality: showCustomNationality ? formData.customNationality : formData.nationality,
          notes: formData.notes
        }
      };

      await onSubmit(submitData);
      
      if (!isEditing) {
        // Reset form after successful creation
        setFormData({
          full_name: '',
          position: '',
          department: '',
          status: 'active',
          email: '',
          phone: '',
          address: '',
          date_of_birth: '',
          hire_date: '',
          salary: '',
          qualifications: '',
          nationality: '',
          customNationality: '',
          notes: ''
        });
        setShowCustomNationality(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Đang làm việc</option>
                <option value="inactive">Nghỉ việc</option>
                <option value="on_leave">Nghỉ phép</option>
                <option value="suspended">Tạm nghỉ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Chức vụ *
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                disabled={isLoadingPositions}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingPositions ? 'Đang tải...' : 'Chọn chức vụ'}
                </option>
                {positions.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                disabled={isLoadingDepartments}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingDepartments ? 'Đang tải...' : 'Chọn phòng ban'}
                </option>
                {departments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                Quốc tịch
              </label>
              <select
                id="nationality"
                name="nationality"
                value={showCustomNationality ? 'other' : formData.nationality}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn quốc tịch</option>
                {nationalities.map((nationality) => (
                  <option key={nationality.value} value={nationality.value}>
                    {nationality.label}
                  </option>
                ))}
              </select>
            </div>
            
            {showCustomNationality && (
              <div>
                <label htmlFor="customNationality" className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập quốc tịch khác
                </label>
                <input
                  type="text"
                  id="customNationality"
                  name="customNationality"
                  value={formData.customNationality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập quốc tịch (ví dụ: Đan Mạch / Denmark)"
                />
              </div>
            )}
            
            {!showCustomNationality && <div></div>}
          </div>

          <div className="mt-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập địa chỉ"
            />
          </div>
        </div>

        {/* Employment Details */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin công việc</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày vào làm
              </label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Lương (VNĐ)
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                min="0"
                step="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15000000"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                Bằng cấp / Chứng chỉ
              </label>
              <textarea
                id="qualifications"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Danh sách bằng cấp, chứng chỉ"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ghi chú thêm về nhân viên"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
          </button>
          
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              if (!isEditing) {
                setFormData({
                  full_name: '',
                  position: '',
                  department: '',
                  status: 'active',
                  email: '',
                  phone: '',
                  address: '',
                  date_of_birth: '',
                  hire_date: '',
                  salary: '',
                  qualifications: '',
                  nationality: '',
                  customNationality: '',
                  notes: ''
                });
                setShowCustomNationality(false);
              }
            }}
          >
            {isEditing ? 'Hủy' : 'Xóa form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
