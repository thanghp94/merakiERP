import React from 'react';
import { InvoiceFormCompact } from './InvoiceForm/InvoiceFormCompact';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  initialData?: any;
}

export default function InvoiceModal({ isOpen, onClose, onSubmit, initialData }: InvoiceModalProps) {
  if (!isOpen) return null;

  const mode = initialData ? 'edit' : 'create';

  // Wrap onSubmit to ensure it returns a Promise
  const handleSubmit = async (data: any) => {
    await Promise.resolve(onSubmit(data));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <InvoiceFormCompact
            onSubmit={handleSubmit}
            onCancel={onClose}
            initialData={initialData}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}
