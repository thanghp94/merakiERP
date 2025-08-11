import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth/AuthContext';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MerakiERP
          </h1>
          <p className="text-gray-600">
            Hệ thống quản lý trung tâm giáo dục
          </p>
        </div>
        
        <LoginForm 
          onSuccess={() => router.push('/dashboard')}
        />
      </div>
    </div>
  );
};

export default LoginPage;
