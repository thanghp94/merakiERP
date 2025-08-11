import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 text-red-500 mb-4">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>

          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Tài khoản hiện tại:</strong> {user.email}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Vai trò:</strong> {user.user_metadata?.role || 'Chưa xác định'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Quay lại trang trước
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🏠 Về trang chủ
          </button>

          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            🚪 Đăng xuất
          </button>
        </div>

        <div className="text-sm text-gray-500">
          <p>Cần hỗ trợ? Liên hệ quản trị viên hệ thống</p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
