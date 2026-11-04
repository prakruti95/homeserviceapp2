import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  AlertCircle, MessageSquare, CheckCircle2, Clock, 
  Send, ShieldAlert, ChevronRight, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerComplaints() {
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([
    {
      id: 'DISP-1042',
      booking_id: 1,
      service_name: 'Emergency Pipe Leak Repair',
      category: 'Arrival Delay',
      description: 'Technician arrived 25 minutes after scheduled arrival window without advance notification.',
      status: 'resolved',
      resolution: 'Credit voucher of $20 applied to your account. Apologies for the inconvenience.',
      date: '2026-11-03',
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [issueCategory, setIssueCategory] = useState('Service Quality Issue');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadBookings() {
      try {
        const { data } = await api.get('/bookings/');
        const bList = data?.bookings || [];
        setBookings(bList);
        if (bList.length > 0) {
          setSelectedBookingId(String(bList[0].id));
        }
      } catch (err) {
        console.error('Failed to load bookings for disputes', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const handleFileComplaint = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the issue encountered');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const matched = bookings.find((b) => String(b.id) === String(selectedBookingId));
      const newComplaint = {
        id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        booking_id: selectedBookingId,
        service_name: matched?.service_name || 'Home Maintenance Service',
        category: issueCategory,
        description: description.trim(),
        status: 'under_investigation',
        resolution: 'Our Quality Assurance team is auditing technician dispatch notes. Response within 24 hours.',
        date: new Date().toISOString().split('T')[0],
      };
      setComplaints([newComplaint, ...complaints]);
      setSubmitting(false);
      setShowNewModal(false);
      setDescription('');
      toast.success('Dispute ticket registered. Support will follow up.');
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Service Disputes & Complaints</h1>
          <p className="text-xs text-gray-500 mt-1">
            File quality concerns, billing discrepancies, or schedule grievances under our 100% Satisfaction Guarantee.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start cursor-pointer"
        >
          <AlertCircle className="h-4 w-4" /> File New Dispute
        </button>
      </div>

      {/* Safety Guarantee Notice */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl shadow-sm flex items-start gap-4">
        <div className="h-10 w-10 bg-rose-500/20 text-rose-300 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/30">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-white">HomeServe Buyer Protection Program</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Every booking is backed by our full warranty assurance. If work performed is defective or fails inspection, HomeServe guarantees free re-servicing or a full dispute refund.
          </p>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Registered Service Tickets ({complaints.length})</h2>

        {complaints.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
            No complaints or disputes on record. Your service history is in good standing.
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                      {c.id}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      {c.service_name} (Booking #{c.booking_id})
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                    c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Category:</span> {c.category} • Filed on {c.date}
                </div>

                <p className="text-xs text-gray-700 bg-slate-50 p-3 rounded-xl border border-gray-100">
                  <strong className="text-gray-900 block mb-0.5">Complaint Summary:</strong>
                  {c.description}
                </p>

                {c.resolution && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                    <strong className="block mb-0.5 flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Support Operations Resolution:
                    </strong>
                    {c.resolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Dispute Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">File a Service Complaint</h3>
            <p className="text-xs text-gray-500 mt-1">Our mediation managers review tickets within 24 hours.</p>

            <form onSubmit={handleFileComplaint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Relevant Booking</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 bg-white"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} {b.service_name} ({b.scheduled_date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Issue Type</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500 bg-white"
                >
                  <option value="Service Quality Issue">Service Quality Issue (Workmanship)</option>
                  <option value="Arrival Delay">Arrival Delay / No Show</option>
                  <option value="Pricing / Billing Discrepancy">Pricing / Billing Discrepancy</option>
                  <option value="Technician Unprofessionalism">Technician Unprofessionalism</option>
                  <option value="Property Damage Claim">Property Damage Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Incident Specifics *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the issue encountered during service dispatch..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
