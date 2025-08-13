import React, { useState } from 'react';
import { Admission } from './types';
import EmailTemplateModal from '../EmailTemplateModal';

interface AdmissionsKanbanProps {
  admissions: Admission[];
  onUpdateStatus: (id: string, newStatus: string) => void;
  onAddAdmission: () => void;
}

const AdmissionsKanban: React.FC<AdmissionsKanbanProps> = ({
  admissions,
  onUpdateStatus,
  onAddAdmission
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; admission: Admission | null }>({
    isOpen: false,
    admission: null
  });

  const columns = [
    {
      id: 'zalo_consultation',
      title: 'Tư vấn',
      icon: '💬',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'trial_class_1',
      title: 'Học thử 1',
      icon: '🎯',
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'trial_class_2',
      title: 'Học thử 2',
      icon: '🎯',
      color: 'bg-indigo-50 border-indigo-200',
      headerColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'waiting_class',
      title: 'Chờ lớp',
      icon: '⏰',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'enrolled',
      title: 'Đã đăng ký',
      icon: '✅',
      color: 'bg-emerald-50 border-emerald-200',
      headerColor: 'bg-emerald-100 text-emerald-800'
    }
  ];

  const getAdmissionsByStatus = (status: string) => {
    return admissions.filter(admission => admission.status === status);
  };

  const handleDragStart = (e: React.DragEvent, admissionId: string) => {
    setDraggedItem(admissionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      onUpdateStatus(draggedItem, newStatus);
      setDraggedItem(null);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleSendEmail = async (templateId: string) => {
    if (!emailModal.admission) return;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          recipientEmail: emailModal.admission.email,
          admissionData: emailModal.admission
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Email đã được gửi thành công!');
      } else if (result.fallbackUrl) {
        // Gmail API not configured, open Gmail compose window
        const confirmOpen = confirm(
          'Gmail API chưa được cấu hình. Bạn có muốn mở Gmail để gửi email thủ công không?\n\n' +
          'Email template sẽ được điền sẵn cho bạn.'
        );
        if (confirmOpen) {
          window.open(result.fallbackUrl, '_blank');
        }
      } else {
        alert('Có lỗi khi gửi email: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Có lỗi khi gửi email');
    }
  };

  const openEmailModal = (admission: Admission) => {
    setEmailModal({ isOpen: true, admission });
  };

  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, admission: null });
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kanban Board - Hành trình Tuyển sinh</h3>
          <p className="text-sm text-gray-600">Tư vấn → Học thử 1 → Học thử 2 → Chờ lớp → Đã đăng ký</p>
        </div>
        <button
          onClick={onAddAdmission}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <span>+</span>
          Thêm khách hàng
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-2 lg:gap-4" style={{ minHeight: '600px' }}>
        {columns.map((column) => {
          const columnAdmissions = getAdmissionsByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className={`${column.color} border rounded-lg min-w-0`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`${column.headerColor} px-2 py-2 rounded-t-lg border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{column.icon}</span>
                    <h4 className="font-semibold text-xs lg:text-sm truncate">{column.title}</h4>
                  </div>
                  <span className="bg-white bg-opacity-70 text-xs px-1 py-0.5 rounded-full font-medium">
                    {columnAdmissions.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2" style={{ minHeight: '500px' }}>
                {columnAdmissions.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">
                    <div className="text-lg mb-1">{column.icon}</div>
                    <p className="text-xs">Trống</p>
                  </div>
                ) : (
                  columnAdmissions.map((admission) => (
                    <div
                      key={admission.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, admission.id)}
                      className={`bg-white rounded-md shadow-sm border p-2 cursor-move hover:shadow-md transition-shadow ${getUrgencyColor(admission.data?.urgency)}`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-1 mb-1">
                        <h5 className="font-medium text-gray-900 text-xs leading-tight truncate flex-1">
                          {admission.student_name}
                        </h5>
                        <button
                          onClick={() => {
                            const phoneNumber = admission.phone.replace(/\D/g, '');
                            window.location.href = `zalo://chat?phone=${phoneNumber}`;
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs flex-shrink-0"
                          title="Nhắn tin Zalo"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => openEmailModal(admission)}
                          className="text-red-600 hover:text-red-800 text-xs flex-shrink-0"
                          title="Gửi email"
                        >
                          ✉️
                        </button>
                      </div>

                      {/* Contact Info - Compact */}
                      {admission.parent_name && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 truncate">
                            👨‍👩‍👧‍👦 {admission.parent_name}
                          </div>
                        </div>
                      )}

                      {/* Program Interest - Compact */}
                      {admission.data?.interested_program && (
                        <div className="mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded text-xs">
                            📚 {admission.data.interested_program.substring(0, 8)}...
                          </span>
                        </div>
                      )}

                      {/* Notes - Very Compact */}
                      {admission.data?.notes && (
                        <div className="mb-2 p-1 bg-gray-50 rounded text-xs text-gray-700 line-clamp-1">
                          💬 {admission.data.notes.substring(0, 30)}...
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Hướng dẫn:</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span>Khẩn cấp</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>Trung bình</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🟢</span>
            <span>Thấp</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🖱️</span>
            <span>Kéo thả để di chuyển</span>
          </div>
        </div>
      </div>

      {/* Email Template Modal */}
      <EmailTemplateModal
        isOpen={emailModal.isOpen}
        onClose={closeEmailModal}
        admission={emailModal.admission!}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
};

export default AdmissionsKanban;
