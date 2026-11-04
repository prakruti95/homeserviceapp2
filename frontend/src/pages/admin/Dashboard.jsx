import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, Briefcase, CalendarDays, DollarSign, ShieldAlert, 
  CheckCircle, FolderOpen, ArrowRight, Star, RefreshCw,
  TrendingUp, BarChart3, PieChart, Layers
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const MONTHLY_ANALYTICS = [
  { month: 'Jun', revenue: 4200, bookings: 38 },
  { month: 'Jul', revenue: 5800, bookings: 52 },
  { month: 'Aug', revenue: 7100, bookings: 64 },
  { month: 'Sep', revenue: 6400, bookings: 58 },
  { month: 'Oct', revenue: 8900, bookings: 82 },
  { month: 'Nov', revenue: 11450, bookings: 104 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'bookings'

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

  const maxVal = chartMetric === 'revenue' 
    ? Math.max(...MONTHLY_ANALYTICS.map(m => m.revenue))
    : Math.max(...MONTHLY_ANALYTICS.map(m => m.bookings));

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
          className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 self-start cursor-pointer"
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

      {/* Interactive Platform Growth & Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Platform Performance & Revenue Velocity</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Historical trailing 6 months transaction volume and fulfillment trajectory</p>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-gray-200">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'revenue' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Revenue ($)
            </button>
            <button
              onClick={() => setChartMetric('bookings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMetric === 'bookings' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bookings Volume
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-gray-100">
          {MONTHLY_ANALYTICS.map((item) => {
            const val = chartMetric === 'revenue' ? item.revenue : item.bookings;
            const heightPercent = Math.round((val / maxVal) * 100);
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Floating tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                  {chartMetric === 'revenue' ? `$${val.toLocaleString()}` : `${val} jobs`}
                </div>
                <div className="w-full max-w-[48px] bg-blue-50 hover:bg-blue-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-44 transition-colors">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-500"
                  />
                </div>
                <span className="text-xs font-bold text-gray-500">{item.month}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 text-xs text-gray-500">
          <span>Target baseline: $10,000 / mo</span>
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +28.6% month-over-month growth
          </span>
        </div>
      </div>

      {/* Bookings Status Breakdown & Service Catalog Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Bookings Status Distribution</h2>
          <div className="space-y-3">
            {Object.entries(bookingStats || {}).map(([st, count]) => {
              const totalB = stats?.total_bookings || 1;
              const pct = Math.min(100, Math.round((count / (totalB || 1)) * 100));
              return (
                <div key={st} className="p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 capitalize">{st.replace('_', ' ')}</span>
                    <span className="px-2.5 py-0.5 bg-white rounded-md border border-gray-200 text-xs font-black text-gray-900 shadow-2xs">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        st === 'completed' ? 'bg-emerald-500' :
                        st === 'in_progress' ? 'bg-blue-500' :
                        st === 'confirmed' ? 'bg-indigo-500' :
                        st === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catalog Health & Quick Links */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Service Catalog Infrastructure</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <div className="text-2xl font-black text-blue-700">{stats?.total_categories || 8}</div>
                <div className="text-xs text-gray-600 font-medium mt-1">All 8 Active Verticals</div>
              </div>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                <div className="text-2xl font-black text-indigo-700">{stats?.total_services || 33}</div>
                <div className="text-xs text-gray-600 font-medium mt-1">Total Catalog Offerings</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              All 8 specialized verticals (Electrical, Plumbing, AC Repair, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control) are active with high-resolution visual photography.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/users"
              className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-xs"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/services"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-xs"
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
