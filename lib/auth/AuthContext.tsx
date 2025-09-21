import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  IdTokenResult
} from 'firebase/auth';
import { auth } from '../firebase';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    role: string;
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  getAuthHeaders: () => { [key: string]: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get the ID token with custom claims (roles)
          const tokenResult: IdTokenResult = await firebaseUser.getIdTokenResult();
          const token = await firebaseUser.getIdToken();
          
          setIdToken(token);
          
          const role = tokenResult.claims.role || 'student'; // Default role
          const full_name = tokenResult.claims.full_name || firebaseUser.displayName || '';
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            user_metadata: {
              role: role as string,
              full_name: full_name as string,
            },
          });
        } catch (error) {
          console.error('Error getting user token:', error);
          setUser(null);
          setIdToken(null);
        }
      } else {
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (firebaseUser) {
        // Get the ID token with custom claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        const token = await firebaseUser.getIdToken();
        
        setIdToken(token);
        
        const role = tokenResult.claims.role || 'student';
        const full_name = tokenResult.claims.full_name || firebaseUser.displayName || '';
        
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          user_metadata: {
            role: role as string,
            full_name: full_name as string,
          },
        });
        setLoading(false);
        return { error: null };
      } else {
        setLoading(false);
        return { error: 'No user returned from authentication' };
      }
    } catch (error: any) {
      setLoading(false);
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
      
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIdToken(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAuthHeaders = (): { [key: string]: string } => {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    
    return headers;
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};