import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admissions:', error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        student_name,
        phone,
        email,
        parent_name,
        location,
        status = 'pending',
        data: additionalData
      } = req.body;

      const { data, error } = await supabase
        .from('admissions')
        .insert([
          {
            student_name,
            phone,
            email,
            parent_name,
            location,
            status,
            data: additionalData,
            application_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating admission:', error);
        return res.status(500).json({ error: error.message });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
