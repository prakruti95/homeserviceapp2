import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Filter, Clock, Star, Wrench, ArrowRight, Check } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fallbackCategories, fallbackServices } from '../../data/catalog';

export default function BrowseServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState(fallbackCategories);
  const [services, setServices] = useState(fallbackServices);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get('/services/categories');
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to load categories, using catalog fallbacks', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchServices() {
      try {
        let url = '/services/?';
        const params = [];
        if (selectedCategory) params.push(`category_id=${selectedCategory}`);
        if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
        url += params.join('&');

        const { data } = await api.get(url);
        if (Array.isArray(data?.services) && data.services.length > 0) {
          setServices(data.services);
        } else {
          // Filter fallback catalog
          let filtered = [...fallbackServices];
          if (selectedCategory) {
            filtered = filtered.filter(
              (s) => String(s.category_id) === String(selectedCategory) ||
                     s.category?.id === Number(selectedCategory)
            );
          }
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (s) => s.name.toLowerCase().includes(q) ||
                     (s.description && s.description.toLowerCase().includes(q))
            );
          }
          setServices(filtered);
        }
      } catch (err) {
        console.error('Failed to load services, using catalog fallbacks', err);
        let filtered = [...fallbackServices];
        if (selectedCategory) {
          filtered = filtered.filter(
            (s) => String(s.category_id) === String(selectedCategory) ||
                   s.category?.id === Number(selectedCategory)
          );
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) => s.name.toLowerCase().includes(q) ||
                   (s.description && s.description.toLowerCase().includes(q))
          );
        }
        setServices(filtered);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (catId) => {
    const newCat = selectedCategory === String(catId) ? '' : String(catId);
    setSelectedCategory(newCat);
    const newParams = {};
    if (newCat) newParams.category = newCat;
    if (searchQuery) newParams.q = searchQuery;
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (selectedCategory) newParams.category = selectedCategory;
    if (searchQuery) newParams.q = searchQuery;
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Explore Home Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse our full catalog of verified professional services with transparent fixed rates.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service by title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => handleCategoryClick('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            !selectedCategory
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === String(cat.id)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {selectedCategory === String(cat.id) && <Check className="h-3.5 w-3.5" />}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center bg-white rounded-2xl border border-gray-200 p-12">
          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No services found</h3>
          <p className="text-xs text-gray-500 mt-1">Try clearing your filters or search keywords.</p>
          <button
            type="button"
            onClick={() => { setSelectedCategory(''); setSearchQuery(''); setSearchParams({}); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
            >
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                {srv.image_url ? (
                  <img
                    src={srv.image_url}
                    alt={srv.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                    <Wrench className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                  {srv.category?.name || 'Category'}
                </span>
                <span className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-xs text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {srv.duration_minutes} mins
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">Standard Price</span>
                    <div className="text-2xl font-black text-gray-900">${Number(srv.base_price || 0).toFixed(2)}</div>
                  </div>
                  <Link
                    to={`/customer/book/${srv.id}`}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    Book Service <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
