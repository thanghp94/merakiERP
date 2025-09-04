// CRUD Table Components for Vietnamese Business Management System
// Standardized CRUD interfaces using CrudTable component
export { default as FacilitiesTabCrud } from './facilities/FacilitiesTabCrud';
export { default as RequestsTabCrud } from './requests/RequestsTabCrud';
export { default as TasksTabCrud } from './tasks/TasksTabCrud';
export { default as FinancesTabCrud } from './finances/FinancesTabCrud';
export { default as StudentsTabCrud } from './students/StudentsTabCrud';

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
