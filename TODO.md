# Component Refactoring Plan - Focus on Reusability

## Analysis of Reusable Patterns Across Components

### 1. **Form Management Patterns** (Highly Reusable)
- **Employee Forms**: Used in EmployeeForm, EmployeesTab, and potentially other HR components
- **Time/Schedule Forms**: Used in WorkScheduleModal, MainSessionForm, and potentially other scheduling components
- **Dropdown/Select Logic**: Used across all components for positions, departments, teachers, rooms, etc.
- **Validation Patterns**: Similar validation logic across all forms

### 2. **Data Fetching Patterns** (Highly Reusable)
- **Employee Data**: Fetching employees, positions, departments (used in multiple components)
- **Facility/Room Data**: Used in MainSessionForm and potentially other location-based components
- **Class Data**: Used in MainSessionForm and other class-related components
- **Metadata/Enum Fetching**: Used across all components for dropdowns

### 3. **UI Patterns** (Highly Reusable)
- **Modal Patterns**: WorkScheduleModal pattern can be reused for other modals
- **Form Sections**: Similar sectioned forms across components
- **Time Input Handling**: Used in WorkScheduleModal and MainSessionForm
- **Dynamic Form Arrays**: Session management in MainSessionForm can be generalized

### 4. **State Management Patterns** (Highly Reusable)
- **Form State**: Similar form state management across components
- **Loading States**: Consistent loading state patterns
- **Error Handling**: Similar error handling patterns

## Refactoring Plan - Maximum Reusability

### Phase 1: Create Shared Constants & Utilities
1. **`lib/constants/`** - Shared constants (nationalities, subject types, etc.)
2. **`lib/hooks/`** - Reusable custom hooks
3. **`lib/utils/`** - Shared utility functions
4. **`components/shared/forms/`** - Reusable form components

### Phase 2: Extract Reusable Hooks
1. **`useFormState`** - Generic form state management
2. **`useApiData`** - Generic API data fetching
3. **`useEmployeeData`** - Employee-specific data management
4. **`useTimeCalculation`** - Time/duration calculations
5. **`useValidation`** - Form validation logic

### Phase 3: Create Reusable Form Components
1. **`FormSection`** - Reusable form sections with headers
2. **`TimeRangeInput`** - Time range input component
3. **`EmployeeSelector`** - Employee selection dropdown
4. **`LocationSelector`** - Room/location selection
5. **`DynamicFormArray`** - Generic dynamic form array component

### Phase 4: Refactor Target Components
1. **EmployeeForm** - Use shared form components and hooks
2. **EmployeesTab** - Remove duplication, use shared EmployeeForm logic
3. **WorkScheduleModal** - Extract reusable schedule components
4. **MainSessionForm** - Use shared form patterns and components

## Implementation Steps

### Step 1: Create Shared Constants
- Extract nationality lists, subject types, etc.
- Create shared validation rules
- Create shared form field configurations

### Step 2: Create Reusable Hooks
- `useFormState` for generic form management
- `useEmployeeData` for employee-related API calls
- `useDropdownData` for generic dropdown data fetching
- `useTimeCalculation` for time/duration logic

### Step 3: Create Reusable Components
- `EmployeeFormFields` - Reusable employee form fields
- `TimeScheduleForm` - Reusable time/schedule form
- `DynamicSessionManager` - Reusable session management
- `FormModal` enhancements for better reusability

### Step 4: Refactor Components
- Refactor each component to use shared patterns
- Ensure backward compatibility
- Test thoroughly

## Files to Create/Modify

### New Files:
- `lib/constants/formConstants.ts`
- `lib/hooks/useFormState.ts`
- `lib/hooks/useEmployeeData.ts`
- `lib/hooks/useDropdownData.ts`
- `lib/hooks/useTimeCalculation.ts`
- `components/shared/forms/EmployeeFormFields.tsx`
- `components/shared/forms/TimeRangeInput.tsx`
- `components/shared/forms/DynamicFormArray.tsx`
- `components/shared/forms/FormSection.tsx`

### Modified Files:
- `components/dashboard/employees/EmployeeForm.tsx`
- `components/dashboard/employees/EmployeesTab.tsx`
- `components/dashboard/employees/WorkScheduleModal.tsx`
- `components/dashboard/sessions/MainSessionForm.tsx`

## Expected Benefits:
1. **Reduced Code Duplication**: ~40-50% reduction in duplicate code
2. **Improved Maintainability**: Centralized form logic and validation
3. **Better Consistency**: Standardized UI patterns across components
4. **Enhanced Reusability**: Components can be easily reused in new features
5. **Easier Testing**: Isolated, focused components are easier to test
