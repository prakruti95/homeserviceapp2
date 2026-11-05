import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Briefcase, CheckSquare, Clock, DollarSign, Star, 
  CalendarDays, ArrowRight, UserCheck, Shield, CheckCircle,
  XCircle, User, Wrench, Settings, RefreshCw, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      const [profRes, bookRes] = await Promise.all([
        api.get('/providers/me'),
        api.get('/bookings/'),
      ]);
      setProfile(profRes.data);
      setBookings(bookRes.data?.bookings || []);
    } catch (err) {
      console.error('Failed to load provider dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, reason = null) => {
    const actionLabel = newStatus === 'confirmed' ? 'accept' : 'decline';
    if (!window.confirm(`Are you sure you want to ${actionLabel} booking #${bookingId}?`)) {
      return;
    }
    setActionId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
        cancellation_reason: reason,
      });
      toast.success(`Booking #${bookingId} ${newStatus === 'confirmed' ? 'accepted' : 'declined'} successfully!`);
      loadProviderData();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setActionId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.scheduled_date === todayStr);
  const pendingRequests = bookings.filter((b) => b.status === 'pending');
  const activeDispatches = bookings.filter((b) => ['confirmed', 'provider_assigned', 'in_progress'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');

  const grossEarnings = completed.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const platformCommission = Math.round(grossEarnings * 0.10 * 100) / 100;
  const netEarnings = Math.round((grossEarnings - platformCommission) * 100) / 100;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/30 text-amber-100 text-xs font-semibold mb-2 uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" /> {profile?.is_verified ? 'Verified Pro Contractor' : 'Partner Portal'}
          </div>
          <h1 className="text-3xl font-black">{profile?.business_name || user?.full_name}</h1>
          <p className="mt-1 text-amber-100 text-xs sm:text-sm max-w-lg">
            Manage field dispatches, accept incoming customer orders, and audit service commission payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/provider/bookings"
            className="px-5 py-3 bg-white text-amber-900 font-bold rounded-xl hover:bg-amber-50 transition-colors shadow-md text-xs shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4" /> Manage Bookings
          </Link>
          <Link
            to="/provider/availability"
            className="px-5 py-3 bg-amber-500/40 hover:bg-amber-500/60 text-white font-semibold rounded-xl border border-amber-300/30 transition-colors text-xs shrink-0 flex items-center gap-1.5"
          >
            <CalendarDays className="h-4 w-4" /> Working Hours
          </Link>
        </div>
      </div>

      {/* Financial & Job Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{pendingRequests.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">New Requests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{todaysBookings.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">Today's Jobs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{completed.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">Completed Jobs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-purple-700">${netEarnings.toFixed(2)}</div>
            <div className="text-[10px] text-gray-400 font-medium">
              Net Payout (Gross: ${grossEarnings.toFixed(0)})
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{profile?.average_rating || 4.9}</div>
            <div className="text-[11px] text-gray-500 font-medium">{profile?.total_reviews || 42} Reviews</div>
          </div>
        </div>
      </div>

      {/* Immediate Action Queue (Pending Requests) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Booking Requests ({pendingRequests.length})</h2>
            <p className="text-xs text-gray-500">Respond promptly to maintain high platform acceptance scores</p>
          </div>
          <Link to="/provider/bookings" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            All Orders ({bookings.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-700 text-sm">All requests processed</h3>
              <p className="text-xs text-gray-500 mt-1">There are no pending requests awaiting review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((b) => (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">#{b.id} {b.service_name}</span>
                      <span className="text-[11px] font-mono text-gray-400">{b.booking_reference || `#BK-${b.id}`}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Pending
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                      <span>Customer: <strong>{b.customer_name || 'Customer'}</strong></span>
                      <span>•</span>
                      <span>Scheduled: <strong>{b.scheduled_date} at {b.scheduled_time}</strong></span>
                      <span>•</span>
                      <span>{b.address}, {b.city}</span>
                    </div>
                    {b.notes && (
                      <p className="text-xs text-gray-600 bg-slate-50 p-2 rounded-lg border border-gray-100 max-w-xl">
                        Note: {b.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-black text-gray-900">${Number(b.total_price || 0).toFixed(2)}</div>
                      <span className="text-[10px] text-gray-400">Billable</span>
                    </div>

                    <button
                      disabled={actionId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Accept
                    </button>
                    <button
                      disabled={actionId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'cancelled', 'Declined by provider')}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/provider/earnings"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Earnings & Payouts</div>
            <div className="text-[11px] text-gray-500">10% Platform fee audited breakdown</div>
          </div>
        </Link>

        <Link
          to="/provider/availability"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Working Hours Schedule</div>
            <div className="text-[11px] text-gray-500">Manage weekly active service slots</div>
          </div>
        </Link>

        <Link
          to="/provider/profile"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Contractor Profile & Radius</div>
            <div className="text-[11px] text-gray-500">Bio, service area & certifications</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
