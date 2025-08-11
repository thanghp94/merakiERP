import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
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

  useEffect(() => {
    // Check for token in cookies
    const token = getCookie('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        });
      } catch (err) {
        console.error('Invalid token:', err);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token } = response.data;
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=3600; secure; samesite=strict;`;
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        });
        setLoading(false);
        return { error: null };
      } else {
        setLoading(false);
        return { error: 'No token received' };
      }
    } catch (error: any) {
      setLoading(false);
      return { error: error.response?.data?.error || 'Login failed' };
    }
  };

  const signOut = () => {
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Helper function to get cookie by name
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}
