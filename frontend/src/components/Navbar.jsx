import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Settings, Bell, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const role = user.role?.toLowerCase();
    if (role === 'admin' || role === 'super_admin') return '/admin/dashboard';
    if (role === 'provider') return '/provider/dashboard';
    if (role === 'technician') return '/technician/dashboard';
    return '/customer/dashboard';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <Link to={getDashboardLink()} className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HS</span>
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight hidden sm:block">HomeServe</span>
            </Link>
          </div>

          {/* Desktop nav links for guests */}
          {!user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/customer/browse" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">All Services</Link>
              <Link to="/about" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">About Us</Link>
              <Link to="/contact" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">Support</Link>
              <Link to="/login" className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Get Started
              </Link>
            </div>
          )}

          {/* Authenticated user menu */}
          {user && (
            <div className="flex items-center gap-3">
              <Link
                to="/notifications"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition-colors hidden sm:block"
                title="Full Notifications Hub"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">
                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold text-gray-800 hidden sm:block">
                    {user.full_name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 bg-slate-50">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md uppercase">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4 text-blue-600" /> Dashboard
                      </Link>
                      <Link
                        to={user.role === 'provider' ? '/provider/profile' : '/customer/profile'}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4 text-gray-500" /> Profile & Settings
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Bell className="h-4 w-4 text-amber-500" /> Notifications Hub
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu toggle for guests */}
          {!user && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu for guests */}
      {!user && mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white p-4 space-y-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100">Home</Link>
          <Link to="/customer/browse" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100">All Services</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100">About Us</Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100">Support & FAQ</Link>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100">Sign In</Link>
          <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl text-center hover:bg-blue-700">Get Started</Link>
        </div>
      )}
    </nav>
  );
}
