import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Wrench, CheckSquare, Clock, MapPin, Phone, 
  Play, CheckCircle2, AlertCircle, RefreshCw, Navigation, 
  Camera, Image as ImageIcon, Send, Truck, Check, History, 
  FileText, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getClientBookings, updateClientBooking } from '../../services/bookingStorage';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Photo Upload Modal State
  const [photoBooking, setPhotoBooking] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoType, setPhotoType] = useState('completion');
  const [bookingImages, setBookingImages] = useState([]);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  // Completion Remarks Modal State
  const [completeBooking, setCompleteBooking] = useState(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completingJob, setCompletingJob] = useState(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      let serverBookings = [];
      let serverAssignments = [];
      try {
        const [assignRes, bookRes] = await Promise.all([
          api.get('/technicians/me/assignments').catch(() => null),
          api.get('/bookings/').catch(() => null),
        ]);
        serverAssignments = assignRes?.data || [];
        serverBookings = bookRes?.data?.bookings || [];
      } catch {
        // api fallback
      }

      setAssignments(serverAssignments);

      const clientBookings = getClientBookings('technician@homeserve.com');
      const bMap = new Map();
      clientBookings.forEach((b) => bMap.set(String(b.id), b));
      serverBookings.forEach((b) => {
        const existing = bMap.get(String(b.id));
        bMap.set(String(b.id), { ...existing, ...b });
      });

      const merged = Array.from(bMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setBookings(merged);
    } catch (err) {
      console.error('Failed to load technician work orders', err);
      setBookings(getClientBookings('technician@homeserve.com'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, remarks = null) => {
    setUpdatingId(bookingId);
    try {
      const matchAssign = assignments.find((a) => a.booking?.id === bookingId);
      if (matchAssign) {
        await api.patch(`/technicians/assignments/${matchAssign.assignment_id}/status`, {
          status: newStatus,
          notes: remarks,
        }).catch(() => {});
      } else {
        await api.patch(`/bookings/${bookingId}/status`, { status: newStatus }).catch(() => {});
      }
    } finally {
      updateClientBooking(bookingId, {
        status: newStatus,
        completion_notes: remarks || undefined,
      });
      toast.success(`Job status changed to ${newStatus.replace('_', ' ')}`);
      setUpdatingId(null);
      fetchWorkOrders();
    }
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!completeBooking) return;
    setCompletingJob(true);
    try {
      await handleUpdateStatus(completeBooking.id, 'completed', completionRemarks.trim());
      toast.success('Work order completed and signed off successfully!');
      setCompleteBooking(null);
      setCompletionRemarks('');
    } finally {
      setCompletingJob(false);
    }
  };

  const handleOpenPhotoModal = async (booking) => {
    setPhotoBooking(booking);
    setPhotoUrl('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80');
    setPhotoCaption('Completed installation and safety testing inspection');
    setPhotoType('completion');
    try {
      const rawStored = localStorage.getItem(`homeserve_booking_photos_${booking.id}`);
      const localPhotos = rawStored ? JSON.parse(rawStored) : [];
      setBookingImages(localPhotos);
    } catch {
      setBookingImages([]);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoBooking || !photoUrl.trim()) return;
    setSubmittingPhoto(true);
    try {
      const newImg = {
        id: Date.now(),
        image_url: photoUrl.trim(),
        caption: photoCaption.trim() || 'Work site photo log',
        image_type: photoType,
        created_at: new Date().toISOString(),
      };
      const rawStored = localStorage.getItem(`homeserve_booking_photos_${photoBooking.id}`);
      const localPhotos = rawStored ? JSON.parse(rawStored) : [];
      localPhotos.unshift(newImg);
      localStorage.setItem(`homeserve_booking_photos_${photoBooking.id}`, JSON.stringify(localPhotos));
      setBookingImages(localPhotos);
      toast.success('Work verification photo attached!');
      setPhotoCaption('');
    } catch (err) {
      toast.error('Failed to attach photo');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const activeDispatches = bookings.filter((b) => 
    ['confirmed', 'provider_assigned', 'in_progress'].includes(b.status)
  );
  const completedJobs = bookings.filter((b) => b.status === 'completed');

  const displayedList = activeTab === 'active' ? activeDispatches : completedJobs;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
            Field Technician Console
          </span>
          <h1 className="text-3xl font-black mt-2">Active Field Dispatches</h1>
          <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-lg">
            Welcome, <strong>{user?.full_name}</strong>. Record GPS job arrivals, progress work orders, upload before/after photos, and complete on-site services.
          </p>
        </div>
        <button
          onClick={fetchWorkOrders}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Sync Dispatches
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeDispatches.length}</div>
            <div className="text-xs text-gray-500 font-medium">Assigned Active Jobs</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {bookings.filter((b) => b.status === 'in_progress').length}
            </div>
            <div className="text-xs text-gray-500 font-medium">Currently In Progress</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{completedJobs.length}</div>
            <div className="text-xs text-gray-500 font-medium">Completed Jobs History</div>
          </div>
        </div>
      </div>

      {/* Work Orders Queue & History Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Field Dispatch Queue</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assigned customer work orders, arrival reporting, and photo sign-offs</p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-gray-200 self-start">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Queue ({activeDispatches.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Job History ({completedJobs.length})
            </button>
          </div>
        </div>

        {displayedList.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            {activeTab === 'active' 
              ? 'No active work orders dispatched currently.' 
              : 'No completed job history recorded yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedList.map((b) => (
              <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-base">
                      #{b.id} {b.service_name}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {b.booking_reference || `#BK-${b.id}`}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      b.status === 'provider_assigned' ? 'bg-purple-100 text-purple-700' :
                      b.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                      b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      b.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium text-gray-800">
                      Customer: {b.customer_name || 'Homeowner'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      {b.scheduled_date} at {b.scheduled_time} ({b.duration_minutes}m)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {b.address}, {b.city}
                    </span>
                  </div>

                  {b.notes && (
                    <div className="p-2.5 bg-blue-50/60 rounded-xl text-xs text-blue-900 border border-blue-100">
                      <strong>Customer Special Note:</strong> {b.notes}
                    </div>
                  )}
                </div>

                {/* Technician Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(b.address + ', ' + b.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs flex items-center gap-1"
                    title="Open Navigation"
                  >
                    <Navigation className="h-3.5 w-3.5 text-blue-600" /> Maps
                  </a>

                  {/* Photo Log Button */}
                  <button
                    onClick={() => handleOpenPhotoModal(b)}
                    className="px-3 py-1.5 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" /> Photo Log
                  </button>

                  {/* Mark En Route / Arrived On Site */}
                  {b.status === 'provider_assigned' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Truck className="h-3.5 w-3.5" /> Mark Arrived on Site
                    </button>
                  )}

                  {b.status === 'confirmed' && (
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" /> Start Service
                    </button>
                  )}

                  {b.status === 'in_progress' && (
                    <button
                      onClick={() => setCompleteBooking(b)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Sign Off & Complete
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" /> Job Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Remarks Modal */}
      {completeBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Sign Off Work Order #{completeBooking.id}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {completeBooking.service_name} for {completeBooking.customer_name}
            </p>

            <form onSubmit={handleConfirmCompletion} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Completion Remarks / Work Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  placeholder="E.g., Successfully cleared blockage, replaced rubber gasket, inspected water pressure."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCompleteBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingJob}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {completingJob ? 'Signing off...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Log Modal */}
      {photoBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" /> Work Verification & Photo Log
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Booking #{photoBooking.id} — {photoBooking.service_name}
            </p>

            {/* Existing Images Gallery */}
            {bookingImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-bold text-gray-700 block">Existing Photo Logs ({bookingImages.length}):</span>
                <div className="grid grid-cols-2 gap-3">
                  {bookingImages.map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-slate-50">
                      <img src={img.image_url} alt={img.caption || 'Work log'} className="w-full h-28 object-cover" />
                      <div className="p-2 text-[11px] text-gray-700 font-medium">
                        {img.caption || 'Verification photo'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Photo Form */}
            <form onSubmit={handleUploadPhoto} className="mt-5 space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Photo URL</label>
                <input
                  type="url"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Photo Stage</label>
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="before">Before Work</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completion">Completion / Signoff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Caption</label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Inspection completed..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPhotoBooking(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingPhoto}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submittingPhoto ? 'Uploading...' : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
