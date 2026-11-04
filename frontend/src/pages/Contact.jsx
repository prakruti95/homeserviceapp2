import { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  Send, ShieldCheck, HelpCircle, ChevronDown, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Service Booking Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'How does HomeServe verify service providers?',
      a: 'All technicians undergo identity verification, thorough background checks, professional licensing audits, and customer satisfaction monitoring before taking active assignments.',
    },
    {
      q: 'What if I need to cancel or reschedule my service appointment?',
      a: 'You can cancel or reschedule any pending or confirmed booking directly from your "My Bookings" portal with zero cancellation penalties up to 2 hours before the scheduled arrival.',
    },
    {
      q: 'How does payment and invoicing work?',
      a: 'You can securely pay via credit card, debit card, or cash upon job completion. Once finished, an itemized tax invoice is immediately generated and stored in your profile.',
    },
    {
      q: 'Are parts and materials covered in the base pricing?',
      a: 'Base pricing covers standard professional diagnostic labor and essential tooling. If specialized commercial parts are needed, your technician presents an approved quote before installation.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please complete all required fields');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Your message has been sent to HomeServe Support!');
    }, 600);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            24/7 Dedicated Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-black mt-3">We’re Here to Help You</h1>
          <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
            Questions regarding an upcoming appointment, provider partnerships, or platform inquiries? Connect with our team.
          </p>
        </div>
      </section>

      {/* Main Form & Contact Info */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Direct Contact Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Direct Support Channels</h2>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">Telephone Support</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">+1 (800) 555-SERV (7378)</div>
                  <div className="text-[11px] text-gray-500">Toll-free 24/7 Customer Hotline</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">Email Correspondence</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">support@homeserve.tech</div>
                  <div className="text-[11px] text-gray-500">Average response time: &lt; 15 mins</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">Global Headquarters</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">500 Howard Street, Suite 400</div>
                  <div className="text-[11px] text-gray-500">San Francisco, CA 94105, USA</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">Operating Hours</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">Monday – Sunday</div>
                  <div className="text-[11px] text-gray-500">Dispatch active 7:00 AM – 10:00 PM PST</div>
                </div>
              </div>
            </div>

            {/* Emergency Banner */}
            <div className="p-5 bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm">
              <div className="font-bold text-sm flex items-center gap-2 text-blue-200">
                <ShieldCheck className="h-4 w-4" /> Immediate Urgent Dispatch
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Facing severe plumbing pipe bursts or electrical outages? Book through the portal with <strong>Emergency Pipe Leak</strong> or call dispatch line #1.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Send an Inquiry to Support</h2>
              <p className="text-xs text-gray-500 mb-6">
                Fill out the form below and an operations team member will assist you immediately.
              </p>

              {submitted ? (
                <div className="p-8 text-center bg-blue-50/60 rounded-2xl border border-blue-100">
                  <CheckCircle2 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900">Thank you for reaching out!</h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                    Your ticket #{Math.floor(100000 + Math.random() * 900000)} has been generated. We will reply to {formData.email} shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'Service Booking Inquiry', message: '' });
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Inquiry Category</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="Service Booking Inquiry">Service Booking Inquiry</option>
                        <option value="Technician Dispatch Question">Technician Dispatch Question</option>
                        <option value="Billing & Invoicing Issue">Billing & Invoicing Issue</option>
                        <option value="Provider Partnership Application">Provider Partnership Application</option>
                        <option value="Technical Platform Support">Technical Platform Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Detailed Message *</label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide specifics regarding your home service request, address, or question..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> {submitting ? 'Transmitting...' : 'Send Message to Support'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Quick Answers</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-gray-900 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-50 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
