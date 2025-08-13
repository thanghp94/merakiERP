import React, { useState, useEffect } from 'react';

interface ClassCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionInfo?: {
    lessonName: string;
    time: string;
    className: string;
    teacherName: string;
  };
}

interface CheckInData {
  class_start_time?: string;
  class_end_time?: string;
  is_completed?: boolean;
  staff_confirmed?: boolean;
  staff_confirmed_at?: string;
  teacher_start_time?: string;
  teacher_end_time?: string;
  staff_start_time?: string;
  staff_end_time?: string;
  times_match?: boolean;
  teaching_duration_minutes?: number;
  teaching_duration_hours?: number;
  final_time_source?: string;
}

const ClassCheckInModal: React.FC<ClassCheckInModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionInfo
}) => {
  const [checkInData, setCheckInData] = useState<CheckInData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classStartTime, setClassStartTime] = useState('');
  const [classEndTime, setClassEndTime] = useState('');

  useEffect(() => {
    if (isOpen && sessionId) {
      // Reset state when opening modal for a new session
      setCheckInData({});
      setClassStartTime('');
      setClassEndTime('');
      setIsLoading(false);
      setIsSaving(false);
      
      fetchExistingCheckIn();
      initializeTimesFromSession();
    }
  }, [isOpen, sessionId]);

  const initializeTimesFromSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Extract scheduled times and format them for datetime-local input
        const startTime = new Date(result.data.start_time);
        const endTime = new Date(result.data.end_time);
        
        // Format to YYYY-MM-DDTHH:MM for datetime-local input
        const formatForInput = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setClassStartTime(formatForInput(startTime));
        setClassEndTime(formatForInput(endTime));
      }
    } catch (error) {
      console.error('Error initializing times:', error);
    }
  };

  const fetchExistingCheckIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const result = await response.json();
      
      if (result.success && result.data?.data?.teacher_checkin) {
        const existingData = result.data.data.teacher_checkin;
        setCheckInData(existingData);
        
        // If there's existing data, populate the form fields
        if (existingData.class_start_time) {
          const startDate = new Date(existingData.class_start_time);
          const formatForInput = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };
          setClassStartTime(formatForInput(startDate));
        }
        
        if (existingData.class_end_time) {
          const endDate = new Date(existingData.class_end_time);
          const formatForInput = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };
          setClassEndTime(formatForInput(endDate));
        }
      }
    } catch (error) {
      console.error('Error fetching existing check-in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherCheckIn = async () => {
    if (!classStartTime || !classEndTime) {
      alert('Please enter both start and end times!');
      return;
    }

    setIsSaving(true);
    try {
      // First fetch the current session data to preserve existing data
      const fetchResponse = await fetch(`/api/sessions/${sessionId}`);
      const fetchResult = await fetchResponse.json();
      
      let existingData = {};
      if (fetchResult.success && fetchResult.data?.data) {
        existingData = fetchResult.data.data;
      }

      // Convert datetime-local format to ISO string
      const startTimeISO = new Date(classStartTime).toISOString();
      const endTimeISO = new Date(classEndTime).toISOString();

      // Merge existing data with new teacher check-in data
      const updatedData = {
        ...existingData,
        teacher_checkin: {
          class_start_time: startTimeISO,
          class_end_time: endTimeISO,
          is_completed: true,
          staff_confirmed: false // Teacher checked in, staff hasn't confirmed yet
        }
      };

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCheckInData({
          class_start_time: startTimeISO,
          class_end_time: endTimeISO,
          is_completed: true,
          staff_confirmed: false
        });
        alert('Teacher check-in successful!');
      } else {
        alert(`Error saving teacher check-in: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving teacher check-in:', error);
      alert('Error occurred while saving teacher check-in!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStaffConfirm = async () => {
    if (!classStartTime || !classEndTime) {
      alert('Please enter both start and end times!');
      return;
    }

    setIsSaving(true);
    try {
      // First fetch the current session data to preserve existing data
      const fetchResponse = await fetch(`/api/sessions/${sessionId}`);
      const fetchResult = await fetchResponse.json();
      
      let existingData = {};
      if (fetchResult.success && fetchResult.data?.data) {
        existingData = fetchResult.data.data;
      }

      // Convert datetime-local format to ISO string
      const staffStartTimeISO = new Date(classStartTime).toISOString();
      const staffEndTimeISO = new Date(classEndTime).toISOString();

      // Get teacher's original times
      const teacherStartTime = checkInData.class_start_time;
      const teacherEndTime = checkInData.class_end_time;

      // Compare times and determine final times
      const finalStartTime = staffStartTimeISO;
      const finalEndTime = staffEndTimeISO;
      
      // Check if times match
      const timesMatch = (teacherStartTime === staffStartTimeISO) && (teacherEndTime === staffEndTimeISO);
      
      // Calculate teaching duration in minutes
      const startTime = new Date(finalStartTime);
      const endTime = new Date(finalEndTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      const durationHours = Math.round((durationMinutes / 60) * 100) / 100; // Round to 2 decimal places

      // Merge existing data with staff confirmation and duration calculation
      const updatedData = {
        ...existingData,
        teacher_checkin: {
          ...checkInData,
          // Keep original teacher times for reference
          teacher_start_time: teacherStartTime,
          teacher_end_time: teacherEndTime,
          // Final confirmed times (staff takes precedence)
          class_start_time: finalStartTime,
          class_end_time: finalEndTime,
          // Staff confirmation details
          staff_start_time: staffStartTimeISO,
          staff_end_time: staffEndTimeISO,
          staff_confirmed: true,
          staff_confirmed_at: new Date().toISOString(),
          is_completed: true,
          // Time comparison and duration
          times_match: timesMatch,
          teaching_duration_minutes: durationMinutes,
          teaching_duration_hours: durationHours,
          // Note about final times
          final_time_source: timesMatch ? 'both_agree' : 'staff_override'
        }
      };

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCheckInData(prev => ({
          ...prev,
          teacher_start_time: teacherStartTime,
          teacher_end_time: teacherEndTime,
          class_start_time: finalStartTime,
          class_end_time: finalEndTime,
          staff_start_time: staffStartTimeISO,
          staff_end_time: staffEndTimeISO,
          staff_confirmed: true,
          staff_confirmed_at: new Date().toISOString(),
          is_completed: true,
          times_match: timesMatch,
          teaching_duration_minutes: durationMinutes,
          teaching_duration_hours: durationHours,
          final_time_source: timesMatch ? 'both_agree' : 'staff_override'
        }));
        
        const message = timesMatch 
          ? `Staff confirmation successful! Times match. Teaching duration: ${durationHours} hours (${durationMinutes} minutes)`
          : `Staff confirmation successful! Times differ - staff times used as final. Teaching duration: ${durationHours} hours (${durationMinutes} minutes)`;
        
        alert(message);
        onClose();
      } else {
        alert(`Error saving staff confirmation: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving staff confirmation:', error);
      alert('Error occurred while saving staff confirmation!');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🕐</span>
              Class Time Management
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="bg-gray-50 p-3 border-b">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{sessionInfo.className}</span> - {sessionInfo.lessonName}
            </p>
            <p className="text-sm text-gray-600">
              Scheduled Time: {sessionInfo.time}
            </p>
            <p className="text-sm text-gray-600">
              Teacher: <span className="font-medium">{sessionInfo.teacherName}</span>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Teacher Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-green-800">Teacher Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    checkInData.is_completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {checkInData.is_completed ? 'Checked In' : 'Not Checked In'}
                  </span>
                </div>

                {checkInData.is_completed && checkInData.class_start_time && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Recorded Start Time:</span>
                      <span className="text-gray-700 font-mono">
                        {formatDateTime(checkInData.class_start_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Recorded End Time:</span>
                      <span className="text-gray-700 font-mono">
                        {formatDateTime(checkInData.class_end_time || '')}
                      </span>
                    </div>
                  </div>
                )}

                {!checkInData.is_completed && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={classStartTime}
                        onChange={(e) => setClassStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher End Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={classEndTime}
                        onChange={(e) => setClassEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleTeacherCheckIn}
                      disabled={isSaving || !classStartTime || !classEndTime}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Checking In...' : 'Check In (Teacher)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Staff Section */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-blue-800">Staff Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    checkInData.staff_confirmed 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {checkInData.staff_confirmed ? 'Confirmed' : 'Pending Confirmation'}
                  </span>
                </div>

                {checkInData.is_completed ? (
                  checkInData.staff_confirmed ? (
                    /* Staff has confirmed - show final results */
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-800 mb-2">Final Session Times</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Start Time:</span>
                            <span className="font-mono">{formatDateTime(checkInData.class_start_time || '')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">End Time:</span>
                            <span className="font-mono">{formatDateTime(checkInData.class_end_time || '')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Teaching Duration:</span>
                            <span className="font-semibold text-green-600">
                              {checkInData.teaching_duration_hours || 0}h ({checkInData.teaching_duration_minutes || 0}min)
                            </span>
                          </div>
                        </div>
                      </div>

                      {checkInData.times_match !== undefined && (
                        <div className={`p-3 rounded border ${
                          checkInData.times_match 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {checkInData.times_match ? '✅' : '⚠️'}
                            </span>
                            <span className="text-sm font-medium">
                              {checkInData.times_match 
                                ? 'Teacher and staff times match' 
                                : 'Times differ - staff times used as final'}
                            </span>
                          </div>
                          {!checkInData.times_match && (
                            <div className="mt-2 text-xs text-gray-600">
                              <div>Teacher: {formatDateTime(checkInData.teacher_start_time || '')} - {formatDateTime(checkInData.teacher_end_time || '')}</div>
                              <div>Staff: {formatDateTime(checkInData.staff_start_time || '')} - {formatDateTime(checkInData.staff_end_time || '')}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {checkInData.staff_confirmed_at && (
                        <div className="text-xs text-gray-500">
                          Confirmed at: {formatDateTime(checkInData.staff_confirmed_at)}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Staff needs to confirm - show editable inputs */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff Start Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={classStartTime}
                          onChange={(e) => setClassStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Staff End Time *
                        </label>
                        <input
                          type="datetime-local"
                          value={classEndTime}
                          onChange={(e) => setClassEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleStaffConfirm}
                        disabled={isSaving || !classStartTime || !classEndTime}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Confirming...' : 'Confirm Times (Staff)'}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">
                      Teacher must check in first before staff can confirm times.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isSaving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassCheckInModal;
