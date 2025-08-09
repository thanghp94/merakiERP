import type { NextApiRequest, NextApiResponse } from 'next';
import { createStudent, getStudents } from '../../../lib/api/students';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const filters = {
          status: req.query.status as string,
          level: req.query.level as string,
          search: req.query.search as string,
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        const students = await getStudents(filters);
        return res.status(200).json({
          success: true,
          data: students,
          message: 'Students retrieved successfully'
        });

      case 'POST':
        const studentData = req.body;
        
        // Basic validation
        if (!studentData.full_name || !studentData.data?.parent?.name || !studentData.data?.parent?.phone) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: full_name, parent name, and parent phone are required'
          });
        }

        const newStudent = await createStudent(studentData);
        return res.status(201).json({
          success: true,
          data: newStudent,
          message: 'Student created successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Students API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
