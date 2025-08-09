import type { NextApiRequest, NextApiResponse } from 'next';
import { getStudentStats } from '../../../lib/api/students';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const stats = await getStudentStats();
        return res.status(200).json({
          success: true,
          data: stats,
          message: 'Statistics retrieved successfully'
        });

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
