import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  CalendarDays, CheckCircle, Clock, Search, ArrowRight, 
  MapPin, AlertCircle, Sparkles, CreditCard, Star, ShieldCheck, 
  CheckCircle2, FileText, User 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookRes, catRes, provRes] = await Promise.all([
          api.get('/bookings/'),
          api.get('/services/categories'),
          api.get('/providers/').catch(() => ({ data: [] })),
        ]);
        setBookings(bookRes.data?.bookings || []);
        setCategories(catRes.data || []);
        const rawProviders = provRes.data;
        const pList = Array.isArray(rawProviders) ? rawProviders : (rawProviders?.providers || []);
        setTopProviders(pList.slice(0, 3));
      } catch (err) {
        console.error('Failed to load customer dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => ['confirmed', 'provider_assigned', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            Homeowner Service Hub
          </span>
          <h1 className="text-3xl font-black mt-2">Welcome back, {user?.full_name}! 👋</h1>
          <p className="mt-1 text-blue-100 max-w-xl text-xs sm:text-sm">
            Track active service dispatches, schedule home maintenance appointments, and manage official tax invoices.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/customer/browse"
            className="px-5 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2 text-xs shrink-0"
          >
            <Search className="h-4 w-4" /> Book New Service
          </Link>
          <Link
            to="/customer/bookings"
            className="px-5 py-3 bg-blue-600/60 hover:bg-blue-600/80 text-white font-semibold rounded-xl border border-blue-400/30 transition-colors text-xs shrink-0"
          >
            My Appointments
          </Link>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{pendingBookings.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">Pending Confirmation</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{activeBookings.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">Active & Dispatched</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{completedBookings.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">Completed Services</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600">
              ${completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0).toFixed(0)}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">Total Settled</div>
          </div>
        </div>
      </div>

      {/* Active & Upcoming Bookings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Active & Upcoming Services</h2>
              <p className="text-xs text-gray-500">Live progress tracking and arrival updates</p>
            </div>
            <Link to="/customer/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All Bookings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700">No active bookings</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Browse our certified service network and book upfront maintenance.
                </p>
                <Link
                  to="/customer/browse"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Book a Service
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{b.service_name || 'Home Service'}</span>
                        <span className="text-[11px] font-mono text-gray-400">{b.booking_reference || `#BK-${b.id}`}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-blue-500" /> {b.scheduled_date} at {b.scheduled_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500" /> {b.city || 'San Francisco'}
                        </span>
                        {b.technician_name && (
                          <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Tech: {b.technician_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-sm">${b.total_price?.toFixed(2)}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'provider_assigned' ? 'bg-purple-100 text-purple-700' :
                          b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                          b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>
                      <Link
                        to="/customer/bookings"
                        className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Favorite & Certified Providers Column */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Featured Contractors</h2>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              Verified Pros
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Directly connect with top-rated service partners carrying comprehensive safety licenses.
          </p>

          <div className="space-y-3 pt-2">
            {topProviders.map((p) => (
              <div key={p.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-gray-100 transition-colors flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-xs">{p.business_name || p.user_name}</div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.average_rating || 4.9}
                    </span>
                    <span>•</span>
                    <span>${p.hourly_rate}/hr</span>
                  </div>
                </div>
                <Link
                  to={`/customer/book?provider=${p.user_id || p.id}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  Book Pro
                </Link>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link to="/customer/payments" className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Payment Receipts
            </Link>
            <Link to="/customer/complaints" className="text-rose-600 hover:underline font-semibold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Quality Guarantee
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Service Categories Grid */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Service Catalog Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/customer/browse?category=${cat.id}`}
              className="bg-white p-3.5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-center flex flex-col items-center group"
            >
              <div className="h-10 w-10 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center mb-2 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-gray-800 line-clamp-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
