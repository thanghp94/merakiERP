import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface ForeignTeacher {
  id: string;
  name: string;
  nationality: string;
  contact: string;
  status: 'active' | 'inactive' | 'on_leave';
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // In a real implementation, you would query the database
        // For now, return mock data
        const mockForeignTeachers: ForeignTeacher[] = [
          {
            id: '1',
            name: 'John Smith',
            nationality: 'United States',
            contact: '+1-555-0123',
            status: 'active',
            email: 'john.smith@example.com',
            phone: '+1-555-0123',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            nationality: 'United Kingdom',
            contact: '+44-20-7946-0958',
            status: 'active',
            email: 'sarah.johnson@example.com',
            phone: '+44-20-7946-0958',
            created_at: '2024-02-20T00:00:00Z',
            updated_at: '2024-02-20T00:00:00Z'
          },
          {
            id: '3',
            name: 'Michael Chen',
            nationality: 'Canada',
            contact: '+1-416-555-7890',
            status: 'on_leave',
            email: 'michael.chen@example.com',
            phone: '+1-416-555-7890',
            created_at: '2024-03-10T00:00:00Z',
            updated_at: '2024-03-10T00:00:00Z'
          },
          {
            id: '4',
            name: 'Emma Wilson',
            nationality: 'Australia',
            contact: '+61-2-5550-1234',
            status: 'inactive',
            email: 'emma.wilson@example.com',
            phone: '+61-2-5550-1234',
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-05T00:00:00Z'
          }
        ];

        res.status(200).json({
          success: true,
          data: mockForeignTeachers,
          message: 'Foreign teachers retrieved successfully'
        });
      } catch (error) {
        console.error('Error fetching foreign teachers:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch foreign teachers'
        });
      }
      break;

    case 'POST':
      try {
        const { name, nationality, contact, status, email, phone } = req.body;

        // Validate required fields
        if (!name || !nationality || !contact || !status) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, nationality, contact, status'
          });
        }

        // In a real implementation, you would insert into the database
        const newForeignTeacher: ForeignTeacher = {
          id: Date.now().toString(), // Simple ID generation for demo
          name,
          nationality,
          contact,
          status,
          email,
          phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        res.status(201).json({
          success: true,
          data: newForeignTeacher,
          message: 'Foreign teacher created successfully'
        });
      } catch (error) {
        console.error('Error creating foreign teacher:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create foreign teacher'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        success: false,
        message: `Method ${method} not allowed`
      });
  }
}
