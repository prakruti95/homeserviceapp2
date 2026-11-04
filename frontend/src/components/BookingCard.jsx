import { Calendar, Clock, MapPin, User } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function BookingCard({ booking, actions, showProvider = false, showCustomer = false }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.service_name || 'Service'}</h3>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
            {statusLabels[booking.status] || booking.status}
          </span>
        </div>
        <span className="text-lg font-bold text-blue-600">
          ${Number(booking.total_price || 0).toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(booking.scheduled_date)}</span>
        </div>
        {booking.scheduled_time && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{booking.scheduled_time}</span>
          </div>
        )}
        {booking.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="truncate">{booking.address}</span>
          </div>
        )}
        {showProvider && booking.provider_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>Provider: {booking.provider_name}</span>
          </div>
        )}
        {showCustomer && booking.customer_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>Customer: {booking.customer_name}</span>
          </div>
        )}
      </div>

      {booking.notes && (
        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
          <span className="font-medium text-gray-600">Notes:</span> {booking.notes}
        </p>
      )}

      {actions && <div className="flex items-center gap-2 pt-3 border-t border-gray-100">{actions}</div>}
    </div>
  );
}
