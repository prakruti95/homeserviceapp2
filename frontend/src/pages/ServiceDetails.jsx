import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Clock, DollarSign, ShieldCheck, CheckCircle2, ArrowRight, 
  ArrowLeft, Star, Wrench, Calendar, Sparkles, ThumbsUp 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fallbackServices } from '../data/catalog';

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      try {
        const [srvRes, revRes] = await Promise.all([
          api.get(`/services/${id}`),
          api.get('/reviews/').catch(() => ({ data: { reviews: [] } })),
        ]);
        if (srvRes.data) {
          setService(srvRes.data);
        } else {
          const fallback = fallbackServices.find((s) => String(s.id) === String(id));
          setService(fallback || null);
        }
        setReviews(revRes.data?.reviews || []);
      } catch (err) {
        console.error('Failed to load service details, checking catalog fallback', err);
        const fallback = fallbackServices.find((s) => String(s.id) === String(id));
        setService(fallback || null);
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-2xl border border-gray-200">
        <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-800">Service Not Found</h3>
        <p className="text-xs text-gray-500 mt-1">The requested service catalog item does not exist.</p>
        <Link to="/customer/browse" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/customer/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Services
        </Link>
      </div>

      {/* Main Service Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        {service.image_url && (
          <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-100">
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">
                  {service.category?.name || 'Verified Service'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 drop-shadow-sm">
                  {service.name}
                </h1>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 sm:p-10 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            {!service.image_url && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  {service.category?.name || 'Professional Service'}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  {service.name}
                </h1>
              </>
            )}
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              {service.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <Clock className="h-4 w-4 text-blue-600" />
                Est. Duration: {service.duration_minutes} Minutes
              </span>
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Licensed & Insured Guarantee
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 / 5.0 Top Satisfaction
              </span>
            </div>
          </div>

          {/* Pricing & CTA Box */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200 text-center sm:text-right shrink-0 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fixed Standard Rate</span>
              <div className="text-3xl font-black text-gray-900">${Number(service.base_price || 0).toFixed(2)}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">All standard labor included</div>
            </div>

            <Link
              to={`/customer/book/${service.id}`}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" /> Schedule This Service <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Detailed Scope of Work */}
        <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> What's Included in This Service
            </h3>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>On-site multi-point diagnostic inspection by a certified technician.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Commercial tooling, safety equipment, and cleanup upon task completion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Standard hardware adjustment, seal tightening, or precision calibration.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>HomeServe 30-day workmanship assurance and digital invoice certificate.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> HomeServe Safety Standards
            </h3>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">Transparent Billing:</strong>
                Zero hidden travel surcharges or surprise billing. If extra commercial parts are required, written approval is requested before ordering.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">On-Time Arrival Guarantee:</strong>
                Real-time tracking of technician dispatch. We notify you the moment your provider departs.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Verified Client Feedback</h3>
            <p className="text-xs text-gray-500">Customer experiences for this service category</p>
          </div>
          <Link
            to="/customer/reviews"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Reviews <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.slice(0, 4).map((r) => (
            <div key={r.id} className="p-4 bg-slate-50/70 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">Verified User</span>
              </div>
              <p className="text-xs text-gray-700 italic">"{r.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
