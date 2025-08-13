import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { lang = 'vi' } = req.query;

      // Call the helper function to get categories with proper language
      const { data, error } = await supabase
        .rpc('get_finance_category_labels');

      if (error) {
        console.error('Error fetching finance categories:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching finance categories',
          error: error.message 
        });
      }

      // Transform the data to match expected format
      const transformedData = data?.map((item: any) => ({
        value: item.value,
        label_en: item.label_en,
        label_vi: item.label_vi,
        type: item.type
      })) || [];

      res.status(200).json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      console.error('Error in finance categories API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }
}
