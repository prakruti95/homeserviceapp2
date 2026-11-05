import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Shield, Briefcase, User, Lock, Mail, ArrowRight, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const role = user.role?.toLowerCase();
      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin' || role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (role === 'provider') {
        navigate('/provider/dashboard');
      } else if (role === 'technician') {
        navigate('/technician/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      // error handled by api interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    try {
      const user = await login(demoEmail, demoPassword);
      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'super_admin') navigate('/admin/dashboard');
      else if (role === 'provider') navigate('/provider/dashboard');
      else if (role === 'technician') navigate('/technician/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      // error handled by api interceptor
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
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Evaluation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
              1-Click Demo Evaluation Logins
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@homeserve.com', 'superadmin123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Shield className="h-4 w-4 mb-1 text-purple-600" />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@homeserve.com', 'admin123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-rose-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Shield className="h-4 w-4 mb-1 text-rose-600" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('provider@homeserve.com', 'provider123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Briefcase className="h-4 w-4 mb-1 text-amber-600" />
                Provider
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('technician@homeserve.com', 'tech123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <Wrench className="h-4 w-4 mb-1 text-indigo-600" />
                Technician
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@homeserve.com', 'customer123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 transition-colors text-xs font-medium cursor-pointer"
              >
                <User className="h-4 w-4 mb-1 text-blue-600" />
                Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
