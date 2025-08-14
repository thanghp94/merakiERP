# User-Employee Mapping Plan

## Problem Statement
The current system has a disconnect between:
- **Supabase Auth Users**: Used for authentication (UUID from auth.users)
- **Employees Table**: Business logic entities (separate UUID from public.employees)

This causes issues when creating requests, as the system needs to know which employee record corresponds to the authenticated user.

## Current Table Structure
```sql
create table public.employees (
  id uuid not null default gen_random_uuid (),
  full_name text not null,
  position public.position null,
  department public.department null,
  status text null default 'active'::text,
  data jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint employees_pkey primary key (id)
);
```

## Proposed Solutions

### Option 1: Add user_id Column (Recommended)
Add a foreign key reference to link employees with auth users.

**Database Changes:**
```sql
-- Add user_id column to employees table
ALTER TABLE public.employees 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create unique index to ensure one employee per user
CREATE UNIQUE INDEX idx_employees_user_id ON public.employees(user_id);

-- Add index for faster lookups
CREATE INDEX idx_employees_user_id_lookup ON public.employees(user_id) WHERE user_id IS NOT NULL;
```

**Benefits:**
- Clean relational design
- Fast lookups
- Maintains data integrity
- Allows employees without user accounts (contractors, etc.)

**Implementation Steps:**
1. Add the column
2. Update existing employee records to link with users
3. Modify employee creation process
4. Update authentication logic

### Option 2: Use Email Matching
Match users to employees based on email addresses.

**Database Changes:**
```sql
-- Ensure email is stored in employees.data
-- Add index for email lookups
CREATE INDEX idx_employees_email ON public.employees USING gin ((data->>'email'));
```

**Benefits:**
- No schema changes to core table
- Works with existing data
- Flexible for different matching strategies

**Drawbacks:**
- Less reliable (emails can change)
- Performance overhead
- Potential for mismatches

### Option 3: Hybrid Approach (Best of Both)
Combine both methods for maximum flexibility.

## Recommended Implementation Plan

### Phase 1: Database Schema Update
```sql
-- 1. Add user_id column
ALTER TABLE public.employees 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. Create indexes
CREATE UNIQUE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_email ON public.employees USING gin ((data->>'email'));

-- 3. Add helper function
CREATE OR REPLACE FUNCTION get_employee_by_user_id(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  position text,
  department text,
  status text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e.position::text, e.department::text, 
         e.status, e.data, e.created_at, e.updated_at, e.user_id
  FROM public.employees e
  WHERE e.user_id = p_user_id AND e.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Data Migration Script
```javascript
// scripts/link-users-to-employees.js
const { createClient } = require('@supabase/supabase-js');

async function linkUsersToEmployees() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  // Get all auth users
  const { data: users } = await supabase.auth.admin.listUsers();
  
  // Get all employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*');
  
  for (const user of users.users) {
    // Try to match by email
    const employee = employees.find(emp => 
      emp.data?.email?.toLowerCase() === user.email?.toLowerCase()
    );
    
    if (employee && !employee.user_id) {
      // Link the employee to the user
      await supabase
        .from('employees')
        .update({ user_id: user.id })
        .eq('id', employee.id);
      
      console.log(`Linked user ${user.email} to employee ${employee.full_name}`);
    }
  }
}
```

### Phase 3: API Updates
```typescript
// pages/api/employees/current.ts - New endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get employee by user_id
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !employee) {
      return res.status(404).json({ message: 'Employee record not found' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### Phase 4: Frontend Updates
```typescript
// lib/hooks/useCurrentEmployee.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export const useCurrentEmployee = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCurrentEmployee();
    } else {
      setEmployee(null);
      setLoading(false);
    }
  }, [user]);

  const fetchCurrentEmployee = async () => {
    try {
      const response = await fetch('/api/employees/current', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEmployee(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  return { employee, loading, error, refetch: fetchCurrentEmployee };
};
```

### Phase 5: Update Request Form
```typescript
// components/dashboard/RequestsTab.tsx
import { useCurrentEmployee } from '../../lib/hooks/useCurrentEmployee';

const RequestsTab: React.FC<RequestsTabProps> = ({ employees }) => {
  const { employee: currentEmployee, loading: employeeLoading } = useCurrentEmployee();
  
  // Pass currentEmployee.id to RequestForm
  <RequestForm
    onSubmit={handleCreateRequest}
    onCancel={() => setShowCreateModal(false)}
    employees={employees}
    currentUserId={currentEmployee?.id}
  />
};
```

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Create database migration script
- [ ] Add user_id column and indexes
- [ ] Create helper functions
- [ ] Build data migration script
- [ ] Create /api/employees/current endpoint

### Week 2: Frontend Integration
- [ ] Create useCurrentEmployee hook
- [ ] Update RequestsTab component
- [ ] Update other forms that need current user
- [ ] Add error handling for unmapped users

### Week 3: Testing & Deployment
- [ ] Test user-employee mapping
- [ ] Test request creation flow
- [ ] Handle edge cases (users without employees)
- [ ] Deploy and monitor

## Edge Cases to Handle

1. **Users without Employee Records**
   - Show appropriate error message
   - Provide admin interface to create employee records

2. **Multiple Employees per User**
   - Prevent with unique constraint
   - Handle existing duplicates

3. **Employees without Users**
   - Allow for contractors/external staff
   - Optional user_id field

4. **Email Changes**
   - Update both auth.users and employees.data
   - Maintain user_id link as primary

## Security Considerations

1. **RLS Policies**
   ```sql
   -- Users can only see their own employee record
   CREATE POLICY "Users can view own employee record" ON employees
   FOR SELECT USING (user_id = auth.uid());
   ```

2. **API Security**
   - Validate JWT tokens
   - Ensure users can only access their own data
   - Admin-only endpoints for user-employee management

This plan provides a robust solution for mapping authentication users to employee records while maintaining data integrity and security.
