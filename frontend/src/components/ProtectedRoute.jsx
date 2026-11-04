import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles) {
    const userRole = String(user.role || '').toLowerCase();
    const allowed = roles.map((r) => String(r).toLowerCase());
    const isSuperAdminPassingAdmin = allowed.includes('admin') && (userRole === 'admin' || userRole === 'super_admin');
    if (!allowed.includes(userRole) && !isSuperAdminPassingAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
