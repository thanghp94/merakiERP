// Centralized business logic and dropdown options
// This eliminates duplication across all form components

export interface OptionItem {
  value: string;
  label: string;
}

// Employee-related options
export const POSITIONS: OptionItem[] = [
  { value: 'Giáo viên', label: 'Giáo viên' },
  { value: 'Trợ giảng', label: 'Trợ giảng' },
  { value: 'Tổ trưởng', label: 'Tổ trưởng' },
  { value: 'Nhân viên', label: 'Nhân viên' },
  { value: 'Thực tập sinh', label: 'Thực tập sinh' },
  { value: 'Quản lý', label: 'Quản lý' },
  { value: 'Phó giám đốc', label: 'Phó giám đốc' },
  { value: 'Giám đốc', label: 'Giám đốc' }
];

export const DEPARTMENTS: OptionItem[] = [
  { value: 'Hành chính nhân sự', label: 'Hành chính nhân sự' },
  { value: 'Vận hành', label: 'Vận hành' },
  { value: 'Chăm sóc khách hàng', label: 'Chăm sóc khách hàng' },
  { value: 'Tài chính', label: 'Tài chính' },
  { value: 'Ban giám đốc', label: 'Ban giám đốc' }
];

export const EMPLOYEE_STATUSES: OptionItem[] = [
  { value: 'active', label: 'Đang làm việc' },
  { value: 'inactive', label: 'Nghỉ việc' },
  { value: 'on_leave', label: 'Nghỉ phép' },
  { value: 'suspended', label: 'Tạm nghỉ' }
];

// Program and class-related options
export const PROGRAM_TYPES: OptionItem[] = [
  { value: 'GrapeSEED', label: 'GrapeSEED' },
  { value: 'Pre-WSC', label: 'Pre-WSC' },
  { value: 'WSC', label: 'WSC' },
  { value: 'Tiếng Anh Tiểu Học', label: 'Tiếng Anh Tiểu Học' },
  { value: 'Gavel club', label: 'Gavel club' }
];

export const CLASS_STATUSES: OptionItem[] = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' }
];

export const CAMPUS_OPTIONS: OptionItem[] = [
  { value: 'CS1', label: 'CS1' },
  { value: 'CS2', label: 'CS2' },
  { value: 'CS3', label: 'CS3' },
  { value: 'CS4', label: 'CS4' }
];

// Generate GrapeSEED units (U1-U30)
export const GRAPESEED_UNITS: OptionItem[] = Array.from({ length: 30 }, (_, i) => ({
  value: `U${i + 1}`,
  label: `U${i + 1}`
}));

// Generate lesson numbers (L1-L40)
export const LESSON_NUMBERS: OptionItem[] = Array.from({ length: 40 }, (_, i) => ({
  value: `L${i + 1}`,
  label: `L${i + 1}`
}));

// Session subject types
export const SUBJECT_TYPES: OptionItem[] = [
  { value: 'TSI', label: 'TSI (Teaching Speaking & Interaction)' },
  { value: 'REP', label: 'REP (Repetition)' },
  { value: 'GRA', label: 'GRA (Grammar)' },
  { value: 'VOC', label: 'VOC (Vocabulary)' },
  { value: 'LIS', label: 'LIS (Listening)' },
  { value: 'REA', label: 'REA (Reading)' }
];

// Days of the week
export const DAYS_OF_WEEK: OptionItem[] = [
  { value: 'monday', label: 'Thứ Hai' },
  { value: 'tuesday', label: 'Thứ Ba' },
  { value: 'wednesday', label: 'Thứ Tư' },
  { value: 'thursday', label: 'Thứ Năm' },
  { value: 'friday', label: 'Thứ Sáu' },
  { value: 'saturday', label: 'Thứ Bảy' },
  { value: 'sunday', label: 'Chủ Nhật' }
];

// Comprehensive nationalities list
export const NATIONALITIES: OptionItem[] = [
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

// Helper functions
export function getDayLabel(dayKey: string): string {
  return DAYS_OF_WEEK.find(d => d.value === dayKey)?.label || dayKey;
}

export function getStatusLabel(status: string, type: 'employee' | 'class' = 'employee'): string {
  const options = type === 'employee' ? EMPLOYEE_STATUSES : CLASS_STATUSES;
  return options.find(s => s.value === status)?.label || status;
}

export function isTeacherPosition(position: string): boolean {
  const pos = position?.toLowerCase() || '';
  return pos.includes('giáo viên') || pos.includes('teacher') || pos.includes('gv') || pos === 'teacher';
}

export function isAssistantPosition(position: string): boolean {
  const pos = position?.toLowerCase() || '';
  return pos.includes('trợ giảng') || pos.includes('assistant') || pos.includes('ta') || pos === 'assistant';
}

export function generateLessonName(className: string, unit: string, lessonNumber: string): string {
  if (!className || !unit || !lessonNumber) return '';
  return `${className}.${unit}.${lessonNumber}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  if (end <= start) return 0;
  
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Convert to minutes
}
