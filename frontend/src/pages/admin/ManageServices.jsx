import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderOpen, Plus, Trash2, Edit3, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageServices() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // New Service Modal
  const [showSrvModal, setShowSrvModal] = useState(false);
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState(79.0);
  const [srvDuration, setSrvDuration] = useState(60);
  const [srvCatId, setSrvCatId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/services/categories'),
        api.get('/services/?limit=100'),
      ]);
      setCategories(cRes.data || []);
      setServices(sRes.data?.services || []);
      if (cRes.data?.length > 0 && !srvCatId) {
        setSrvCatId(String(cRes.data[0].id));
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.post('/services/categories', {
        name: catName.trim(),
        description: catDesc.trim() || 'Service Category',
        icon: 'Wrench',
      });
      toast.success('Category created successfully');
      setCatName('');
      setCatDesc('');
      setShowCatModal(false);
      loadData();
    } catch (err) {
      // toast shown
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!srvName.trim() || !srvCatId) return;
    try {
      await api.post('/services/', {
        category_id: parseInt(srvCatId),
        name: srvName.trim(),
        description: srvDesc.trim(),
        base_price: Number(srvPrice),
        duration_minutes: Number(srvDuration),
      });
      toast.success('Service created successfully');
      setSrvName('');
      setSrvDesc('');
      setShowSrvModal(false);
      loadData();
    } catch (err) {
      // toast shown
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      toast.success('Service removed from catalog');
      loadData();
    } catch (err) {
      // toast shown
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Service Catalog & Offerings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure service categories, define standardized service items, and set pricing tiers.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            + Add Category
          </button>
          <button
            onClick={() => setShowSrvModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            + Add Service
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Categories Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((c) => {
              const count = services.filter((s) => s.category_id === c.id).length;
              return (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs font-bold text-gray-900">{c.name}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{count} active services</div>
                </div>
              );
            })}
          </div>

          {/* Services Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">All Catalog Services ({services.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-6">Service Name</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Duration</th>
                    <th className="py-3 px-6 text-right">Standard Price</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-6">
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1">{s.description}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                          {s.category?.name || 'Category'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-600">{s.duration_minutes} mins</td>
                      <td className="py-3 px-6 text-right font-black text-gray-900">
                        ${Number(s.base_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Create Service Category</h3>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="E.g., Roofing & Gutters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief description of covered works..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showSrvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Add Service Item</h3>
            <form onSubmit={handleCreateService} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Parent Category</label>
                <select
                  value={srvCatId}
                  onChange={(e) => setSrvCatId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  placeholder="E.g., Kitchen Faucet Modernization"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Base Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    required
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  placeholder="Included labor, tools, and warranties..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSrvModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
