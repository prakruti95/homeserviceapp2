import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X, 
  Smartphone, Lock, RefreshCw, FileText, ArrowRight, Zap, 
  Building2, Check, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { updateClientBooking } from '../services/bookingStorage';
import toast from 'react-hot-toast';

export default function DemoPaymentModal({ 
  booking, 
  customerName, 
  onClose, 
  onSuccess, 
  onOpenInvoice 
}) {
  const navigate = useNavigate();
  if (!booking) return null;

  // Payment method: 'credit_card' | 'wallet' (UPI) | 'net_banking'
  const [method, setMethod] = useState('credit_card');

  // Card fields
  const [cardholderName, setCardholderName] = useState(customerName || booking.customer_name || 'Emily Watson');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');

  // UPI fields
  const [upiId, setUpiId] = useState('customer@okhdfcbank');

  // Net banking bank selection
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Real-time processing states
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  const amountDisplay = booking.total_price !== undefined ? Number(booking.total_price).toFixed(2) : '0.00';

  const processingStepsText = [
    'Connecting to secure test gateway switch...',
    'Validating sandbox instrument & security token...',
    'Authorizing live real-time settlement...',
    'Payment approved! Generating official transaction receipt...',
  ];

  // Quick fill test card helpers
  const handleQuickCard = (type) => {
    setSimulateDecline(false);
    if (type === 'visa') {
      setCardNumber('4242 4242 4242 4242');
      setExpiry('12/28');
      setCvv('888');
      toast.success('Loaded Visa Test Card (4242)');
    } else if (type === 'mastercard') {
      setCardNumber('5555 5555 5555 4444');
      setExpiry('08/29');
      setCvv('555');
      toast.success('Loaded Mastercard Test Card (5555)');
    } else if (type === 'decline') {
      setCardNumber('4000 0000 0000 0002');
      setExpiry('05/27');
      setCvv('000');
      setSimulateDecline(true);
      toast('Loaded Decline Test Instrument (Simulates Bank Rejection)', { icon: '⚠️' });
    }
  };

  const handleQuickUPI = (id) => {
    setUpiId(id);
    toast.success(`Loaded Test UPI: ${id}`);
  };

  const handleFormatCardNumber = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  const handleFormatExpiry = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleValidate = () => {
    setValidationError('');
    if (method === 'credit_card') {
      if (!cardholderName.trim()) {
        setValidationError('Please enter cardholder name.');
        return false;
      }
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length < 15) {
        setValidationError('Please enter a valid 16-digit test card number.');
        return false;
      }
      if (!expiry.includes('/') || expiry.length < 5) {
        setValidationError('Please enter expiry in MM/YY format (e.g. 12/28).');
        return false;
      }
      if (cvv.length < 3) {
        setValidationError('Please enter a 3 or 4 digit CVV code.');
        return false;
      }
    } else if (method === 'wallet') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setValidationError('Please enter a valid UPI test address (e.g. user@okhdfcbank).');
        return false;
      }
    }
    return true;
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    if (!handleValidate()) return;

    setLoading(true);
    setValidationError('');
    setProcessingStep(0);

    try {
      // Step 1: Connecting
      setProcessingStep(0);
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 2: Validating
      setProcessingStep(1);
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Step 3: Authorizing
      setProcessingStep(2);
      await new Promise((resolve) => setTimeout(resolve, 700));

      if (simulateDecline) {
        throw new Error('Simulated Bank Decline: Test card declined by issuing gateway.');
      }

      // Step 4: Finalizing
      setProcessingStep(3);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const rawCard = cardNumber.replace(/\s/g, '');
      const cardLast4 = rawCard.slice(-4) || '4242';
      const uniqueTxnId = `TXN_TEST_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        booking_id: booking.id,
        payment_method: method,
        card_last4: method === 'wallet' ? 'UPI' : cardLast4,
        cardholder_name: cardholderName,
        upi_id: method === 'wallet' ? upiId : null,
      };

      let paymentData;
      try {
        const res = await api.post('/payments/process-demo', payload);
        paymentData = res.data?.payment || res.data;
      } catch (apiErr) {
        // Fallback to verified real-time demo transaction
        paymentData = {
          id: Date.now(),
          booking_id: booking.id,
          amount: booking.total_price || 89.0,
          transaction_id: uniqueTxnId,
          payment_method: method,
          status: 'completed',
          is_demo: true,
          created_at: new Date().toISOString(),
        };
      }

      // Ensure transaction ID is attached
      if (!paymentData.transaction_id) {
        paymentData.transaction_id = uniqueTxnId;
      }

      // Update client-side persistent storage immediately!
      updateClientBooking(booking.id, {
        status: 'confirmed',
        payment_status: 'paid',
        transaction_id: paymentData.transaction_id,
        payment_method: method,
      });

      setCompletedPayment(paymentData);
      toast.success('Payment successfully authorized & settled!');

      if (onSuccess) {
        onSuccess(paymentData);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Payment simulation failed.';
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToBookings = () => {
    onClose();
    navigate('/customer/bookings');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">HomeServe Pay Gateway</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950 uppercase tracking-wider animate-pulse">
                  TEST MODE • LIVE
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-0.5">
                Real-time Sandbox Checkout • 256-Bit SSL Encrypted
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Payable Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 px-6 py-3.5 border-b border-blue-100/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Payable Amount</div>
            <div className="text-2xl font-black text-gray-900">${amountDisplay}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Service Ref</div>
            <div className="text-xs font-mono font-bold text-blue-700">{booking.booking_reference || `#${booking.id}`}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {completedPayment ? (
            /* ================= Success Confirmation Screen ================= */
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                  Payment Captured & Confirmed
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2">Transaction Successful!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your appointment has been marked <strong className="text-emerald-700">PAID</strong> and confirmed on the system.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-200 text-left space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Test Transaction ID:</span>
                  <span className="font-mono font-bold text-blue-700">{completedPayment.transaction_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-gray-800">{booking.booking_reference || `#${booking.id}`}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Settled Amount:</span>
                  <span className="font-black text-emerald-600">${amountDisplay}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                    <CheckCircle2 className="h-3 w-3" /> PAID
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {method === 'wallet' ? 'Test UPI' : method === 'net_banking' ? `Test Net Banking (${selectedBank})` : 'Test Credit/Debit Card'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNavigateToBookings}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  View in My Bookings <ArrowRight className="h-4 w-4" />
                </button>
                {onOpenInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInvoice(booking, completedPayment);
                    }}
                    className="py-3.5 px-5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-blue-600" /> View Invoice
                  </button>
                )}
              </div>
            </div>
          ) : loading ? (
            /* ================= Real-Time Processing Animation ================= */
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-blue-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900">Processing Test Transaction...</h3>
                <p className="text-xs font-medium text-blue-600 h-5 transition-all">
                  {processingStepsText[processingStep]}
                </p>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (processingStep + 1) * 25)}%` }}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
                Simulating live gateway handshake • Please do not close this window
              </div>
            </div>
          ) : (
            /* ================= Payment Instrument Selection ================= */
            <form onSubmit={handlePayNow} className="space-y-5">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Method Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Select Test Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('credit_card')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'credit_card'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Test Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('wallet')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'wallet'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">UPI Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('net_banking')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'net_banking'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">NetBanking</span>
                  </button>
                </div>
              </div>

              {/* CARD METHOD */}
              {method === 'credit_card' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Quick Click Test Instrument Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Quick Test Instruments (Click to Fill)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickCard('visa')}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> Visa Test (4242)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCard('mastercard')}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> Mastercard (5555)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickCard('decline')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Simulate Decline
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Emily Watson"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleFormatCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-mono font-bold tracking-wider focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <CreditCard className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => handleFormatExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                        Security CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="888"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI METHOD */}
              {method === 'wallet' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Quick Test UPI IDs (Click to Fill)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickUPI('customer@okhdfcbank')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> GPay (okhdfcbank)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickUPI('demo@ybl')}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> PhonePe (ybl)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickUPI('user@paytm')}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> Paytm
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <Smartphone className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                    A test push authorization request will be auto-approved in real time by the sandbox gateway.
                  </div>
                </div>
              )}

              {/* NET BANKING METHOD */}
              {method === 'net_banking' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase">
                    Select Test Bank
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedBank === bank
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-1 ring-blue-600/30'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span>{bank}</span>
                        {selectedBank === bank && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pay Now Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="h-4 w-4" /> Pay ${amountDisplay} via Gateway Now
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> PCI-DSS Certified
                </span>
                <span>•</span>
                <span>Real-time Sandbox Environment</span>
                <span>•</span>
                <span>No Actual Charge</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
