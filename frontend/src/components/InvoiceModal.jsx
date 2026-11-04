import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';

export default function InvoiceModal({ booking, payment, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNum = `INV-${String(booking.id).padStart(5, '0')}`;
  const issueDate = new Date(booking.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 my-8 relative print:m-0 print:p-0 print:shadow-none print:border-none">
        {/* Close Button - hidden in print */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors print:hidden cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-100 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                HS
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">HomeServe</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              HomeServe Technologies Inc.<br />
              500 Howard Street, Suite 400<br />
              San Francisco, CA 94105<br />
              support@homeserve.tech
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Official Tax Receipt
            </span>
            <div className="text-xl font-black text-gray-900 mt-2">{invoiceNum}</div>
            <div className="text-xs text-gray-500 mt-1">Date: {issueDate}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center justify-end gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Status: {payment?.status === 'completed' || booking.status === 'completed' ? 'PAID' : 'SETTLED'}
            </div>
          </div>
        </div>

        {/* Client & Booking Details */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-100 text-xs">
          <div>
            <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Billed To</div>
            <div className="font-bold text-gray-900 text-sm mt-1">{booking.customer_name || 'Valued Customer'}</div>
            <div className="text-gray-600 mt-1">{booking.address}</div>
            <div className="text-gray-600">{booking.city}, {booking.zip_code || '94103'}</div>
          </div>

          <div>
            <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Service Dispatch</div>
            <div className="font-bold text-gray-900 mt-1">{booking.service_name || 'Home Service'}</div>
            <div className="text-gray-600 mt-1">Scheduled: {booking.scheduled_date} at {booking.scheduled_time}</div>
            <div className="text-gray-600">Assigned Tech: {booking.provider_name || 'ProFix Certified Tech'}</div>
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="py-6 border-b border-gray-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 uppercase text-[10px] font-bold border-b border-gray-100">
                <th className="pb-3">Description</th>
                <th className="pb-3 text-center">Duration</th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-3 font-semibold text-gray-800">
                  {booking.service_name}
                  <div className="text-[11px] text-gray-400 font-normal">Labor, safety inspection & tools included</div>
                </td>
                <td className="py-3 text-center text-gray-600">{booking.duration_minutes || 60} mins</td>
                <td className="py-3 text-right text-gray-600">${(booking.total_price || 0).toFixed(2)}</td>
                <td className="py-3 text-right font-bold text-gray-900">${(booking.total_price || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="py-6 border-b border-gray-100 flex justify-end text-xs">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">${(booking.total_price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Service Fee:</span>
              <span className="font-semibold text-emerald-600">$0.00</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Local Sales Tax (0%):</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>Total Paid:</span>
              <span className="text-blue-600">${(booking.total_price || 0).toFixed(2)}</span>
            </div>
            {payment?.transaction_id && (
              <div className="text-[11px] text-gray-400 text-right pt-1 font-mono">
                Ref: {payment.transaction_id}
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Actions */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Guaranteed satisfaction & verified provider invoice</span>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
