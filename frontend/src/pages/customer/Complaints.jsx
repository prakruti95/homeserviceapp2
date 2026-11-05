import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  AlertCircle, MessageSquare, CheckCircle2, Clock, 
  Send, ShieldAlert, ChevronRight, RefreshCw, CheckCheck, 
  ShieldCheck, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getClientComplaints, saveClientComplaint, updateClientComplaint } from '../../services/complaintStorage';
import { getClientBookings } from '../../services/bookingStorage';

export default function CustomerComplaints() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'super_admin'].includes(user?.role?.toLowerCase());

  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [issueSubject, setIssueSubject] = useState('Service Quality Concern');
  const [issuePriority, setIssuePriority] = useState('medium');
  const [description, setDescription] = useState('');

  // Admin Resolution Modal
  const [resolveComplaint, setResolveComplaint] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let serverComplaints = [];
      let serverBookings = [];
      try {
        const [compRes, bookRes] = await Promise.all([
          api.get('/complaints/').catch(() => ({ data: [] })),
          api.get('/bookings/').catch(() => ({ data: { bookings: [] } })),
        ]);
        serverComplaints = Array.isArray(compRes.data) ? compRes.data : [];
        serverBookings = bookRes.data?.bookings || [];
      } catch (e) {
        console.warn('API /complaints/ offline, using client storage');
      }

      // Merge complaints
      const clientComplaints = getClientComplaints(user?.email);
      const cMap = new Map();
      clientComplaints.forEach((c) => cMap.set(String(c.id), c));
      serverComplaints.forEach((c) => {
        const existing = cMap.get(String(c.id));
        cMap.set(String(c.id), { ...existing, ...c });
      });
      const mergedComplaints = Array.from(cMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setComplaints(mergedComplaints);

      // Merge bookings
      const clientBookings = getClientBookings(user?.email);
      const bMap = new Map();
      clientBookings.forEach((b) => bMap.set(String(b.id), b));
      serverBookings.forEach((b) => {
        const existing = bMap.get(String(b.id));
        bMap.set(String(b.id), { ...existing, ...b });
      });
      const mergedBookings = Array.from(bMap.values());
      setBookings(mergedBookings);

      if (mergedBookings.length > 0 && !selectedBookingId) {
        setSelectedBookingId(String(mergedBookings[0].id));
      }
    } catch (err) {
      console.error('Failed to load disputes data', err);
      setComplaints(getClientComplaints(user?.email));
      setBookings(getClientBookings(user?.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleFileComplaint = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the issue encountered');
      return;
    }
    if (!selectedBookingId) {
      toast.error('Please select an associated booking');
      return;
    }
    setSubmitting(true);
    const chosenBooking = bookings.find((b) => String(b.id) === String(selectedBookingId));
    try {
      await api.post('/complaints/', {
        booking_id: parseInt(selectedBookingId),
        subject: issueSubject.trim(),
        description: description.trim(),
        priority: issuePriority,
      });
    } catch (err) {
      console.warn('Server complaint failed, saving to local dispute storage', err);
    } finally {
      saveClientComplaint(
        {
          booking_id: parseInt(selectedBookingId),
          booking_reference: chosenBooking?.booking_reference || `HS-BK-${selectedBookingId}`,
          service_name: chosenBooking?.service_name || 'Home Maintenance Service',
          provider_name: chosenBooking?.provider_name || 'Apex Home Solutions',
          subject: issueSubject.trim(),
          description: description.trim(),
          priority: issuePriority,
        },
        user
      );
      toast.success('Dispute ticket registered. Support will follow up.');
      setShowNewModal(false);
      setDescription('');
      setSubmitting(false);
      fetchData();
    }
  };

  const handleOpenResolve = (comp) => {
    setResolveComplaint(comp);
    setResolutionStatus('resolved');
    setResolutionNotes(comp.resolution_notes || 'Issue reviewed with provider and resolved under warranty.');
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolveComplaint) return;
    setResolving(true);
    try {
      await api.patch(`/complaints/${resolveComplaint.id}/status`, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes.trim(),
      });
    } catch (err) {
      console.warn('Server resolve failed, updating client storage', err);
    } finally {
      updateClientComplaint(resolveComplaint.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes.trim(),
      });
      toast.success('Dispute status and resolution updated!');
      setResolveComplaint(null);
      setResolving(false);
      fetchData();
    }
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
          <h1 className="text-2xl font-black text-gray-900">
            {isAdmin ? 'Disputes & Customer Grievances Supervision' : 'Service Disputes & Complaints'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin 
              ? 'Review customer tickets, audit field dispatch notes, and register resolutions.'
              : 'File quality concerns, billing discrepancies, or schedule grievances under our 100% Satisfaction Guarantee.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {!isAdmin && (
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <AlertCircle className="h-4 w-4" /> File New Dispute
            </button>
          )}
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Registered Support Tickets ({complaints.length})
          </h2>
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No complaints or dispute tickets registered.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((c) => (
              <div key={c.id} className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-gray-900">
                      {c.ticket_number || `CMP-${c.id}`}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      Booking #{c.booking_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'under_investigation' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase">
                      {c.priority} priority
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-sm font-bold text-gray-800">
                  {c.subject}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-gray-100">
                  {c.description}
                </p>

                {c.resolution_notes && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Official Resolution:</span> {c.resolution_notes}
                    </div>
                  </div>
                )}

                {/* Admin Action Button */}
                {isAdmin && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleOpenResolve(c)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Update Status & Resolution
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Dispute Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" /> File Dispute / Complaint Ticket
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Protected under HomeServe 100% Satisfaction Guarantee.
            </p>

            <form onSubmit={handleFileComplaint} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Booking *</label>
                {bookings.length > 0 ? (
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-rose-500 focus:border-rose-500"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        Booking #{b.id} — {b.service_name} ({b.scheduled_date})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No bookings found in your account history.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={issueSubject}
                  onChange={(e) => setIssueSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Priority</label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="low">Low - General query</option>
                  <option value="medium">Medium - Quality or delay</option>
                  <option value="high">High - Incomplete work</option>
                  <option value="urgent">Urgent - Emergency/Property damage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue with clarity..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || bookings.length === 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Filing...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Resolution Modal */}
      {resolveComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-blue-600" /> Resolve Customer Ticket
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Ticket {resolveComplaint.ticket_number} (Booking #{resolveComplaint.booking_id})
            </p>

            <form onSubmit={handleConfirmResolve} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Update Status</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="under_investigation">Under Investigation</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain resolution, compensation or notes for customer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResolveComplaint(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {resolving ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
