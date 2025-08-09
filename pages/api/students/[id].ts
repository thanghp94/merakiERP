import type { NextApiRequest, NextApiResponse } from 'next';
import { getStudentById, updateStudent, deleteStudent } from '../../../lib/api/students';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        const student = await getStudentById(id);
        return res.status(200).json({
          success: true,
          data: student,
          message: 'Student retrieved successfully'
        });

      case 'PUT':
        const updateData = req.body;
        const updatedStudent = await updateStudent(id, updateData);
        return res.status(200).json({
          success: true,
          data: updatedStudent,
          message: 'Student updated successfully'
        });

      case 'DELETE':
        const deletedStudent = await deleteStudent(id);
        return res.status(200).json({
          success: true,
          data: deletedStudent,
          message: 'Student deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Student API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
