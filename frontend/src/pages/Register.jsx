import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Mail, Lock, Phone, MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register({ defaultRole }) {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isProviderPath = location.pathname.includes('provider') || searchParams.get('role') === 'provider' || defaultRole === 'provider';
  const [role, setRole] = useState(isProviderPath ? 'provider' : 'customer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    zip_code: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ...formData,
        role,
      });
      // Seamlessly log the user in immediately so they never get stuck on login
      try {
        const loggedUser = await login(formData.email, formData.password);
        const r = loggedUser?.role?.toLowerCase();
        if (r === 'admin' || r === 'super_admin') {
          navigate('/admin/dashboard');
        } else if (r === 'provider') {
          navigate('/provider/dashboard');
        } else if (r === 'technician') {
          navigate('/technician/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      } catch {
        navigate('/login', { state: { registeredEmail: formData.email.trim() } });
      }
    } catch (err) {
      // toast shown by register function
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            HS
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">HomeServe</span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">I want to register as a:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                  role === 'customer'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5" /> Customer (Book Services)
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                  role === 'provider'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-800 shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-5 w-5" /> Service Provider
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">Full Name *</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Email Address *</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Password (min 6 chars) *</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Phone Number</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">City</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="San Francisco"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="123 Market Street, Apt 5"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Registering...' : `Create ${role === 'provider' ? 'Provider' : 'Customer'} Account`}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
