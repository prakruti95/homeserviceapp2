import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, Briefcase, CalendarDays, DollarSign, ShieldAlert, 
  CheckCircle, FolderOpen, ArrowRight, Star, RefreshCw 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [stRes, bStRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/bookings/stats'),
      ]);
      setStats(stRes.data);
      setBookingStats(bStRes.data?.booking_statuses || {});
    } catch (err) {
      console.error('Failed to load admin dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Root Administrator
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">Platform Master Console</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time system health, revenue tracking, and operational metrics.</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Metrics
        </button>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Registered Users</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total_providers || 0}</div>
            <div className="text-xs text-gray-500 font-medium">
              Service Providers ({stats?.verified_providers || 0} verified)
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total_bookings || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Platform Bookings</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">${stats?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div className="text-xs text-gray-500 font-medium">Gross Platform Revenue</div>
          </div>
        </div>
      </div>

      {/* Bookings Status Breakdown & Service Catalog Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Bookings Status Distribution</h2>
          <div className="space-y-3">
            {Object.entries(bookingStats || {}).map(([st, count]) => (
              <div key={st} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-700 capitalize">{st.replace('_', ' ')}</span>
                <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-xs font-black text-gray-900 shadow-2xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog Health & Quick Links */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">System Management Hub</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <div className="text-2xl font-black text-blue-700">{stats?.total_categories || 5}</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Service Categories</div>
              </div>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                <div className="text-2xl font-black text-indigo-700">{stats?.total_services || 18}</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Active Services</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/users"
              className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold text-center transition-colors"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/services"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center transition-colors"
            >
              Manage Catalog
            </Link>
            <Link
              to="/admin/bookings"
              className="flex-1 py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold text-center transition-colors"
            >
              All Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
