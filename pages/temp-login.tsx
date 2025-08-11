import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const TempLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@merakierp.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('Attempting login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setMessage(`Login failed: ${error.message}`);
        
        if (error.message.includes('Email not confirmed')) {
          setMessage('Email confirmation required. Please disable email confirmation in Supabase Dashboard: Authentication → Settings → Turn OFF "Enable email confirmations"');
        }
      } else {
        console.log('Login successful:', data);
        setMessage('Login successful! Redirecting...');
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage(`Unexpected error: ${err}`);
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('Creating admin user...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Admin User',
            role: 'admin'
          }
        }
      });

      if (error) {
        setMessage(`Signup failed: ${error.message}`);
      } else {
        setMessage('Admin user created! Now try logging in.');
      }
    } catch (err) {
      setMessage(`Signup error: ${err}`);
    }

    setLoading(false);
  };

  const testConnection = async () => {
    setMessage('Testing connection...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setMessage(`Connection error: ${error.message}`);
      } else {
        setMessage(`Connection OK. Current session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err) {
      setMessage(`Connection test failed: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Temporary Login Page
          </h1>
          <p className="text-gray-600">
            Debug login issues
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Create Admin User
            </button>

            <button
              type="button"
              onClick={testConnection}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test Connection
            </button>
          </div>
        </form>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('successful') || message.includes('OK') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message}</p>
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>Go to: <code>http://localhost:3000/temp-login</code></p>
          <p>After successful login, you'll be redirected to dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default TempLogin;
