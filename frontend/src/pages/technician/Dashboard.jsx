import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Wrench, CheckSquare, Clock, MapPin, Phone, 
  Play, CheckCircle2, AlertCircle, RefreshCw, Navigation 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/');
      setBookings(data?.bookings || []);
    } catch (err) {
      console.error('Failed to load technician work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Job status changed to ${newStatus.replace('_', ' ')}`);
      fetchWorkOrders();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setUpdatingId(null);
    }
  };

  const activeDispatches = bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status));
  const completedToday = bookings.filter((b) => b.status === 'completed');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            Field Technician Console
          </span>
          <h1 className="text-3xl font-black mt-2">Active Field Dispatches</h1>
          <p className="mt-1 text-slate-300 text-xs max-w-lg">
            Welcome, <strong>{user?.full_name}</strong>. Update work order progress, verify customer addresses, and complete on-site services.
          </p>
        </div>
        <button
          onClick={fetchWorkOrders}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Sync Dispatches
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeDispatches.length}</div>
            <div className="text-xs text-gray-500 font-medium">Assigned Active Jobs</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {bookings.filter((b) => b.status === 'in_progress').length}
            </div>
            <div className="text-xs text-gray-500 font-medium">Currently In Progress</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{completedToday.length}</div>
            <div className="text-xs text-gray-500 font-medium">Finished Work Orders</div>
          </div>
        </div>
      </div>

      {/* Work Orders Queue */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Assigned Dispatch Queue</h2>
          <span className="text-xs font-semibold text-gray-500">{bookings.length} Total Registered Jobs</span>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No work orders assigned currently. New assignments from the dispatch network will show here.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-base">
                      #{b.id} {b.service_name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                      Customer: {b.customer_name || 'Homeowner'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      {b.scheduled_date} at {b.scheduled_time} ({b.duration_minutes}m)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {b.address}, {b.city}
                    </span>
                  </div>

                  {b.notes && (
                    <div className="p-2.5 bg-blue-50/60 rounded-xl text-xs text-blue-900 border border-blue-100">
                      <strong>Customer Special Note:</strong> {b.notes}
                    </div>
                  )}
                </div>

                {/* Technician Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(b.address + ', ' + b.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs flex items-center gap-1.5"
                    title="Open Navigation"
                  >
                    <Navigation className="h-4 w-4 text-blue-600" /> Navigate
                  </a>

                  {b.status === 'confirmed' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" /> Start Job
                    </button>
                  )}

                  {b.status === 'in_progress' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'completed')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Finish & Sign Off
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" /> Job Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
