import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarDays, Filter, RefreshCw, MapPin, DollarSign, User } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/bookings/?status=${statusFilter}` : '/bookings/';
      const { data } = await api.get(url);
      setBookings(data?.bookings || []);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleOverrideStatus = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking #${bookingId} status overridden to ${newStatus}`);
      fetchBookings();
    } catch (err) {
      // toast shown
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Bookings Supervision</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time feed of all service requests, customer orders, and status overrides across the SaaS platform.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 self-start cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Feed
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Bookings'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">ID & Service</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Scheduled Time</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6 text-right">Price</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Override Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-6">
                      <div className="font-bold text-gray-900">#{b.id} {b.service_name}</div>
                      <div className="text-[11px] text-gray-400">{b.duration_minutes} mins</div>
                    </td>
                    <td className="py-3 px-6 font-medium text-gray-800">
                      {b.customer_name || 'Customer'}
                    </td>
                    <td className="py-3 px-6 text-gray-600">
                      <div>{b.scheduled_date}</div>
                      <div className="text-[11px] text-gray-400">{b.scheduled_time}</div>
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {b.address}, {b.city}
                    </td>
                    <td className="py-3 px-6 text-right font-black text-gray-900">
                      ${b.total_price?.toFixed(2)}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                          b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                        {b.payment_status && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            ['completed', 'paid'].includes(b.payment_status)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {['completed', 'paid'].includes(b.payment_status) ? 'PAID' : 'PAYMENT PENDING'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <select
                        value={b.status}
                        onChange={(e) => handleOverrideStatus(b.id, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
