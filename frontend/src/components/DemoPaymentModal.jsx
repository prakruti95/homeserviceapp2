import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X, 
  Smartphone, Lock, RefreshCw, FileText, ArrowRight, Zap 
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DemoPaymentModal({ booking, customerName, onClose, onSuccess, onOpenInvoice }) {
  if (!booking) return null;

  // Selected payment method: 'credit_card' | 'debit_card' | 'wallet' (UPI)
  const [method, setMethod] = useState('credit_card');

  // Card fields (Demo only, never stored in DB)
  const [cardholderName, setCardholderName] = useState(customerName || booking.customer_name || 'Emily Watson');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');

  // UPI fields (Demo only)
  const [upiId, setUpiId] = useState('customer@okhdfcbank');

  // Processing & result states
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  // Quick fill demo helpers
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
    if (method === 'credit_card' || method === 'debit_card') {
      if (!cardholderName.trim()) {
        setValidationError('Please enter cardholder name.');
        return false;
      }
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length < 15) {
        setValidationError('Please enter a valid 16-digit card number.');
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
        setValidationError('Please enter a valid UPI ID (e.g. user@okaxis).');
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

    try {
      // Simulate bank network roundtrip (1000ms delay)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (simulateDecline) {
        throw new Error('Simulated Bank Decline: Insufficient demo funds or test card declined.');
      }

      // Card last 4 digits (PCI DSS compliant: only last4 is transmitted/saved)
      const rawCard = cardNumber.replace(/\s/g, '');
      const cardLast4 = rawCard.slice(-4) || '4242';

      const payload = {
        booking_id: booking.id,
        payment_method: method,
        card_last4: method === 'wallet' ? 'UPI' : cardLast4,
        cardholder_name: cardholderName,
        upi_id: method === 'wallet' ? upiId : null,
      };

      const res = await api.post('/payments/process-demo', payload);
      const paymentData = res.data?.payment || res.data;

      setCompletedPayment(paymentData);
      toast.success('Payment successfully processed & verified!');

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

  const amountDisplay = booking.total_price !== undefined ? Number(booking.total_price).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Demo Payment Gateway</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                  Sandbox Simulation
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Safe test checkout • No real money charged
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {completedPayment ? (
            /* ================= Success Confirmation Screen ================= */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900">Payment Completed!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your appointment has been confirmed and the tax receipt has been auto-generated.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-gray-800">{completedPayment.transaction_id || 'TXN-DEMO-XXXX'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-blue-700">{booking.booking_reference || `#${booking.id}`}</span>
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
                    {method === 'wallet' ? 'UPI Demo' : method.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onOpenInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInvoice(booking, completedPayment);
                    }}
                    className="flex-1 py-3 px-4 border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FileText className="h-4 w-4" /> View Tax Invoice
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  Done <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ================= Checkout Payment Form ================= */
            <form onSubmit={handlePayNow} className="space-y-5">
              
              {/* Order Metadata Card */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-bold text-gray-900">{booking.service_name || 'Home Maintenance Service'}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">Booking ID:</span>
                  <span className="font-mono font-bold text-blue-800">{booking.booking_reference || `#${booking.id}`}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold text-gray-800">{customerName || booking.customer_name || 'Homeowner'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-sm">
                  <span className="font-bold text-gray-700">Total Payable Amount:</span>
                  <span className="font-black text-blue-600 text-lg">${amountDisplay}</span>
                </div>
              </div>

              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                  Select Demo Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMethod('credit_card'); setValidationError(''); }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'credit_card'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 ${method === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMethod('debit_card'); setValidationError(''); }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'debit_card'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 ${method === 'debit_card' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold">Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMethod('wallet'); setValidationError(''); }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      method === 'wallet'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Smartphone className={`h-5 w-5 ${method === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold">UPI Demo</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs based on Method */}
              {method === 'credit_card' || method === 'debit_card' ? (
                <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-600 uppercase">Cardholder Name</label>
                      <button 
                        type="button" 
                        onClick={() => setCardholderName(customerName || 'Emily Watson')}
                        className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Emily Watson"
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-600 uppercase">Demo Card Number</label>
                      <span className="text-[10px] text-emerald-600 font-bold">Visa / MC Demo</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleFormatCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="w-full text-xs font-mono p-2.5 pl-9 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                      <CreditCard className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => handleFormatExpiry(e.target.value)}
                        placeholder="12/28"
                        maxLength={5}
                        className="w-full text-xs font-mono p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-center"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-gray-600 uppercase">CVV</label>
                        <span className="text-[9px] text-gray-400">Masked</span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full text-xs font-mono p-2.5 pl-8 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-center tracking-widest"
                        />
                        <Lock className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-3" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-1">
                    <Lock className="h-3 w-3 text-emerald-500" /> Card details are evaluated in browser simulation and never stored in database.
                  </p>
                </div>
              ) : (
                /* UPI Interface */
                <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Demo Virtual Payment Address (VPA)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. customer@okhdfcbank"
                        className="w-full text-xs p-2.5 pl-9 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                      />
                      <Zap className="h-4 w-4 text-amber-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Quick Demo UPI Handles:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['customer@okhdfcbank', 'demo@okaxis', 'homeserve@paytm', 'payer@ybl'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => setUpiId(handle)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg text-[10px] font-mono text-gray-700 transition-colors cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center gap-2.5">
                    <Smartphone className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-[11px] text-blue-900 leading-snug">
                      Simulates Instant UPI mandate verification & automated settlement.
                    </p>
                  </div>
                </div>
              )}

              {/* Validation or Error Message */}
              {validationError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Evaluator Decline Simulation Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] text-gray-600">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 text-gray-400" /> Evaluator Test: Simulate Bank Decline?
                </span>
                <input
                  type="checkbox"
                  checked={simulateDecline}
                  onChange={(e) => setSimulateDecline(e.target.checked)}
                  className="rounded text-blue-600 cursor-pointer h-4 w-4"
                />
              </div>

              {/* Pay Now Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Demo Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Pay ${amountDisplay} (Demo)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
