import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, Zap, Sparkles, Cpu, Paintbrush, ArrowRight, ShieldCheck, 
  Clock, ThumbsUp, Star, CheckCircle, Search
} from 'lucide-react';
import api from '../services/api';

const categoryIcons = {
  Plumbing: Wrench,
  Electrical: Zap,
  'Deep Cleaning': Sparkles,
  'Appliance Repair': Cpu,
  'Painting & Drywall': Paintbrush,
};

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, srvRes] = await Promise.all([
          api.get('/services/categories'),
          api.get('/services/?limit=6'),
        ]);
        setCategories(catRes.data || []);
        setServices(srvRes.data?.services || []);
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/customer/browse');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-6 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Trusted by 50,000+ Happy Homeowners
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Expert Home Services, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-sky-400">
              Booked in Seconds.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto font-normal">
            From emergency pipe leaks and electrical fixes to full-house deep cleans, connect with certified local service technicians instantly.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-2xl shadow-2xl border border-blue-100 gap-2">
              <div className="flex items-center gap-3 px-4 py-2 w-full">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="What service do you need today? (e.g., Plumbing, AC Repair)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                Find Services <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-blue-700/50 pt-8">
            <div>
              <div className="text-3xl font-extrabold text-white">4.9/5</div>
              <div className="text-xs text-blue-200 mt-1 flex items-center justify-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Over 10k Reviews
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-blue-200 mt-1">Vetted Professionals</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">60 Min</div>
              <div className="text-xs text-blue-200 mt-1">Average Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">$0</div>
              <div className="text-xs text-blue-200 mt-1">Hidden Booking Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Explore Service Categories</h2>
          <p className="mt-3 text-gray-600">Select a category to view specialized solutions tailored to your home needs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.name] || Wrench;
            return (
              <Link
                key={cat.id}
                to={`/customer/browse?category=${cat.id}`}
                className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center"
              >
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <IconComponent className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-white border-y border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Top Rated Solutions</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">Popular Services This Week</h2>
            </div>
            <Link
              to="/customer/browse"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-700 text-sm"
            >
              View Full Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 6).map((srv) => (
              <div key={srv.id} className="bg-slate-50 rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between text-xs text-blue-600 font-medium mb-3">
                    <span className="bg-blue-100/70 px-2.5 py-1 rounded-md">{srv.category?.name || 'Home Service'}</span>
                    <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {srv.duration_minutes} mins</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{srv.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{srv.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Starting from</span>
                    <div className="text-xl font-bold text-gray-900">${srv.base_price.toFixed(2)}</div>
                  </div>
                  <Link
                    to={`/customer/book/${srv.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose HomeServe */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why HomeServe Platform?</h2>
          <p className="mt-3 text-gray-600">Built to deliver unmatched reliability, transparent upfront pricing, and peace of mind.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Experts</h3>
            <p className="text-gray-600 text-sm">
              Every provider undergoes background checks, license verification, and skill audits before accepting their first request.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">On-Time Guarantee</h3>
            <p className="text-gray-600 text-sm">
              Schedule appointments that fit your exact schedule. Real-time notifications keep you informed at every milestone.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ThumbsUp className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Satisfaction Assured</h3>
            <p className="text-gray-600 text-sm">
              Transparent upfront quotes with zero surprises. Hassle-free re-servicing if you're not completely satisfied.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to transform your home maintenance?</h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto">
            Join thousands of homeowners and certified professionals on the HomeServe SaaS Platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
            >
              Get Started as Customer
            </Link>
            <Link
              to="/register?role=provider"
              className="px-8 py-3.5 bg-blue-600 border border-blue-400 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
            >
              Join as Service Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
