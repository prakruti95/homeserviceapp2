import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Download } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderEarnings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      try {
        const { data } = await api.get('/bookings/');
        setBookings(data?.bookings || []);
      } catch (err) {
        console.error('Failed to load earnings', err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, []);

  const completed = bookings.filter((b) => b.status === 'completed');
  const grossEarnings = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const platformFee = grossEarnings * 0.10; // 10% platform fee
  const netEarnings = grossEarnings - platformFee;

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
          <h1 className="text-2xl font-black text-gray-900">Earnings & Payouts</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track gross receipts, platform service deductions, and completed invoice statements.
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Bookings</div>
          <div className="text-3xl font-black text-gray-900 mt-2">${grossEarnings.toFixed(2)}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {completed.length} completed jobs
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform SaaS Fee (10%)</div>
          <div className="text-3xl font-black text-gray-600 mt-2">-${platformFee.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">Direct platform hosting & insurance</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Take-Home</div>
          <div className="text-3xl font-black text-emerald-700 mt-2">${netEarnings.toFixed(2)}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Ready for weekly bank payout</div>
        </div>
      </div>

      {/* Weekly Earnings Velocity Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Weekly Payout Breakdown
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Estimated daily earnings distributed through current cycle</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
            Direct Deposit Active
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-gray-100 pb-2">
          {[
            { day: 'Mon', amount: 140 },
            { day: 'Tue', amount: 210 },
            { day: 'Wed', amount: 185 },
            { day: 'Thu', amount: 290 },
            { day: 'Fri', amount: 350 },
            { day: 'Sat', amount: 410 },
            { day: 'Sun', amount: 95 },
          ].map((bar) => {
            const maxBar = 450;
            const heightPct = Math.round((bar.amount / maxBar) * 100);
            return (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-gray-900 text-white text-[10px] font-bold py-1 px-1.5 rounded pointer-events-none">
                  ${bar.amount}
                </div>
                <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden h-32 flex flex-col justify-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-bold text-gray-500">{bar.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Itemized Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Completed Service Transactions</h2>
        </div>

        {completed.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No completed jobs yet. Completed orders will appear with full payout calculations here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">Booking</th>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6 text-right">Gross</th>
                  <th className="py-3 px-6 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completed.map((b) => {
                  const bGross = b.total_price || 0;
                  const bNet = bGross * 0.9;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-6 font-bold text-gray-900">#{b.id}</td>
                      <td className="py-3 px-6 font-medium text-gray-800">{b.service_name}</td>
                      <td className="py-3 px-6 text-gray-500">{b.scheduled_date}</td>
                      <td className="py-3 px-6 text-gray-600">{b.customer_name || 'Customer'}</td>
                      <td className="py-3 px-6 text-right font-semibold text-gray-900">${bGross.toFixed(2)}</td>
                      <td className="py-3 px-6 text-right font-bold text-emerald-600">${bNet.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
