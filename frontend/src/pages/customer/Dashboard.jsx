import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  CalendarDays, CheckCircle, Clock, Search, ArrowRight, 
  MapPin, AlertCircle, Sparkles 
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookRes, catRes] = await Promise.all([
          api.get('/bookings/'),
          api.get('/services/categories'),
        ]);
        setBookings(bookRes.data?.bookings || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Failed to load customer dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Customer Portal</span>
          <h1 className="text-3xl font-extrabold mt-1">Welcome back, {user?.full_name}! 👋</h1>
          <p className="mt-2 text-blue-100 max-w-xl text-sm">
            Manage your service reservations, discover certified home technicians, and track active bookings in real time.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/customer/browse"
            className="px-5 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2 text-sm shrink-0"
          >
            <Search className="h-4 w-4" /> Book a Service
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pendingBookings.length}</div>
            <div className="text-xs text-gray-500 font-medium">Pending Confirmation</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeBookings.length}</div>
            <div className="text-xs text-gray-500 font-medium">Active & In Progress</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{completedBookings.length}</div>
            <div className="text-xs text-gray-500 font-medium">Completed Services</div>
          </div>
        </div>
      </div>

      {/* Upcoming / Active Bookings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Service Bookings</h2>
            <p className="text-xs text-gray-500">Track and manage your scheduled service visits</p>
          </div>
          <Link to="/customer/bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Bookings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700">No bookings yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Ready to take care of your home? Browse our catalog and book a verified service provider today.
              </p>
              <Link
                to="/customer/browse"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      #{b.id}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{b.service_name || 'Home Service'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {b.scheduled_date} at {b.scheduled_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.city || 'San Francisco'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${b.total_price.toFixed(2)}</div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <Link
                      to="/customer/bookings"
                      className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
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

      {/* Quick Service Categories */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Service Booking</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/customer/browse?category=${cat.id}`}
              className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-center flex flex-col items-center"
            >
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-gray-900">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
