import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import BrowseServices from './pages/customer/BrowseServices';
import BookService from './pages/customer/BookService';
import MyBookings from './pages/customer/MyBookings';
import CustomerReviews from './pages/customer/Reviews';

// Provider Pages
import ProviderDashboard from './pages/provider/Dashboard';
import ManageBookings from './pages/provider/ManageBookings';
import Availability from './pages/provider/Availability';
import ProviderProfile from './pages/provider/Profile';
import ProviderEarnings from './pages/provider/Earnings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageServices from './pages/admin/ManageServices';
import AdminManageBookings from './pages/admin/ManageBookings';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route element={<Layout />}>
          {/* Public & Guest Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute roles={['customer', 'admin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/browse"
            element={<BrowseServices />}
          />
          <Route
            path="/customer/book"
            element={
              <ProtectedRoute roles={['customer', 'admin']}>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book/:serviceId"
            element={
              <ProtectedRoute roles={['customer', 'admin']}>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute roles={['customer', 'admin']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reviews"
            element={<CustomerReviews />}
          />

          {/* Provider Routes */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/bookings"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ManageBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/availability"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <Availability />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/earnings"
            element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <ProviderEarnings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute roles={['admin']}>
                <ManageServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminManageBookings />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
