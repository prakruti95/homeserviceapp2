import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import {
  LayoutDashboard, Search, CalendarDays, Star, Briefcase,
  CheckSquare, Clock, UserCircle, DollarSign, Users,
  FolderOpen, BookOpen, X
} from 'lucide-react';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/browse', label: 'Browse Services', icon: Search },
  { to: '/customer/bookings', label: 'My Bookings', icon: CalendarDays },
  { to: '/customer/reviews', label: 'Reviews', icon: Star },
];

const providerLinks = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/bookings', label: 'Manage Bookings', icon: CheckSquare },
  { to: '/provider/availability', label: 'Availability', icon: Clock },
  { to: '/provider/profile', label: 'Profile', icon: UserCircle },
  { to: '/provider/earnings', label: 'Earnings', icon: DollarSign },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/services', label: 'Manage Services', icon: FolderOpen },
  { to: '/admin/bookings', label: 'Manage Bookings', icon: BookOpen },
];

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'provider' ? providerLinks
    : customerLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 lg:hidden flex items-center justify-between">
        <span className="font-semibold text-gray-900">Menu</span>
        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="h-5 w-5 flex-shrink-0" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Logged in as</p>
          <p className="text-sm font-semibold text-blue-900 truncate">{user?.full_name || user?.email}</p>
          <p className="text-xs text-blue-500 capitalize">{user?.role}</p>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
  );
}
