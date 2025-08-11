import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ error: error?.message || 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'student',
    };

    // Sign JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Set token in HTTP-only cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict; Secure`);

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
