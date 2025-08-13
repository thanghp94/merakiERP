import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('admissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching admission:', error);
        return res.status(500).json({ error: error.message });
      }

      if (!data) {
        return res.status(404).json({ error: 'Admission not found' });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        student_name,
        phone,
        email,
        parent_name,
        location,
        status,
        data: additionalData
      } = req.body;

      const { data, error } = await supabase
        .from('admissions')
        .update({
          student_name,
          phone,
          email,
          parent_name,
          location,
          status,
          data: additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating admission:', error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('admissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting admission:', error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ message: 'Admission deleted successfully' });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
