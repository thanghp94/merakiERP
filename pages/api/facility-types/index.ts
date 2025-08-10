import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Query to get enum values for loai_co_so type
      const { data, error } = await supabase
        .rpc('get_enum_values', { enum_name: 'loai_co_so' });

      if (error) {
        console.error('Error fetching facility types:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy danh sách loại cơ sở',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
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
