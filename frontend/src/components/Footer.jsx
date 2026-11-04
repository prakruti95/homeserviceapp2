import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Wrench, Phone, Mail, MapPin, 
  Clock, Heart, ExternalLink, ArrowRight 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
                HS
              </div>
              <span className="text-2xl font-black text-white tracking-tight">HomeServe</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The premier on-demand home services booking SaaS platform. Connect with certified plumbers, electricians, cleaners, and home technicians with upfront fixed pricing.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Verified Techs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>24/7 Booking</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/customer/browse" className="hover:text-blue-400 transition-colors">All Services Catalog</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-400 transition-colors">About HomeServe</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition-colors">Customer Support</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition-colors">Portal Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Top Services</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/customer/browse?category=1" className="hover:text-blue-400 transition-colors">Plumbing & Drains</Link>
              </li>
              <li>
                <Link to="/customer/browse?category=2" className="hover:text-blue-400 transition-colors">Electrical Repairs</Link>
              </li>
              <li>
                <Link to="/customer/browse?category=3" className="hover:text-blue-400 transition-colors">Deep Home Cleaning</Link>
              </li>
              <li>
                <Link to="/customer/browse?category=4" className="hover:text-blue-400 transition-colors">Appliance Diagnostic</Link>
              </li>
              <li>
                <Link to="/customer/browse?category=5" className="hover:text-blue-400 transition-colors">Painting & Finishing</Link>
              </li>
            </ul>
          </div>

          {/* Help & Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact & Safety</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>500 Howard Street, Suite 400, San Francisco, CA 94105</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>+1 (800) 555-SERV (7378)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                <span>support@homeserve.tech</span>
              </li>
              <li className="pt-2">
                <Link
                  to="/register?role=provider"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Become a Provider <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} HomeServe Technologies Inc. All rights reserved. Built for Home Services Booking SaaS Platform.
          </div>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/about" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-slate-400">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
