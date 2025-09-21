import React from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ROLES } from '../lib/auth/client-auth';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Quản trị viên';
      case ROLES.TEACHER:
        return 'Giáo viên';
      case ROLES.TA:
        return 'Trợ giảng';
      case ROLES.STUDENT:
        return 'Học sinh';
      default:
        return 'Người dùng';
    }
  };

  const getAccessibleFeatures = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return [
          { name: 'Quản lý học sinh', description: 'Thêm, sửa, xóa học sinh', icon: '👥' },
          { name: 'Quản lý giáo viên', description: 'Quản lý thông tin giáo viên', icon: '👨‍🏫' },
          { name: 'Quản lý lớp học', description: 'Tạo và quản lý lớp học', icon: '🏫' },
          { name: 'Quản lý tài chính', description: 'Theo dõi thu chi', icon: '💰' },
          { name: 'Báo cáo hệ thống', description: 'Xem báo cáo tổng quan', icon: '📊' },
          { name: 'Cài đặt hệ thống', description: 'Cấu hình hệ thống', icon: '⚙️' }
        ];
      case ROLES.TEACHER:
        return [
          { name: 'Xem học sinh', description: 'Xem danh sách học sinh', icon: '👥' },
          { name: 'Quản lý buổi học', description: 'Tạo và quản lý buổi học', icon: '📚' },
          { name: 'Điểm danh', description: 'Điểm danh học sinh', icon: '✅' },
          { name: 'Đánh giá học sinh', description: 'Nhập điểm và nhận xét', icon: '📝' },
          { name: 'Lịch dạy', description: 'Xem lịch dạy cá nhân', icon: '📅' }
        ];
      case ROLES.TA:
        return [
          { name: 'Hỗ trợ buổi học', description: 'Hỗ trợ giáo viên trong buổi học', icon: '🤝' },
          { name: 'Điểm danh', description: 'Hỗ trợ điểm danh học sinh', icon: '✅' },
          { name: 'Xem lịch hỗ trợ', description: 'Xem lịch hỗ trợ', icon: '📅' }
        ];
      case ROLES.STUDENT:
        return [
          { name: 'Xem lịch học', description: 'Xem lịch học cá nhân', icon: '📅' },
          { name: 'Xem điểm số', description: 'Xem kết quả học tập', icon: '📊' },
          { name: 'Thông tin cá nhân', description: 'Cập nhật thông tin', icon: '👤' }
        ];
      default:
        return [];
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - MerakiERP</title>
        <meta name="description" content="Dashboard quản lý trung tâm" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  MerakiERP Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplayName(user?.user_metadata?.role || 'student')}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Chào mừng, {user?.user_metadata?.full_name || user?.email}!
                </h2>
                <p className="text-sm text-gray-600">
                  Bạn đang đăng nhập với vai trò: <span className="font-medium text-blue-600">
                    {getRoleDisplayName(user?.user_metadata?.role || 'student')}
                  </span>
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Chức năng có thể truy cập
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAccessibleFeatures(user?.user_metadata?.role || 'student').map((feature, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{feature.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {feature.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Thao tác nhanh
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    📊 Xem thống kê
                  </button>
                  
                  {(user?.user_metadata?.role === ROLES.ADMIN || user?.user_metadata?.role === ROLES.TEACHER) && (
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      👥 Quản lý học sinh
                    </button>
                  )}
                  
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    📅 Xem lịch
                  </button>
                  
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    ⚙️ Cài đặt
                  </button>
                </div>
              </div>
            </div>

            {/* Debug Info (for development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Debug Information (Development Only)
                </h4>
                <pre className="text-xs text-yellow-700 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
