import React from 'react';

interface Invoice {
  student?: {
    id: string;
    full_name: string;
  };
  employee?: {
    id: string;
    full_name: string;
  };
  facility?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    class_name: string;
  };
}

interface InvoiceEntityDisplayProps {
  invoice: Invoice;
}

export default function InvoiceEntityDisplay({ invoice }: InvoiceEntityDisplayProps) {
  if (invoice.student) {
    return (
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xs">👨‍🎓</span>
          </div>
        </div>
        <div className="ml-2">
          <div className="text-sm font-medium text-gray-900">
            {invoice.student.full_name}
          </div>
        </div>
      </div>
    );
  }

  if (invoice.employee) {
    return (
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-xs">👨‍💼</span>
          </div>
        </div>
        <div className="ml-2">
          <div className="text-sm font-medium text-gray-900">
            {invoice.employee.full_name}
          </div>
        </div>
      </div>
    );
  }

  if (invoice.facility) {
    return (
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 text-xs">🏢</span>
          </div>
        </div>
        <div className="ml-2">
          <div className="text-sm font-medium text-gray-900">
            {invoice.facility.name}
          </div>
        </div>
      </div>
    );
  }

  if (invoice.class) {
    return (
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-xs">🏫</span>
          </div>
        </div>
        <div className="ml-2">
          <div className="text-sm font-medium text-gray-900">
            {invoice.class.class_name}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-sm text-gray-500">-</div>;
}
