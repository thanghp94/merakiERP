import React from 'react';
import InvoiceDetailView from './InvoiceDetailView';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  description: string;
  notes?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  is_income: boolean;
  invoice_type: string;
  student?: { id: string; full_name: string };
  employee?: { id: string; full_name: string };
  facility?: { id: string; name: string };
  class?: { id: string; class_name: string };
  invoice_items?: Array<{
    id: string;
    item_name: string;
    item_description: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
  created_at: string;
}

interface InvoiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentConfirmed?: () => void;
}

export default function InvoiceDetailDrawer({ 
  isOpen, 
  onClose, 
  invoice, 
  onPaymentConfirmed 
}: InvoiceDetailDrawerProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-4xl">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="flex-1 py-6 px-4 sm:px-6">
                <InvoiceDetailView
                  invoice={invoice}
                  onPaymentConfirmed={onPaymentConfirmed}
                  onClose={onClose}
                  showCloseButton={true}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
