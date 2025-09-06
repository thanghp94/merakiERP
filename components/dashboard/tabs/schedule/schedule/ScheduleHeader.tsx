import React, { useState } from 'react';
import { ViewMode, Session, Employee } from './types';

interface ScheduleHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  dateRangeText: string;
  teachers?: Employee[];
  sessions?: Session[];
  startDate?: string;
  endDate?: string;
}

const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  viewMode,
  setViewMode,
  currentDate,
  onNavigate,
  onToday,
  dateRangeText,
  teachers = [],
  sessions = [],
  startDate,
  endDate
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleSendEmail = async () => {
    console.log('🚀 handleSendEmail called');
    console.log('📋 Selected teacher:', selectedTeacher);
    console.log('📅 Date range:', startDate, 'to', endDate);
    
    if (!selectedTeacher) {
      console.log('❌ No teacher selected');
      alert('Please select a teacher first');
      return;
    }

    if (!startDate || !endDate) {
      console.log('❌ Missing date range');
      alert('Missing date range information');
      return;
    }

    const filteredSessions = sessions.filter(session => 
      session.teacher_id === selectedTeacher || 
      session.teaching_assistant_id === selectedTeacher
    );
    
    console.log('📚 Filtered sessions:', filteredSessions.length);

    setIsEmailSending(true);
    try {
      console.log('📤 Sending API request...');
      
      const requestData = {
        teacherId: selectedTeacher,
        startDate,
        endDate,
        sessions: filteredSessions
      };
      
      console.log('📋 Request data:', requestData);

      const response = await fetch('/api/schedule/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        console.log('✅ Email sent successfully');
        alert('Schedule email sent successfully!');
        setShowEmailModal(false);
        setSelectedTeacher('');
      } else {
        console.log('❌ Email failed:', result.message);
        alert(`Error sending email: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 Error sending email:', error);
      alert(`Error sending email: ${error.message}`);
    } finally {
      setIsEmailSending(false);
    }
  };
  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Class Schedule</h2>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'day' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'week' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Week
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="font-medium min-w-[120px] text-center">
              {dateRangeText}
            </span>
            <button
              onClick={() => onNavigate('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
          
          <button
            onClick={onToday}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Today
          </button>

          {/* Email Schedule Button */}
          {teachers.length > 0 && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              📧 Email Schedule
            </button>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Send Schedule to Teacher</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Teacher:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Choose a teacher...</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <p>Period: {dateRangeText}</p>
              <p>This will send a PDF schedule to the selected teacher's email.</p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedTeacher('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                disabled={isEmailSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!selectedTeacher || isEmailSending}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEmailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex items-center space-x-4 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>TSI (GrapeSEED)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>REP (GrapeSEED)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
