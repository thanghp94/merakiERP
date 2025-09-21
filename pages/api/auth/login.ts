import { NextApiRequest, NextApiResponse } from 'next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    // Get the Firebase ID token
    const token = await user.getIdToken();
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.uid,
        email: user.email,
        role: 'student' // Default role, should be set via custom claims
      },
      message: 'Login successful'
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed';
    
    // Handle specific Firebase auth errors
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'User not found';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Account has been disabled';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later';
        break;
      default:
        errorMessage = error.message || 'Login failed';
    }
    
    return res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
}
