import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
      <p className="mt-2 text-gray-600 max-w-sm">
        The page you are looking for might have been moved, removed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Home className="h-4 w-4" /> Back to Home
      </Link>
    </div>
  );
}
