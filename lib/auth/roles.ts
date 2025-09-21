// Client-side role constants and utilities
export const ROLES = {
  STUDENT: 'student',
  TA: 'ta',
  TEACHER: 'teacher',
  STAFF: 'staff',
  ADMIN: 'admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role hierarchy - higher roles include permissions of lower roles
export const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 0,
  [ROLES.TA]: 1,
  [ROLES.TEACHER]: 2,
  [ROLES.STAFF]: 3,
  [ROLES.ADMIN]: 4
};

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as Role] ?? 999;
  return userLevel >= requiredLevel;
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case ROLES.ADMIN:
      return 'Quản trị viên';
    case ROLES.STAFF:
      return 'Nhân viên';
    case ROLES.TEACHER:
      return 'Giáo viên';
    case ROLES.TA:
      return 'Trợ giảng';
    case ROLES.STUDENT:
      return 'Học sinh';
    default:
      return 'Người dùng';
  }
}