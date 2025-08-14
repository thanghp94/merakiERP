import React, { useState } from 'react';
import { Admission } from './shared/types';
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
      color: 'bg-teal-50 border-teal-200',
      headerColor: 'bg-teal-100 text-teal-800'
    },
    {
      id: 'trial_class_1',
      title: 'Học thử 1',
      icon: '🎯',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'trial_class_2',
      title: 'Học thử 2',
      icon: '🎯',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'waiting_class',
      title: 'Chờ lớp',
      icon: '⏰',
      color: 'bg-teal-50 border-teal-200',
      headerColor: 'bg-teal-100 text-teal-800'
    },
    {
      id: 'enrolled',
      title: 'Đã đăng ký',
      icon: '✅',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100 text-green-800'
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
      case 'medium': return 'border-l-4 border-orange-500';
      case 'low': return 'border-l-4 border-teal-500';
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
                          className="text-teal-600 hover:text-teal-700 text-xs flex-shrink-0 p-1 rounded hover:bg-teal-50 transition-colors"
                          title="Nhắn tin Zalo"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => openEmailModal(admission)}
                          className="text-orange-600 hover:text-orange-700 text-xs flex-shrink-0 p-1 rounded hover:bg-orange-50 transition-colors"
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
                          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                            📚 {admission.data.interested_program.substring(0, 8)}...
                          </span>
                        </div>
                      )}

                      {/* Notes - Very Compact */}
                      {admission.data?.notes && (
                        <div className="mb-2 p-2 bg-gray-50 rounded-md text-xs text-gray-700 line-clamp-2">
                          💬 {admission.data.notes.substring(0, 40)}...
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
      <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-teal-50 rounded-lg border border-orange-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Hướng dẫn sử dụng:</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>Khẩn cấp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span>Trung bình</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
            <span>Thấp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🖱️</span>
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
