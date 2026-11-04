import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Briefcase, CheckSquare, Clock, DollarSign, Star, 
  CalendarDays, ArrowRight, UserCheck, Shield 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviderData() {
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
    }
    loadProviderData();
  }, []);

  const pending = bookings.filter((b) => b.status === 'pending');
  const inProgress = bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const totalEarnings = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);

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
            <Shield className="h-3.5 w-3.5" /> Certified Provider Partner
          </div>
          <h1 className="text-3xl font-black">{profile?.business_name || user?.full_name}</h1>
          <p className="mt-1 text-amber-100 text-sm max-w-lg">
            Manage incoming service orders, update dispatch status, and monitor your monthly service revenue.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/provider/bookings"
            className="px-5 py-3 bg-white text-amber-900 font-bold rounded-xl hover:bg-amber-50 transition-colors shadow-md text-sm shrink-0 flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" /> Manage Bookings
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pending.length}</div>
            <div className="text-xs text-gray-500 font-medium">Pending Requests</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{inProgress.length}</div>
            <div className="text-xs text-gray-500 font-medium">In Progress</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-gray-500 font-medium">Total Earned</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Star className="h-6 w-6 fill-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{profile?.average_rating || 4.9}</div>
            <div className="text-xs text-gray-500 font-medium">{profile?.total_reviews || 42} Reviews</div>
          </div>
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Immediate Action Required</h2>
            <p className="text-xs text-gray-500">Service requests waiting for your acceptance or status update</p>
          </div>
          <Link to="/provider/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All ({bookings.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700">No active bookings</h3>
              <p className="text-xs text-gray-500 mt-1">New customer bookings in your service area will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">#{b.id} {b.service_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Customer: <strong className="text-gray-700">{b.customer_name || 'Customer'}</strong> — {b.scheduled_date} at {b.scheduled_time} ({b.address})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-900">${b.total_price?.toFixed(2)}</span>
                    <Link
                      to="/provider/bookings"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Process
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
