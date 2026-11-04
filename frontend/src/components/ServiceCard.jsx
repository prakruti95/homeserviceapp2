import { MapPin, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">
              {service.category === 'Cleaning' ? '🧹' :
               service.category === 'Plumbing' ? '🔧' :
               service.category === 'Electrical' ? '⚡' :
               service.category === 'Painting' ? '🎨' :
               service.category === 'Landscaping' ? '🌿' :
               service.category === 'Moving' ? '📦' : '🏠'}
            </span>
          </div>
        )}
        {service.category && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-semibold rounded-full">
            {service.category}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          {service.provider_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {service.provider_name}
            </span>
          )}
          {service.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.duration}
            </span>
          )}
          {Number(service.rating || 0) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {Number(service.rating || 0).toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            ${Number(service.price ?? service.base_price ?? 0).toFixed(2)}
          </span>
          <button
            onClick={() => navigate(`/customer/book/${service.id}`)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
