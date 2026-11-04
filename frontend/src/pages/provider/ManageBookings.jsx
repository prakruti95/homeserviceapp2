import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  CheckSquare, Clock, MapPin, CalendarDays, CheckCircle, 
  XCircle, Play, CheckCircle2, User, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/');
      setBookings(data?.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, reason = null) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
        cancellation_reason: reason,
      });
      toast.success(`Booking status changed to ${newStatus.replace('_', ' ')}`);
      fetchBookings();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Service Orders</h1>
          <p className="text-xs text-gray-500 mt-1">
            Accept assignments, initiate dispatches, and mark completed jobs to release payouts.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Orders
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No active orders assigned</h3>
          <p className="text-xs text-gray-500 mt-1">When customers book your services, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-base">
                    #{b.id} {b.service_name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                    b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5 font-medium text-gray-800">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    Customer: {b.customer_name || 'Customer'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                    {b.scheduled_date} at {b.scheduled_time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {b.address}, {b.city}
                  </span>
                </div>

                {b.notes && (
                  <p className="text-xs text-gray-500 bg-slate-50 p-2.5 rounded-lg border border-gray-100 max-w-xl">
                    <span className="font-semibold text-gray-700">Client Note:</span> {b.notes}
                  </p>
                )}
              </div>

              {/* Status Action Workflow Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-black text-gray-900">${b.total_price?.toFixed(2)}</div>
                  <span className="text-[10px] text-gray-400">Total Billable</span>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button
                        disabled={updatingId === b.id}
                        onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button
                        disabled={updatingId === b.id}
                        onClick={() => handleUpdateStatus(b.id, 'cancelled', 'Declined by provider')}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {b.status === 'confirmed' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" /> Start Service
                    </button>
                  )}

                  {b.status === 'in_progress' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'completed')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Complete Job
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg">
                      <CheckCircle2 className="h-4 w-4" /> Job Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
