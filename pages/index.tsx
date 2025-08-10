import Head from 'next/head';
import StudentEnrollmentForm from '../components/StudentEnrollmentForm';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  const handleEnrollmentSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const labels = {
    vi: {
      title: 'Hệ Thống ERP Trung Tâm Tiếng Anh',
      subtitle: 'Hệ Thống Quản Lý Đăng Ký Học Viên',
      success: 'Đăng ký học viên thành công!',
      quickAccess: {
        title: 'Truy Cập Nhanh',
        classSchedule: 'Lịch Học',
        classScheduleDesc: 'Xem và quản lý lịch học các lớp'
      },
      stats: {
        title: 'Thống Kê Nhanh',
        totalStudents: 'Tổng Số Học Viên',
        activeClasses: 'Lớp Học Đang Hoạt Động',
        todayEnrollments: 'Đăng Ký Hôm Nay'
      }
    },
    en: {
      title: 'English Language Center ERP',
      subtitle: 'Student Enrollment Management System',
      success: 'Student enrolled successfully!',
      quickAccess: {
        title: 'Quick Access',
        classSchedule: 'Class Schedule',
        classScheduleDesc: 'View and manage class schedules'
      },
      stats: {
        title: 'Quick Stats',
        totalStudents: 'Total Students',
        activeClasses: 'Active Classes',
        todayEnrollments: 'Today\'s Enrollments'
      }
    }
  };

  const currentLabels = labels[language];

  return (
    <>
      <Head>
        <title>Meraki ERP - Trung Tâm Tiếng Anh</title>
        <meta name="description" content="Hệ thống đăng ký học viên" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {currentLabels.title}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`px-3 py-1 rounded text-sm ${
                    language === 'vi' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-sm ${
                    language === 'en' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <p className="text-lg text-gray-600">
              {currentLabels.subtitle}
            </p>
          </div>

          {showSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {currentLabels.success}
            </div>
          )}

          {/* Quick Access Section */}
          <div className="mb-8">
            <div className="card">
              <h3 className="text-lg font-medium mb-4">{currentLabels.quickAccess.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/schedule" className="group">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                          {currentLabels.quickAccess.classSchedule}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {currentLabels.quickAccess.classScheduleDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card">
                <StudentEnrollmentForm 
                  onSuccess={handleEnrollmentSuccess} 
                  language={language}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-medium mb-4">{currentLabels.stats.title}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{currentLabels.stats.totalStudents}</p>
                    <p className="text-2xl font-bold text-primary-600">--</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{currentLabels.stats.activeClasses}</p>
                    <p className="text-2xl font-bold text-primary-600">--</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{currentLabels.stats.todayEnrollments}</p>
                    <p className="text-2xl font-bold text-primary-600">--</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
