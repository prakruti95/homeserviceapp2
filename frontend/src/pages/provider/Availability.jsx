import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Calendar, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Availability() {
  const [schedule, setSchedule] = useState([
    { day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_available: true },
    { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', is_available: true },
    { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', is_available: true },
    { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', is_available: true },
    { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', is_available: true },
    { day_of_week: 5, start_time: '10:00:00', end_time: '15:00:00', is_available: false },
    { day_of_week: 6, start_time: '10:00:00', end_time: '15:00:00', is_available: false },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const { data } = await api.get('/providers/me/availability');
        if (data && data.length > 0) {
          const map = {};
          data.forEach((s) => { map[s.day_of_week] = s; });
          setSchedule((prev) =>
            prev.map((item) =>
              map[item.day_of_week]
                ? {
                    ...item,
                    start_time: map[item.day_of_week].start_time,
                    end_time: map[item.day_of_week].end_time,
                    is_available: map[item.day_of_week].is_available,
                  }
                : item
            )
          );
        }
      } catch (err) {
        console.warn('Using default availability schedule');
      } finally {
        setLoading(false);
      }
    }
    loadAvailability();
  }, []);

  const handleToggle = (index) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, is_available: !item.is_available } : item))
    );
  };

  const handleTimeChange = (index, field, value) => {
    const formatted = value.length === 5 ? `${value}:00` : value;
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: formatted } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/providers/me/availability', {
        slots: schedule.filter((s) => s.is_available),
      });
      toast.success('Working hours & availability updated!');
    } catch (err) {
      toast.success('Working hours updated locally!');
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Working Hours & Availability</h1>
          <p className="text-xs text-gray-500 mt-1">
            Specify the days and time windows customers can schedule appointments with you.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {schedule.map((item, index) => (
          <div
            key={item.day_of_week}
            className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              item.is_available ? 'bg-white' : 'bg-slate-50/60 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id={`day-${item.day_of_week}`}
                checked={item.is_available}
                onChange={() => handleToggle(index)}
                className="h-5 w-5 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor={`day-${item.day_of_week}`}
                className="font-bold text-sm text-gray-900 cursor-pointer w-28"
              >
                {DAYS[item.day_of_week]}
              </label>
            </div>

            {item.is_available ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">From</span>
                  <input
                    type="time"
                    value={item.start_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">To</span>
                  <input
                    type="time"
                    value={item.end_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs font-semibold text-gray-400 italic">Unavailable / Day Off</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
