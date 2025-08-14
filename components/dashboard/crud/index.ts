// CRUD Table Components for Vietnamese Business Management System
// Standardized CRUD interfaces using CrudTable component

export { default as FacilitiesTabCrud } from './FacilitiesTabCrud';
export { default as EmployeesTabCrud } from './EmployeesTabCrud';
export { default as RequestsTabCrud } from './RequestsTabCrud';
export { default as TasksTabCrud } from './TasksTabCrud';
export { default as FinancesTabCrud } from './FinancesTabCrud';
export { default as StudentsTabCrud } from './StudentsTabCrud';

// Re-export types for convenience
export type {
  Facility,
  Employee,
  Student,
  Finance,
  BusinessTask,
  TaskInstance,
  Request
} from '../shared/types';
