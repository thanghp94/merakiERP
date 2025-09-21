import { NextApiRequest, NextApiResponse } from 'next';

// Static facility types data for Firebase version
const facilityTypes = [
  { value: 'Meraki', label: 'Meraki' },
  { value: 'Trường đối tác', label: 'Trường đối tác' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      return res.status(200).json({
        success: true,
        data: facilityTypes,
        message: 'Lấy danh sách loại cơ sở thành công'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không xác định',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }
}
