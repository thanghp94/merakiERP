import React, { useState, useEffect } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

interface InvoiceItem {
  id: string;
  item_name: string;
  item_description: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
  created_at: string;
}

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
  invoice_items?: InvoiceItem[];
  created_at: string;
}

interface PaymentFormData {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  notes: string;
}

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onPaymentConfirmed?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export default function InvoiceDetailView({ 
  invoice, 
  onPaymentConfirmed, 
  onClose,
  showCloseButton = false,
  className = ""
}: InvoiceDetailViewProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: invoice.remaining_amount || 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadPaymentMethods();
    loadPayments();
  }, [invoice.id]);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data || []);
      } else {
        setPaymentMethods([
          { value: 'cash', label_vi: 'Tiền mặt' },
          { value: 'bank_transfer', label_vi: 'Chuyển khoản' },
          { value: 'credit_card', label_vi: 'Thẻ tín dụng' },
          { value: 'online_payment', label_vi: 'Thanh toán online' }
        ]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([
        { value: 'cash', label_vi: 'Tiền mặt' },
        { value: 'bank_transfer', label_vi: 'Chuyển khoản' }
      ]);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentFormData.amount,
          payment_method: paymentFormData.payment_method,
          payment_date: paymentFormData.payment_date,
          reference_number: paymentFormData.reference_number,
          notes: paymentFormData.notes
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowPaymentForm(false);
        setPaymentFormData({
          amount: Math.max(0, invoice.remaining_amount - paymentFormData.amount),
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          notes: ''
        });
        loadPayments();
        onPaymentConfirmed?.();
      } else {
        alert('Lỗi khi xác nhận thanh toán: ' + result.message);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Lỗi khi xác nhận thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { label: 'Nháp', variant: 'secondary' as const },
      'sent': { label: 'Đã gửi', variant: 'info' as const },
      'partial': { label: 'Thanh toán một phần', variant: 'warning' as const },
      'paid': { label: 'Đã thanh toán', variant: 'success' as const },
      'overdue': { label: 'Quá hạn', variant: 'error' as const },
      'cancelled': { label: 'Đã hủy', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h2>
          <p className="text-gray-600">{invoice.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(invoice.status)}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoice.total_amount)}
            </div>
            <div className="text-sm text-gray-500">
              {invoice.is_income ? 'Thu' : 'Chi'}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Thông tin hóa đơn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
              <p className="text-gray-900">{formatDate(invoice.invoice_date)}</p>
            </div>
            {invoice.due_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Hạn thanh toán</label>
                <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
            )}
            {invoice.student && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Học sinh</label>
                <p className="text-gray-900">{invoice.student.full_name}</p>
              </div>
            )}
            {invoice.employee && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nhân viên</label>
                <p className="text-gray-900">{invoice.employee.full_name}</p>
              </div>
            )}
            {invoice.facility && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Cơ sở</label>
                <p className="text-gray-900">{invoice.facility.name}</p>
              </div>
            )}
            {invoice.class && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Lớp học</label>
                <p className="text-gray-900">{invoice.class.class_name}</p>
              </div>
            )}
          </div>
          {invoice.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <p className="text-gray-900">{invoice.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Invoice Items */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Chi tiết các khoản</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên khoản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SL
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(invoice.invoice_items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        {item.item_description && (
                          <div className="text-sm text-gray-500">{item.item_description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Thuế VAT ({invoice.tax_rate}%):</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Status */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Trạng thái thanh toán</h3>
            {invoice.remaining_amount > 0 && (
              <Button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                variant="primary"
                size="sm"
              >
                {showPaymentForm ? 'Hủy' : 'Xác nhận thanh toán'}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Tổng hóa đơn</div>
              <div className="text-xl font-bold text-blue-900">
                {formatCurrency(invoice.total_amount)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Đã thanh toán</div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(invoice.paid_amount)}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600">Còn lại</div>
              <div className="text-xl font-bold text-orange-900">
                {formatCurrency(invoice.remaining_amount)}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">Xác nhận thanh toán</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền thanh toán *
                  </label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData(prev => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0
                    }))}
                    max={invoice.remaining_amount}
                    min={0}
                    step="1000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tối đa: {formatCurrency(invoice.remaining_amount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phương thức thanh toán *
                  </label>
                  <select
                    value={paymentFormData.payment_method}
                    onChange={(e) => setPaymentFormData(prev => ({
                      ...prev,
                      payment_method: e.target.value
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label_vi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày thanh toán *
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData(prev => ({
                      ...prev,
                      payment_date: e.target.value
                    }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã tham chiếu
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.reference_number}
                    onChange={(e) => setPaymentFormData(prev => ({
                      ...prev,
                      reference_number: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: TF001, BANK123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú về thanh toán..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || paymentFormData.amount <= 0}
                  variant="primary"
                  size="sm"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </Button>
              </div>
            </form>
          )}

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Lịch sử thanh toán</h4>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(payment.payment_date)} • {payment.payment_method}
                        {payment.reference_number && ` • ${payment.reference_number}`}
                      </div>
                    </div>
                    <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                      {payment.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
