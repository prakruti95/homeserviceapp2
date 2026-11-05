import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { DollarSign, FileText, CheckCircle2, Clock, ShieldCheck, Download, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import InvoiceModal from '../../components/InvoiceModal';
import { getClientBookings } from '../../services/bookingStorage';

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let serverPayments = [];
      let serverBookings = [];

      try {
        const [payRes, bookRes] = await Promise.all([
          api.get('/payments/').catch(() => ({ data: { payments: [] } })),
          api.get('/bookings/').catch(() => ({ data: { bookings: [] } })),
        ]);
        serverPayments = payRes.data?.payments || [];
        serverBookings = bookRes.data?.bookings || [];
      } catch (e) {
        console.warn('API payments offline, deriving from bookings and client storage');
      }

      const clientBookings = getClientBookings(user?.email);

      // Merge bookings
      const bMap = new Map();
      clientBookings.forEach((b) => bMap.set(String(b.id), b));
      serverBookings.forEach((b) => {
        const existing = bMap.get(String(b.id));
        bMap.set(String(b.id), { ...existing, ...b });
      });
      const allBookings = Array.from(bMap.values());
      setBookings(allBookings);

      // Build payments from server and client bookings
      const pMap = new Map();
      serverPayments.forEach((p) => pMap.set(String(p.id || p.transaction_id || p.booking_id), p));

      allBookings.forEach((b) => {
        const isPaid = ['completed', 'paid'].includes(b.payment_status) || b.status === 'completed' || b.transaction_id;
        if (isPaid) {
          const key = String(b.transaction_id || `TXN-HS-${b.id}`);
          if (!pMap.has(key)) {
            pMap.set(key, {
              id: b.id,
              booking_id: b.id,
              amount: Number(b.total_price || 0),
              payment_method: b.payment_method || 'credit_card',
              status: 'paid',
              transaction_id: b.transaction_id || `TXN-HS-${b.id}`,
              created_at: b.created_at || new Date().toISOString(),
              service_name: b.service_name || 'Home Maintenance Service',
            });
          }
        }
      });

      const mergedPayments = Array.from(pMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setPayments(mergedPayments);
    } catch (err) {
      console.error('Failed to load payment history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalSpent = payments
    .filter((p) => ['completed', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleOpenInvoice = (payment) => {
    const matchedBooking = bookings.find((b) => b.id === payment.booking_id) || {
      id: payment.booking_id,
      service_name: 'Home Maintenance Service',
      total_price: payment.amount,
      scheduled_date: new Date(payment.created_at).toISOString().split('T')[0],
      scheduled_time: '10:00 AM',
      address: 'On-file Service Address',
      city: 'San Francisco',
      status: 'completed',
    };
    setSelectedInvoice({ booking: matchedBooking, payment });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Payment History & Invoices</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review completed transactions, download official tax receipts, and audit service billing.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 self-start cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount Settled</div>
          <div className="text-3xl font-black text-blue-600 mt-2">${totalSpent.toFixed(2)}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Across all completed services</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recorded Invoices</div>
          <div className="text-3xl font-black text-gray-900 mt-2">{payments.length}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Available for digital print</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Encrypted Payments</div>
            <div className="text-[11px] text-gray-500 mt-0.5">256-bit TLS secure card transactions</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">All Transactions ({payments.length})</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No payments recorded yet. Payments processed for bookings will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">Transaction Ref</th>
                  <th className="py-3 px-6">Booking #</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-6 font-mono font-bold text-gray-900">
                      {p.transaction_id || `TXN-${p.id}`}
                    </td>
                    <td className="py-3 px-6 font-semibold text-blue-600">
                      Booking #{p.booking_id}
                    </td>
                    <td className="py-3 px-6 capitalize text-gray-700">
                      {p.payment_method === 'wallet' ? 'UPI Demo' : (p.payment_method?.replace('_', ' ') || 'Demo Card')}
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-right font-black text-gray-900 text-sm">
                      ${Number(p.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ['completed', 'paid'].includes(p.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {['completed', 'paid'].includes(p.status) ? 'PAID' : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleOpenInvoice(p)}
                        className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          booking={selectedInvoice.booking}
          payment={selectedInvoice.payment}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
