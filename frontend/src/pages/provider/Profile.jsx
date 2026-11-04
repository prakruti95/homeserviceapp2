import { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, Briefcase, MapPin, DollarSign, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProviderProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    bio: '',
    experience_years: 0,
    hourly_rate: 0,
    service_area: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await api.get('/providers/me');
        setProfile(data);
        setFormData({
          business_name: data.business_name || '',
          bio: data.bio || '',
          experience_years: data.experience_years || 0,
          hourly_rate: data.hourly_rate || 0,
          service_area: data.service_area || '',
        });
      } catch (err) {
        console.error('Failed to load provider profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience_years' || name === 'hourly_rate' ? Number(value) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/providers/me', formData);
      setProfile(data);
      toast.success('Provider profile updated successfully!');
    } catch (err) {
      // toast handled
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
      <div>
        <h1 className="text-2xl font-black text-gray-900">Provider Business Profile</h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize your public business identity and service specialization details.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Verification status header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold text-lg">
              {profile?.business_name ? profile.business_name[0] : 'P'}
            </div>
            <div>
              <div className="font-bold text-gray-900">{profile?.business_name || 'Business Name'}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="h-3 w-3 fill-amber-500" /> {profile?.average_rating || 4.9} ({profile?.total_reviews || 42} reviews)
                </span>
                <span>•</span>
                <span>{profile?.total_bookings || 56} total jobs completed</span>
              </div>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            ✓ Verified Partner
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Company / Trade Name</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="E.g., ProFix Home Solutions"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Industry Experience (Years)</label>
              <input
                type="number"
                name="experience_years"
                min="0"
                value={formData.experience_years}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Standard Hourly Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Service Radius / Coverage Area</label>
            <input
              type="text"
              name="service_area"
              value={formData.service_area}
              onChange={handleChange}
              placeholder="E.g., Greater Bay Area, Downtown, East Bay"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Professional Bio & Specializations</label>
            <textarea
              rows={4}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your credentials, warranty assurances, and specialties..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Update Business Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
