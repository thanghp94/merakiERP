// Phase 3: API endpoint to get current employee based on authenticated user
// This implements the API layer from USER_EMPLOYEE_MAPPING_PLAN.md

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Method 1: Try to get employee by user_id (primary method)
    let { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        full_name,
        position,
        department,
        status,
        data,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Method 2: If not found by user_id, try to find by email (fallback)
    if (employeeError && user.email) {
      console.log(`Employee not found by user_id for ${user.email}, trying email match...`);
      
      const { data: employeeByEmail, error: emailError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          position,
          department,
          status,
          data,
          created_at,
          updated_at,
          user_id
        `)
        .eq('status', 'active')
        .is('user_id', null) // Only get unlinked employees
        .ilike('data->>email', user.email);

      if (!emailError && employeeByEmail && employeeByEmail.length > 0) {
        employee = employeeByEmail[0];
        
        // Auto-link this employee to the user for future requests
        try {
          await supabase
            .from('employees')
            .update({ user_id: user.id })
            .eq('id', employee.id);
          
          employee.user_id = user.id;
          console.log(`Auto-linked employee ${employee.full_name} to user ${user.email}`);
        } catch (linkError) {
          console.error('Failed to auto-link employee:', linkError);
        }
      }
    }

    // Method 3: If still not found, try partial name matching (last resort)
    if (!employee && user.user_metadata?.full_name) {
      console.log(`Employee not found by email for ${user.email}, trying name match...`);
      
      const { data: allEmployees, error: allError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          position,
          department,
          status,
          data,
          created_at,
          updated_at,
          user_id
        `)
        .eq('status', 'active')
        .is('user_id', null);

      if (!allError && allEmployees) {
        const userNameParts = user.user_metadata.full_name.toLowerCase().split(' ');
        const matchedEmployee = allEmployees.find(emp => {
          const empNameParts = emp.full_name?.toLowerCase().split(' ') || [];
          return userNameParts.some((part: string) => 
            empNameParts.some((empPart: string) => empPart.includes(part) || part.includes(empPart))
          );
        });

        if (matchedEmployee) {
          employee = matchedEmployee;
          
          // Auto-link this employee to the user
          try {
            await supabase
              .from('employees')
              .update({ user_id: user.id })
              .eq('id', employee.id);
            
            employee.user_id = user.id;
            console.log(`Auto-linked employee ${employee.full_name} to user ${user.email} by name match`);
          } catch (linkError) {
            console.error('Failed to auto-link employee by name:', linkError);
          }
        }
      }
    }

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee record not found for current user',
        details: {
          user_id: user.id,
          email: user.email,
          suggestions: [
            'Contact administrator to create employee record',
            'Ensure email in employee record matches login email',
            'Check if employee record exists and is active'
          ]
        }
      });
    }

    // Return the employee data
    res.status(200).json({ 
      success: true, 
      data: employee,
      meta: {
        linked_method: employee.user_id === user.id ? 'user_id' : 'auto_linked',
        user_email: user.email
      }
    });

  } catch (error) {
    console.error('Error in /api/employees/current:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
