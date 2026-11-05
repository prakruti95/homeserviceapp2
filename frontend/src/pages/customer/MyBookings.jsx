import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  CalendarDays, Clock, MapPin, DollarSign, Star, 
  XCircle, CheckCircle2, AlertCircle, RefreshCw, 
  FileText, CreditCard, AlertTriangle, Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import InvoiceModal from '../../components/InvoiceModal';
import DemoPaymentModal from '../../components/DemoPaymentModal';
import { getClientBookings } from '../../services/bookingStorage';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reschedule Modal State
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Cancel Modal State
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Complaint Modal State
  const [complaintBooking, setComplaintBooking] = useState(null);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('medium');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Demo payment modal state
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let serverList = [];
      try {
        const { data } = await api.get('/bookings/');
        serverList = data?.bookings || [];
      } catch (e) {
        console.warn('API /bookings/ offline, using client storage');
      }

      const clientList = getClientBookings(user?.email);
      const map = new Map();

      // Client bookings take precedence if recently updated locally
      clientList.forEach((b) => map.set(String(b.id), b));
      serverList.forEach((b) => {
        const existing = map.get(String(b.id));
        map.set(String(b.id), { ...existing, ...b });
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );

      setBookings(merged);
    } catch (err) {
      console.error('Failed to load bookings', err);
      setBookings(getClientBookings(user?.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenReschedule = (booking) => {
    setRescheduleBooking(booking);
    setNewDate(booking.scheduled_date);
    setNewTime(booking.scheduled_time?.slice(0, 5) || '10:00');
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleBooking) return;
    setSubmittingReschedule(true);
    try {
      const timeFmt = newTime.length === 5 ? `${newTime}:00` : newTime;
      await api.patch(`/bookings/${rescheduleBooking.id}/reschedule`, {
        scheduled_date: newDate,
        scheduled_time: timeFmt,
      });
      toast.success('Booking successfully rescheduled');
      setRescheduleBooking(null);
      fetchBookings();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleOpenCancel = (booking) => {
    setCancelBooking(booking);
    setCancelReason('Customer schedule change');
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelBooking) return;
    setSubmittingCancel(true);
    try {
      await api.patch(`/bookings/${cancelBooking.id}/cancel`, {
        cancellation_reason: cancelReason.trim() || 'Cancelled by customer',
      });
      toast.success('Booking cancelled successfully');
      setCancelBooking(null);
      fetchBookings();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleProcessPayment = async (booking) => {
    setPayingBookingId(booking.id);
    try {
      await api.post('/payments/process-demo', {
        booking_id: booking.id,
        amount: booking.total_price,
        payment_method: 'credit_card',
        demo_card_number: '4242424242424242',
      });
      toast.success('Payment completed & booking confirmed!');
      fetchBookings();
    } catch (err) {
      // toast shown
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleOpenInvoice = async (booking) => {
    try {
      const { data: invoice } = await api.get(`/invoices/booking/${booking.id}`);
      setSelectedInvoice({
        booking: {
          ...booking,
          id: booking.id,
          total_price: invoice.total_amount,
        },
        payment: {
          status: invoice.status === 'paid' ? 'completed' : 'pending',
          payment_method: 'credit_card',
        },
      });
    } catch {
      // Fallback display if not generated yet
      setSelectedInvoice({
        booking,
        payment: { status: booking.status === 'completed' ? 'completed' : 'pending' },
      });
    }
  };

  const handleOpenComplaint = (booking) => {
    setComplaintBooking(booking);
    setComplaintSubject(`Service Concern for Booking #${booking.id}`);
    setComplaintDesc('');
    setComplaintPriority('medium');
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintBooking || !complaintDesc.trim()) return;
    setSubmittingComplaint(true);
    try {
      await api.post('/complaints/', {
        booking_id: complaintBooking.id,
        subject: complaintSubject.trim(),
        description: complaintDesc.trim(),
        priority: complaintPriority,
      });
      toast.success('Dispute ticket submitted. Support will review shortly.');
      setComplaintBooking(null);
    } catch (err) {
      // toast shown
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleOpenReview = (booking) => {
    setReviewBooking(booking);
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews/', {
        booking_id: reviewBooking.id,
        rating: Number(rating),
        comment: comment.trim(),
      });
      toast.success('Thank you! Your review has been submitted.');
      setReviewBooking(null);
      fetchBookings();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Service Bookings</h1>
          <p className="text-xs text-gray-500 mt-1">Manage appointments, reschedule, settle payments and view invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link
            to="/customer/browse"
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Book New Service
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['all', 'pending', 'confirmed', 'provider_assigned', 'in_progress', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize shrink-0 transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No bookings found</h3>
          <p className="text-xs text-gray-500 mt-1">There are no bookings matching this status criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-base">
                    {b.service_name || 'Home Service'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {b.booking_reference || `#BK-${b.id}`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'provider_assigned' ? 'bg-purple-100 text-purple-700' :
                    b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                    b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                  {b.payment_status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      b.payment_status === 'completed' || b.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {b.payment_status === 'completed' || b.payment_status === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    {b.scheduled_date} at {b.scheduled_time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    {b.address}, {b.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    {b.duration_minutes} minutes
                  </span>
                </div>

                {b.technician_name && (
                  <div className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-md inline-block">
                    Assigned Field Tech: {b.technician_name}
                  </div>
                )}

                {b.notes && (
                  <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-gray-100 max-w-xl">
                    <span className="font-semibold text-gray-700">Notes:</span> {b.notes}
                  </p>
                )}
              </div>

              {/* Price & Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 uppercase font-bold">Total Price</span>
                  <div className="text-xl font-black text-gray-900">${Number(b.total_price || 0).toFixed(2)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {/* Demo Payment Button */}
                  {(b.status === 'pending' || b.payment_status === 'pending') && b.status !== 'cancelled' && (
                    <button
                      onClick={() => setPaymentModalBooking(b)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Demo Payment
                    </button>
                  )}

                  {/* Reschedule Button */}
                  {['pending', 'confirmed'].includes(b.status) && (
                    <button
                      onClick={() => handleOpenReschedule(b)}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-600" /> Reschedule
                    </button>
                  )}

                  {/* Cancel Button */}
                  {['pending', 'confirmed'].includes(b.status) && (
                    <button
                      onClick={() => handleOpenCancel(b)}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  {/* View Invoice */}
                  {['confirmed', 'provider_assigned', 'in_progress', 'completed'].includes(b.status) && (
                    <button
                      onClick={() => handleOpenInvoice(b)}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" /> Tax Invoice
                    </button>
                  )}

                  {/* Leave Review */}
                  {b.status === 'completed' && (
                    <button
                      onClick={() => handleOpenReview(b)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Star className="h-3.5 w-3.5 fill-white" /> Review
                    </button>
                  )}

                  {/* Report Dispute */}
                  <button
                    onClick={() => handleOpenComplaint(b)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Report Issue"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Reschedule Appointment</h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a new date and time for booking #{rescheduleBooking.id} ({rescheduleBooking.service_name})
            </p>

            <form onSubmit={handleConfirmReschedule} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Time Slot</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingReschedule}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
            <p className="text-xs text-gray-500 mt-1">
              Please share the reason for cancelling booking #{cancelBooking.id}
            </p>

            <form onSubmit={handleConfirmCancel} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="E.g., Schedule conflict, found alternative solution, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCancelBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Rate & Review Service</h3>
            <p className="text-xs text-gray-500 mt-1">
              Share your feedback for <strong>{reviewBooking.service_name}</strong>
            </p>

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gray-700 ml-2">{rating} out of 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the punctuality, cleanliness, and quality of service?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">File Service Issue / Dispute</h3>
            <p className="text-xs text-gray-500 mt-1">
              Registered under HomeServe 100% Satisfaction Guarantee for booking #{complaintBooking.id}
            </p>

            <form onSubmit={handleSubmitComplaint} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Priority</label>
                <select
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Minor question or feedback</option>
                  <option value="medium">Medium - Service quality or delay</option>
                  <option value="high">High - Incomplete work or damage</option>
                  <option value="urgent">Urgent - Safety or emergency issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description of Issue</label>
                <textarea
                  rows={3}
                  required
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Please provide details regarding what happened..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setComplaintBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          booking={selectedInvoice.booking}
          payment={selectedInvoice.payment}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Demo Payment Modal */}
      {paymentModalBooking && (
        <DemoPaymentModal
          booking={paymentModalBooking}
          customerName={user?.full_name}
          onClose={() => setPaymentModalBooking(null)}
          onSuccess={() => {
            fetchBookings();
          }}
          onOpenInvoice={(booking) => {
            handleOpenInvoice(booking);
          }}
        />
      )}
    </div>
  );
}
