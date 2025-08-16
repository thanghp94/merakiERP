# Import Aliases & ES6 Import Renaming Guide

This guide covers how to use import aliases and the `as` keyword for renaming imports in your Next.js/React project.

## 🎯 Import Aliases Setup

Your project now has comprehensive import aliases configured in `tsconfig.json`:

### Available Aliases

| Alias | Maps to | Example Usage |
|-------|---------|---------------|
| `@/*` | `./*` | `@/components/Button` |
| `@/components/*` | `components/*` | `@/components/ui/Button` |
| `@/pages/*` | `pages/*` | `@/pages/dashboard` |
| `@/lib/*` | `lib/*` | `@/lib/supabase` |
| `@/styles/*` | `styles/*` | `@/styles/globals.css` |
| `@/utils/*` | `lib/utils/*` | `@/utils/timezone` |
| `@/hooks/*` | `lib/hooks/*` | `@/hooks/useCurrentEmployee` |
| `@/constants/*` | `lib/constants/*` | `@/constants/businessOptions` |
| `@/auth/*` | `lib/auth/*` | `@/auth/AuthContext` |
| `@/ui/*` | `components/ui/*` | `@/ui/Button` |
| `@/dashboard/*` | `components/dashboard/*` | `@/dashboard/StudentsTab` |
| `@/shared/*` | `components/dashboard/shared/*` | `@/shared/types` |
| `@/api/*` | `pages/api/*` | `@/api/students` |

## 📝 Before & After Examples

### Before (Relative Imports)
```typescript
// From components/dashboard/tabs/admissions/AdmissionsTab.tsx
import { Admission } from '../../shared/types';
import AdmissionsKanban from './AdmissionsKanban';
```

### After (Using Aliases)
```typescript
// From components/dashboard/tabs/admissions/AdmissionsTab.tsx
import { Admission } from '@/shared/types';
import AdmissionsKanban from '@/dashboard/tabs/admissions/AdmissionsKanban';
```

## 🔄 ES6 Import Renaming with `as` Keyword

The `as` keyword allows you to rename imports to avoid naming conflicts or provide more descriptive names.

### 1. Named Import Renaming

```typescript
// Rename a single named import
import { Button as UIButton } from '@/ui/Button';
import { Button as CustomButton } from '@/components/CustomButton';

// Now you can use both without conflicts
const MyComponent = () => (
  <div>
    <UIButton>UI Button</UIButton>
    <CustomButton>Custom Button</CustomButton>
  </div>
);
```

### 2. Multiple Named Import Renaming

```typescript
// Rename multiple imports from the same module
import { 
  Student as StudentType, 
  Teacher as TeacherType,
  Class as ClassType 
} from '@/shared/types';

// Rename imports from different modules
import { useEffect as useReactEffect } from 'react';
import { useEffect as useCustomEffect } from '@/hooks/useCustomEffect';
```

### 3. Default Import Renaming

```typescript
// Rename default imports
import { default as ReactComponent } from 'react';
import { default as StudentForm } from '@/components/StudentForm';

// Or more commonly:
import StudentFormComponent from '@/components/StudentForm';
```

### 4. Namespace Import Renaming

```typescript
// Import entire module as namespace with custom name
import * as DateUtils from '@/utils/date';
import * as StringHelpers from '@/utils/string';
import * as APIHelpers from '@/utils/api';

// Usage
const formattedDate = DateUtils.formatDate(new Date());
const cleanString = StringHelpers.sanitize(userInput);
```

## 🎨 Real-World Examples

### Example 1: Component Library Conflicts

```typescript
// When you have multiple Button components
import { Button as MUIButton } from '@mui/material';
import { Button as AntButton } from 'antd';
import { Button as CustomButton } from '@/ui/Button';

const Dashboard = () => (
  <div>
    <MUIButton variant="contained">Material UI</MUIButton>
    <AntButton type="primary">Ant Design</AntButton>
    <CustomButton variant="primary">Custom</CustomButton>
  </div>
);
```

### Example 2: Utility Function Conflicts

```typescript
// When utility functions have similar names
import { formatDate as formatDateUS } from '@/utils/dateUS';
import { formatDate as formatDateVN } from '@/utils/dateVN';
import { formatCurrency as formatUSD } from '@/utils/currencyUS';
import { formatCurrency as formatVND } from '@/utils/currencyVN';

const InvoiceComponent = ({ date, amount, locale }) => {
  const formattedDate = locale === 'US' 
    ? formatDateUS(date) 
    : formatDateVN(date);
    
  const formattedAmount = locale === 'US'
    ? formatUSD(amount)
    : formatVND(amount);
    
  return <div>{formattedDate} - {formattedAmount}</div>;
};
```

### Example 3: Type Conflicts

```typescript
// When you have type conflicts
import { User as DatabaseUser } from '@/lib/database/types';
import { User as APIUser } from '@/lib/api/types';
import { User as ComponentUser } from '@/components/types';

interface UserProfileProps {
  dbUser: DatabaseUser;
  apiUser: APIUser;
  componentUser: ComponentUser;
}
```

