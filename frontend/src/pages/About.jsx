import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Award, Users, ThumbsUp, Wrench, 
  Clock, HeartHandshake, CheckCircle2, ArrowRight 
} from 'lucide-react';

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            About HomeServe Technologies
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 tracking-tight leading-tight">
            Transforming Home Services <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-sky-400">
              Through Intelligent Technology.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            HomeServe is a modern SaaS platform connecting residential homeowners with vetted master technicians, upfront standard pricing, and real-time appointment dispatching.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Our Core Mission</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">
              Eliminating the stress, guesswork, and opacity in home repairs.
            </h2>
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
              Founded with the conviction that booking a licensed plumber, master electrician, or deep cleaning crew should be as seamless as ordering a ride or reserving a table.
            </p>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              We vet every professional, guarantee fixed transparent rates before work begins, and back every completed job with our 100% HomeServe Service Guarantee.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-3xl font-black text-blue-600">50K+</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Services Completed</div>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-3xl font-black text-blue-600">4.9 / 5</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Average Customer Rating</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Background Checked & Certified</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Multi-state criminal background checks, license verification, and skill evaluations for every provider on the platform.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Upfront Fixed Standard Pricing</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Say goodbye to surprise estimates and inflated emergency fees. Clear hourly rates and fixed-price packages.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Real-Time Dispatch Tracking</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Track provider dispatches, live updates, arrival notices, and digital invoicing in your dedicated dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Values */}
      <section className="py-16 bg-white border-y border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Company Leadership</span>
          <h2 className="text-3xl font-black text-gray-900 mt-2">Built by Home Improvement Pioneers</h2>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200 text-center">
              <div className="h-20 w-20 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">
                SR
              </div>
              <h3 className="font-bold text-gray-900 text-base">Sarah Reynolds</h3>
              <p className="text-xs text-blue-600 font-semibold">Chief Executive Officer</p>
              <p className="text-xs text-gray-500 mt-2">Former VP of Operations at ServiceTitan with 15+ years scaling on-demand dispatch networks.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200 text-center">
              <div className="h-20 w-20 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">
                MT
              </div>
              <h3 className="font-bold text-gray-900 text-base">Marcus Thorne</h3>
              <p className="text-xs text-indigo-600 font-semibold">Chief Technology Officer</p>
              <p className="text-xs text-gray-500 mt-2">Distributed systems architect, former tech lead specializing in real-time booking algorithms.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200 text-center">
              <div className="h-20 w-20 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">
                EK
              </div>
              <h3 className="font-bold text-gray-900 text-base">Elena Rostova</h3>
              <p className="text-xs text-emerald-600 font-semibold">Head of Provider Safety</p>
              <p className="text-xs text-gray-500 mt-2">Master tradesperson overseer leading our rigorous technician accreditation programs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900">Experience the HomeServe Difference</h2>
        <p className="text-gray-600 text-sm mt-3 max-w-md mx-auto">
          Schedule your service in seconds or partner with our dispatch network today.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/customer/browse"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Browse Services
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 border border-gray-300 hover:bg-white text-gray-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
