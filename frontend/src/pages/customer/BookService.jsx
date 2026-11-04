import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Calendar, Clock, MapPin, CreditCard, ShieldCheck, CheckCircle2, 
  ArrowLeft, FileText, UserCheck, DollarSign, Tag, Check, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BookService() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const providerParam = searchParams.get('provider');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(providerParam || '');
  const [providerAvailability, setProviderAvailability] = useState([]);
  
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [address, setAddress] = useState(user?.address || '123 Market Street, Apt 4B');
  const [city, setCity] = useState(user?.city || 'San Francisco');
  const [zipCode, setZipCode] = useState(user?.zip_code || '94103');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [srvRes, provRes] = await Promise.all([
          api.get('/services/?limit=100'),
          api.get('/providers/'),
        ]);
        const sList = srvRes.data?.services || [];
        setServices(sList);
        if (serviceId) {
          setSelectedServiceId(serviceId);
        } else if (sList.length > 0 && !selectedServiceId) {
          setSelectedServiceId(String(sList[0].id));
        }

        const rawProviders = provRes.data;
        const pList = Array.isArray(rawProviders) ? rawProviders : (rawProviders?.providers || []);
        setProviders(pList);
        if (providerParam) {
          setSelectedProviderId(providerParam);
        } else if (pList.length > 0 && !selectedProviderId) {
          // Default to first provider's user_id or id
          setSelectedProviderId(String(pList[0].user_id || pList[0].id));
        }
      } catch (err) {
        console.error('Failed to load booking form data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [serviceId, providerParam]);

  // Load provider availability when selected provider changes
  useEffect(() => {
    if (!selectedProviderId) return;
    async function loadAvailability() {
      try {
        const { data } = await api.get(`/providers/${selectedProviderId}/availability`);
        setProviderAvailability(Array.isArray(data) ? data : []);
      } catch {
        setProviderAvailability([]);
      }
    }
    loadAvailability();
  }, [selectedProviderId]);

  const activeService = services.find((s) => String(s.id) === String(selectedServiceId));
  const activeProvider = providers.find(
    (p) => String(p.id) === String(selectedProviderId) || String(p.user_id) === String(selectedProviderId)
  );

  const basePrice = activeService?.base_price || 99.0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0.0;
  const totalPrice = Math.max(0.0, Number((basePrice - discountAmount).toFixed(2)));

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code (e.g. WELCOME20, SAVE10)');
      return;
    }
    setValidatingCoupon(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code,
        service_id: selectedServiceId ? parseInt(selectedServiceId) : null,
      });
      setAppliedCoupon(data);
      toast.success(`Coupon ${code} applied: $${data.discount_amount.toFixed(2)} savings!`);
    } catch (err) {
      setAppliedCoupon(null);
      // toast shown by interceptor
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      toast.error('Please choose a service to book');
      return;
    }
    if (!address.trim()) {
      toast.error('Please provide a service delivery address');
      return;
    }

    setSubmitting(true);
    try {
      const providerIdNum = activeProvider ? (activeProvider.user_id || activeProvider.id) : 2;
      const bookingPayload = {
        service_id: parseInt(selectedServiceId),
        provider_id: providerIdNum,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
        duration_minutes: activeService?.duration_minutes || 60,
        total_price: totalPrice,
        address: address.trim(),
        city: city.trim() || 'San Francisco',
        zip_code: zipCode.trim() || '94103',
        notes: notes.trim() || 'Customer booking request',
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
      };

      const { data: booking } = await api.post('/bookings/', bookingPayload);

      // If credit card selected, execute demo payment confirmation
      if (paymentMethod === 'credit_card') {
        try {
          await api.post('/payments/process-demo', {
            booking_id: booking.id,
            amount: booking.total_price,
            payment_method: 'credit_card',
            demo_card_number: '4242424242424242',
          });
          booking.status = 'confirmed';
        } catch (payErr) {
          console.warn('Demo payment processing info:', payErr);
        }
      }

      setSuccessBooking(booking);
      toast.success('Service successfully booked!');
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (successBooking) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-lg my-8">
        <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
          {successBooking.status === 'confirmed' ? 'Booking Confirmed & Settled' : 'Booking Request Placed'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3">
          Your reservation is confirmed!
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          Booking Ref: {successBooking.booking_reference || `#HS-BK-${successBooking.id}`}
        </p>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
          Service reserved for <strong>{activeService?.name || 'Selected Service'}</strong> on{' '}
          <strong>{scheduledDate}</strong> at <strong>{scheduledTime}</strong>.
        </p>

        <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-gray-200 text-left space-y-2 text-xs text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">Service:</span>
            <span className="font-semibold">{activeService?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Assigned Provider:</span>
            <span className="font-semibold">{activeProvider?.business_name || activeProvider?.user_name || 'Certified Home Pro'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Scheduled Date & Time:</span>
            <span className="font-semibold">{scheduledDate} at {scheduledTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service Location:</span>
            <span className="font-semibold">{address}, {city}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600">
              <span>Coupon Discount ({appliedCoupon.code}):</span>
              <span className="font-semibold">-${appliedCoupon.discount_amount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-500 font-bold">Total Charged:</span>
            <span className="font-black text-gray-900 text-sm">${successBooking.total_price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Status:</span>
            <span className="font-semibold text-emerald-600">
              {paymentMethod === 'credit_card' ? 'Paid via Demo Card (Instant Confirmation)' : 'Pay on Completion (Cash)'}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/customer/bookings"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            View in My Bookings
          </Link>
          <Link
            to="/customer/browse"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Book Another Service
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/customer/browse" className="text-gray-500 hover:text-gray-700 p-1 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Schedule a Service</h1>
          <p className="text-xs text-gray-500">Select provider, preferred schedule, and service location details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Service Selection */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">1</span>
              Choose Service
            </h2>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.category?.name ? `[${srv.category.name}] ` : ''}{srv.name} — ${srv.base_price.toFixed(2)} ({srv.duration_minutes}m)
                </option>
              ))}
            </select>

            {activeService && (
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <div className="font-semibold">{activeService.name}</div>
                <div className="text-gray-600 mt-1">{activeService.description}</div>
              </div>
            )}
          </div>

          {/* 2. Provider Selection & Availability */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">2</span>
              Select Certified Provider
            </h2>
            
            {providers.length > 0 ? (
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {providers.map((p) => {
                  const pVal = String(p.user_id || p.id);
                  return (
                    <option key={p.id} value={pVal}>
                      {p.business_name || p.user_name || 'Verified Provider'} — ★ {p.average_rating || 4.9} ({p.service_area || 'San Francisco'})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="text-xs text-gray-500 italic">Defaulting to HomeServe Certified Dispatch Network</div>
            )}

            {activeProvider && (
              <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Verified Partner: <strong>{activeProvider.business_name || activeProvider.user_name}</strong></span>
                </div>
                <span className="font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Available for Booking
                </span>
              </div>
            )}
          </div>

          {/* 3. Schedule Date & Time */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">3</span>
              Date & Preferred Time Slot
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Appointment Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Arrival Time Slot</label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="09:00">09:00 AM - Morning Slot</option>
                  <option value="10:00">10:00 AM - Morning Slot</option>
                  <option value="11:30">11:30 AM - Late Morning</option>
                  <option value="13:00">01:00 PM - Early Afternoon</option>
                  <option value="14:30">02:30 PM - Afternoon Slot</option>
                  <option value="16:00">04:00 PM - Late Afternoon</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Service Location */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">4</span>
              Service Location & Notes
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Street Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Apt 4B"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="94103"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Special Instructions / Gate Code</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Call upon arrival, dog in backyard, gate code #4492"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
              Booking Summary
            </h3>

            {/* Coupon Code Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase">Promo Code / Coupon</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Tag className="h-3.5 w-3.5" /> {appliedCoupon.code} (-${appliedCoupon.discount_amount?.toFixed(2)})
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="WELCOME20 or SAVE10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs uppercase focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {activeService && (
              <div className="space-y-3 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Base Service Fee</span>
                  <span className="font-semibold">${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span>Duration</span>
                  <span className="font-semibold">{activeService.duration_minutes} minutes</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-700">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span>Estimated Tax</span>
                  <span className="font-semibold">$0.00</span>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-900">Total Price</span>
                  <span className="text-xl font-black text-blue-600">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Payment Option</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="text-xs font-medium text-gray-800 block">Instant Card (Demo)</span>
                    <span className="text-[10px] text-gray-400 block">Immediate booking confirmation & invoice</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="text-xs font-medium text-gray-800 block">Pay Upon Completion</span>
                    <span className="text-[10px] text-gray-400 block">Settle via Cash or Card on site</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Confirming Reservation...' : 'Confirm & Schedule Booking'}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              100% Satisfaction & Secure Checkout
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