### Example 4: Hook Renaming for Clarity

```typescript
// Make hook purposes clearer
import { useState as useFormState } from 'react';
import { useEffect as useComponentMount } from 'react';
import { useCurrentEmployee as useLoggedInEmployee } from '@/hooks/useCurrentEmployee';
import { useApiData as useStudentsData } from '@/hooks/useApiData';

const StudentManagement = () => {
  const [formData, setFormData] = useFormState({});
  const employee = useLoggedInEmployee();
  const students = useStudentsData('/api/students');
  
  useComponentMount(() => {
    // Component initialization
  }, []);
};
```

## 🔧 Advanced Patterns

### 1. Conditional Imports with Renaming

```typescript
// Dynamic imports with renaming
const loadComponent = async (componentType: string) => {
  if (componentType === 'student') {
    const { default: StudentComponent } = await import('@/components/StudentForm');
    return StudentComponent;
  } else {
    const { default: TeacherComponent } = await import('@/components/TeacherForm');
    return TeacherComponent;
  }
};
```

### 2. Re-exporting with Renaming

```typescript
// In an index file, re-export with new names
export { StudentsTab as StudentManagement } from '@/dashboard/tabs/students/StudentsTab';
export { TeachersTab as TeacherManagement } from '@/dashboard/tabs/teachers/TeachersTab';
export { ClassesTab as ClassManagement } from '@/dashboard/tabs/classes/ClassesTab';
```

### 3. Combining Aliases and Renaming

```typescript
// Use both aliases and renaming together
import { 
  Button as PrimaryButton,
  Input as TextInput,
  Card as UICard 
} from '@/ui';

import { 
  StudentForm as StudentRegistrationForm,
  TeacherForm as TeacherRegistrationForm 
} from '@/dashboard/forms';

import { 
  useFormValidation as useStudentValidation 
} from '@/hooks/useFormWithValidation';
```

## 📋 Best Practices

### 1. Consistent Naming Conventions

```typescript
// Good: Consistent suffixes
import { Button as UIButton } from '@/ui/Button';
import { Modal as UIModal } from '@/ui/Modal';
import { Card as UICard } from '@/ui/Card';

// Good: Descriptive renaming
import { useEffect as useComponentDidMount } from 'react';
import { useState as useLocalState } from 'react';
```

### 2. Avoid Over-renaming

```typescript
// Bad: Unnecessary renaming
import { useState as s } from 'react';
import { useEffect as e } from 'react';

// Good: Keep standard names when no conflict
import { useState, useEffect } from 'react';
```

### 3. Group Related Imports

```typescript
// Good: Group by source and purpose
import React, { useState, useEffect } from 'react';

import { 
  Button as UIButton, 
  Input as UIInput,
  Modal as UIModal 
} from '@/ui';

import { 
  Student as StudentType,
  Teacher as TeacherType 
} from '@/shared/types';

import { 
  useCurrentEmployee,
  useApiData as useStudentsData 
} from '@/hooks';
```

## 🚀 Migration Strategy

### Step 1: Update Existing Files Gradually

Start with the most deeply nested components:

```typescript
// Before
import { Admission } from '../../shared/types';

// After  
import { Admission } from '@/shared/types';
```

### Step 2: Use IDE Features

Most IDEs support automatic import path updates:
- VS Code: Use "TypeScript: Update imports on file move"
- Enable auto-import suggestions with aliases

### Step 3: Establish Team Conventions

Create team guidelines for when to use aliases vs. relative imports:
- Use aliases for imports crossing major directory boundaries
- Use relative imports for closely related files
- Always use aliases for commonly used utilities and types

## 🎯 Your Project-Specific Examples

Based on your current structure, here are recommended patterns:

```typescript
// Dashboard components
import { StudentsTab } from '@/dashboard/tabs/students/StudentsTab';
import { AdmissionsKanban } from '@/dashboard/tabs/admissions/AdmissionsKanban';

// Shared utilities and types
import { Admission, Student } from '@/shared/types';
import { formatDate, formatCurrency } from '@/utils';

// UI components
import { Button, Input, Card } from '@/ui';

// Hooks and auth
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { AuthContext } from '@/auth/AuthContext';

// API utilities
import { studentsAPI } from '@/api/students';
```

## 🔍 Troubleshooting

### Common Issues:

1. **Path not resolving**: Restart TypeScript server in VS Code
2. **Import suggestions not working**: Check `tsconfig.json` syntax
3. **Build errors**: Ensure Next.js recognizes the aliases (they should work automatically)

### VS Code Settings:

Add to your `.vscode/settings.json`:
```json
{
  "typescript.suggest.includeCompletionsForModuleExports": true,
  "typescript.suggest.includeCompletionsWithInsertText": true
}
```

This setup will significantly improve your import experience and code maintainability!
