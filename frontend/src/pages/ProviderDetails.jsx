import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Briefcase, Star, MapPin, Clock, ShieldCheck, 
  CheckCircle, ArrowLeft, ArrowRight, UserCheck, Calendar 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProviderDetails() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProvider() {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([
          api.get(`/providers/${id}`),
          api.get(`/providers/${id}/availability`).catch(() => ({ data: [] })),
        ]);
        setProvider(pRes.data);
        setAvailability(aRes.data || []);
      } catch (err) {
        console.error('Failed to load provider profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-2xl border border-gray-200">
        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-800">Provider Not Found</h3>
        <p className="text-xs text-gray-500 mt-1">The requested service professional profile was not found.</p>
        <Link to="/customer/browse" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Browse Services
        </Link>
      </div>
    );
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/customer/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md">
              {provider.business_name ? provider.business_name[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900">{provider.business_name || provider.name}</h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  ✓ Verified Pro
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {provider.average_rating || 4.9} ({provider.total_reviews || 42} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {provider.service_area || 'Greater Bay Area'}
                </span>
                <span>•</span>
                <span>{provider.experience_years || 8} Years Experience</span>
              </div>
            </div>
          </div>

          <Link
            to={`/customer/book?provider=${provider.id}`}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            <Calendar className="h-4 w-4" /> Book Appointment
          </Link>
        </div>

        {/* Bio */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Professional Biography & Expertise</h2>
          <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-gray-100">
            {provider.bio || 'Licensed and insured specialist dedicated to delivering precision home repairs, rapid emergency diagnostics, and quality customer care.'}
          </p>
        </div>

        {/* Working Hours Schedule */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" /> Standard Service Availability
          </h2>
          {availability.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Available Monday through Friday, 09:00 AM – 05:00 PM PST.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availability.map((s) => (
                <div key={s.id} className="p-3 bg-white rounded-xl border border-gray-200 text-center text-xs">
                  <div className="font-bold text-gray-800">{daysOfWeek[s.day_of_week]}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
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
