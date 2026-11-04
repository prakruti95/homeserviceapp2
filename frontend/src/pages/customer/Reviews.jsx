import { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const { data } = await api.get('/reviews/');
        setReviews(data?.reviews || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Ratings & Reviews</h1>
        <p className="text-xs text-gray-500 mt-1">
          Read community feedback and service reviews submitted by verified platform customers.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No reviews yet</h3>
          <p className="text-xs text-gray-500 mt-1">Completed bookings can be reviewed in your bookings history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-1.5">{r.rating}.0</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-gray-700 italic">"{r.comment}"</p>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Verified Customer</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ThumbsUp className="h-3 w-3" /> Verified Booking #{r.booking_id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
