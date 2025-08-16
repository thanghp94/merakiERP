import React, { useState, useEffect } from 'react';

interface TeacherFeedbackModalProps {
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

interface FeedbackData {
  greeting_and_conclusion: number;
  class_management: number;
  classroom_management: number;
  lesson_plan_usage: number;
  lesson_plan_expansion: number;
  student_guidance: number;
  general_feedback: string;
}

const TeacherFeedbackModal: React.FC<TeacherFeedbackModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionInfo
}) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    greeting_and_conclusion: 0,
    class_management: 0,
    classroom_management: 0,
    lesson_plan_usage: 0,
    lesson_plan_expansion: 0,
    student_guidance: 0,
    general_feedback: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchExistingFeedback();
    }
  }, [isOpen, sessionId]);

  const fetchExistingFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const result = await response.json();
      
      if (result.success && result.data?.data?.teacher_feedback) {
        setFeedback(result.data.data.teacher_feedback);
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (criterion: keyof FeedbackData, rating: number) => {
    setFeedback(prev => ({
      ...prev,
      [criterion]: rating
    }));
  };

  const handleGeneralFeedbackChange = (value: string) => {
    setFeedback(prev => ({
      ...prev,
      general_feedback: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First fetch the current session data to preserve existing data
      const fetchResponse = await fetch(`/api/sessions/${sessionId}`);
      const fetchResult = await fetchResponse.json();
      
      let existingData = {};
      if (fetchResult.success && fetchResult.data?.data) {
        existingData = fetchResult.data.data;
      }

      // Merge existing data with new teacher feedback
      const updatedData = {
        ...existingData,
        teacher_feedback: feedback
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
        alert('Nhận xét đã được lưu thành công!');
        onClose();
      } else {
        alert(`Lỗi khi lưu nhận xét: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Có lỗi xảy ra khi lưu nhận xét!');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRatingScale = (
    label: string,
    criterion: keyof FeedbackData,
    currentValue: number
  ) => {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex-1">
            {label}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(criterion, rating)}
                className={`w-10 h-10 border-2 text-sm font-medium transition-colors ${
                  currentValue === rating
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-300'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Nhận xét giáo viên</h2>
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
              <span className="font-medium">{sessionInfo.className}</span> - {sessionInfo.lessonName} ({sessionInfo.time})
            </p>
            <p className="text-sm text-gray-600">
              Giáo viên: <span className="font-medium">{sessionInfo.teacherName}</span>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {renderRatingScale(
                'Chào đón và kết thúc',
                'greeting_and_conclusion',
                feedback.greeting_and_conclusion
              )}

              {renderRatingScale(
                'Năng lượng lớp học',
                'class_management',
                feedback.class_management
              )}

              {renderRatingScale(
                'Quản lý lớp học',
                'classroom_management',
                feedback.classroom_management
              )}

              {renderRatingScale(
                'Dạy đúng lesson plan',
                'lesson_plan_usage',
                feedback.lesson_plan_usage
              )}

              {renderRatingScale(
                'Mở rộng câu hỏi ngoài lesson plan',
                'lesson_plan_expansion',
                feedback.lesson_plan_expansion
              )}

              {renderRatingScale(
                'Hướng dẫn học sinh nói full câu',
                'student_guidance',
                feedback.student_guidance
              )}

              {/* General Feedback */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét chung
                </label>
                <textarea
                  value={feedback.general_feedback}
                  onChange={(e) => handleGeneralFeedbackChange(e.target.value)}
                  placeholder="Tốt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isSaving}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu nhận xét'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeedbackModal;
