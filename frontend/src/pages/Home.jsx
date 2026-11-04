import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wrench, Zap, Sparkles, Cpu, Paintbrush, ArrowRight, ShieldCheck, 
  Clock, ThumbsUp, Star, CheckCircle, Search, Quote, Snowflake, Hammer, ShieldAlert 
} from 'lucide-react';
import api from '../services/api';
import Footer from '../components/Footer';

const categoryIcons = {
  Plumbing: Wrench,
  Electrical: Zap,
  'AC Repair': Snowflake,
  'Home Cleaning': Sparkles,
  Painting: Paintbrush,
  Carpentry: Hammer,
  'Appliance Repair': Cpu,
  'Pest Control': ShieldAlert,
};

const fallbackCategories = [
  {
    id: 1,
    name: 'Plumbing',
    description: 'Pipe repairs, drain cleaning, faucet replacements, and leak diagnostics.',
    image_url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Electrical',
    description: 'Circuit breaker diagnosis, smart switch wiring, chandelier installs, and panel upgrades.',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'AC Repair',
    description: 'HVAC tune-ups, coil chemical deep cleans, refrigerant top-ups, and thermostat setup.',
    image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Home Cleaning',
    description: 'Whole-house deep cleans, kitchen degreasing, bathroom sanitization, and carpet wash.',
    image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Painting',
    description: 'Interior accent walls, ceiling coats, waterproof exterior paint, and drywall repair.',
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    name: 'Carpentry',
    description: 'Custom cabinetry, hardwood furniture repair, hinge alignments, and door hanging.',
    image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7,
    name: 'Appliance Repair',
    description: 'Refrigerators, dishwashers, washing machines, dryers, ovens, and microwaves.',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8,
    name: 'Pest Control',
    description: 'Eco-safe termite treatments, bed bug eradication, rodent exclusion, and inspections.',
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  },
];

const fallbackServices = [
  {
    id: 1,
    name: 'Emergency Pipe Leak & Burst Repair',
    description: 'Rapid on-site leak isolation, copper and PEX pipe replacement, and water pressure restoration.',
    base_price: 89.0,
    duration_minutes: 60,
    category: { name: 'Plumbing' },
    image_url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'AC Deep Foam Cleaning & Filter Wash',
    description: 'High-pressure coil chemical wash, indoor blower sanitation, and airflow efficiency check.',
    base_price: 79.0,
    duration_minutes: 75,
    category: { name: 'AC Repair' },
    image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Full Home Electrical Safety Audit',
    description: 'Inspection of main breaker panel, ground fault protection, load testing, and fixture wiring.',
    base_price: 99.0,
    duration_minutes: 90,
    category: { name: 'Electrical' },
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Whole-House Deep Sanitization Clean',
    description: 'Hospital-grade disinfectant cleaning for all rooms, deep kitchen degrease, and tile scrubbing.',
    base_price: 129.0,
    duration_minutes: 180,
    category: { name: 'Home Cleaning' },
    image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Smart Doorbell & Security Camera Setup',
    description: 'Wiring and mounting of smart doorbells, wireless cam sync, and mobile app configuration.',
    base_price: 69.0,
    duration_minutes: 45,
    category: { name: 'Electrical' },
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    name: 'Refrigerator Compressor & Cooling Tune-up',
    description: 'Diagnostic troubleshooting, condenser coil cleaning, thermostat calibration, and gas check.',
    base_price: 85.0,
    duration_minutes: 60,
    category: { name: 'Appliance Repair' },
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);
  const [services, setServices] = useState(fallbackServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, srvRes] = await Promise.all([
          api.get('/services/categories').catch(() => null),
          api.get('/services?limit=6').catch(() => null),
        ]);
        if (isMounted) {
          if (catRes?.data && Array.isArray(catRes.data) && catRes.data.length > 0) {
            setCategories(catRes.data);
          }
          const sList = catRes && srvRes?.data?.services 
            ? srvRes.data.services 
            : Array.isArray(srvRes?.data) 
              ? srvRes.data 
              : null;
          if (Array.isArray(sList) && sList.length > 0) {
            setServices(sList);
          }
        }
      } catch (err) {
        console.warn("Home initial data using fallback catalog:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
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
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">All 8 Service Verticals</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Explore Service Categories</h2>
          <p className="mt-3 text-gray-600 text-sm">Select a category to view specialized solutions tailored to your home needs.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat.name] || Wrench;
            return (
              <Link
                key={cat.id}
                to={`/customer/browse?category=${cat.id}`}
                className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-100">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600/90 backdrop-blur-xs text-white rounded-lg flex items-center justify-center">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-white font-bold text-sm drop-shadow-sm">{cat.name}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    Explore Services <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
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
              <div key={srv.id} className="bg-slate-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all group">
                <div className="h-44 w-full relative overflow-hidden bg-slate-200">
                  {srv.image_url ? (
                    <img
                      src={srv.image_url}
                      alt={srv.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {srv.category?.name || 'Home Service'}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {srv.duration_minutes} mins
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{srv.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-500 font-medium">Standard Fixed Rate</span>
                      <div className="text-xl font-black text-gray-900">${Number(srv.base_price || 0).toFixed(2)}</div>
                    </div>
                    <Link
                      to={`/customer/book/${srv.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                    >
                      Book Now
                    </Link>
                  </div>
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

      {/* Customer Testimonials Section */}
      <section className="py-20 bg-slate-100/70 border-t border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Real Feedback</span>
            <h2 className="text-3xl font-black text-gray-900 mt-1">Loved by Homeowners Everywhere</h2>
            <p className="mt-2 text-gray-600 text-sm">
              Discover why over 50,000 households rely on HomeServe for their routine repairs and emergencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "Our kitchen pipe burst late on a Sunday evening. We booked through HomeServe, and Alex from ProFix arrived within 45 minutes with all the copper fittings ready. Saved us thousands in potential water damage!"
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">
                  DC
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">David Chen</h4>
                  <span className="text-[11px] text-gray-400">San Francisco, CA</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "As a landlord managing 4 rental units, HomeServe has been a game changer. I schedule electrical audits and deep cleanings, receive itemized invoices automatically, and track technician arrival in real-time."
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center justify-center text-xs">
                  MR
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">Melissa Rodriguez</h4>
                  <span className="text-[11px] text-gray-400">Oakland, CA</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "Upfront fixed pricing is the best feature. No awkward haggling on your front porch. The technician was polite, wore boot covers, and finished the AC compressor diagnostic right on time."
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-700 font-bold rounded-full flex items-center justify-center text-xs">
                  JL
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">James Livingston</h4>
                  <span className="text-[11px] text-gray-400">San Jose, CA</span>
                </div>
              </div>
            </div>
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
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Get Started as Customer
            </Link>
            <Link
              to="/register?role=provider"
              className="px-8 py-3.5 bg-blue-600 border border-blue-400 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors cursor-pointer"
            >
              Join as Service Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
}
