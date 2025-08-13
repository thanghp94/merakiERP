import React, { useState } from 'react';
import { emailTemplates, EmailTemplate, getTemplatesByCategory } from '../lib/email-templates';
import { Admission } from './dashboard/shared/types';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: Admission;
  onSendEmail: (templateId: string) => void;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  isOpen,
  onClose,
  admission,
  onSendEmail
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('inquiry');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'inquiry', name: 'Khách hàng mới', icon: '👋' },
    { id: 'consultation', name: 'Sau tư vấn', icon: '💬' },
    { id: 'trial', name: 'Mời học thử', icon: '🎯' },
    { id: 'enrollment', name: 'Đăng ký thành công', icon: '🎉' },
    { id: 'follow_up', name: 'Theo dõi', icon: '📞' }
  ];

  const filteredTemplates = getTemplatesByCategory(selectedCategory as any);

  const handleSendEmail = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      await onSendEmail(selectedTemplate.id);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviewData = () => ({
    customerName: admission.parent_name || admission.student_name,
    studentName: admission.student_name,
    phone: admission.phone,
    interestedProgram: admission.data?.interested_program,
    budget: admission.data?.budget,
    consultantName: 'Tư vấn viên Meraki'
  });

  const renderPreview = (template: EmailTemplate) => {
    const data = getPreviewData();
    let preview = template.body;
    
    // Simple preview rendering
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, (data as any)[key] || '');
    });
    
    // Handle conditional blocks for preview
    preview = preview.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return (data as any)[variable] ? content : '';
    });

    return preview.substring(0, 200) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gửi Email</h2>
            <p className="text-sm text-gray-600">
              Gửi đến: {admission.student_name} ({admission.email || 'Chưa có email'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Categories Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Loại email</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTemplate(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Templates List */}
          <div className="w-80 border-r p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">Mẫu email</h3>
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {template.subject}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {renderPreview(template)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedTemplate ? (
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Xem trước</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">Tiêu đề:</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedTemplate.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nội dung:</label>
                    <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {renderPreview(selectedTemplate)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📧</div>
                  <p>Chọn một mẫu email để xem trước</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {!admission.email && (
              <span className="text-red-600">⚠️ Khách hàng chưa có email</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!selectedTemplate || !admission.email || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Gửi Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateModal;
