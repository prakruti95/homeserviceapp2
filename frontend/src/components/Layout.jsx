import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  LayoutDashboard, Search, CalendarDays, Star, Briefcase,
  CheckSquare, Clock, UserCircle, DollarSign, Users,
  FolderOpen, BookOpen, X, AlertCircle, Wrench, Bell
} from 'lucide-react';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/browse', label: 'Browse Services', icon: Search },
  { to: '/customer/bookings', label: 'My Bookings', icon: CalendarDays },
  { to: '/customer/payments', label: 'Payment History', icon: DollarSign },
  { to: '/customer/reviews', label: 'Reviews', icon: Star },
  { to: '/customer/complaints', label: 'Disputes & Support', icon: AlertCircle },
  { to: '/customer/profile', label: 'Profile Settings', icon: UserCircle },
];

const providerLinks = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/bookings', label: 'Manage Orders', icon: CheckSquare },
  { to: '/provider/availability', label: 'Working Hours', icon: Clock },
  { to: '/provider/earnings', label: 'Earnings & Payouts', icon: DollarSign },
  { to: '/provider/profile', label: 'Business Profile', icon: UserCircle },
];

const technicianLinks = [
  { to: '/technician/dashboard', label: 'Technician Hub', icon: Wrench },
  { to: '/technician/dashboard', label: 'Assigned Dispatches', icon: CheckSquare },
  { to: '/customer/profile', label: 'My Account', icon: UserCircle },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Console Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/services', label: 'Catalog & Services', icon: FolderOpen },
  { to: '/admin/bookings', label: 'All Bookings', icon: BookOpen },
  { to: '/customer/complaints', label: 'Review Disputes', icon: AlertCircle },
];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'provider' ? providerLinks
    : user?.role === 'technician' ? technicianLinks
    : customerLinks;

  const isPublicStandalone = ['/', '/index.html', '/index', '/about', '/contact'].includes(location.pathname);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 lg:hidden flex items-center justify-between">
        <span className="font-semibold text-gray-900">Platform Navigation</span>
        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to + link.label}
            to={link.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-3 bg-blue-50/70 rounded-xl border border-blue-100">
          <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Signed In</p>
          <p className="text-xs font-bold text-blue-950 truncate">{user?.full_name || user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white">
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );

  if (!user || isPublicStandalone) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <div>
          <Navbar />
          <Outlet />
        </div>
        {!isPublicStandalone && <Footer />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-0 w-64 h-screen lg:h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transform transition-transform duration-200 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <SidebarContent />
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
