import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Trash2, CheckCircle, XCircle, Shield, Briefcase, User, Download, ShieldCheck, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getClientUsers,
  toggleClientUserStatus,
  toggleContractorVerification,
  deleteClientUser,
  isUserDeleted,
} from '../../services/userStorage';

export default function ManageUsers() {
  const [users, setUsers] = useState(getClientUsers);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let serverUsers = [];
      try {
        const url = roleFilter ? `/users/?role=${roleFilter}` : '/users/';
        const { data } = await api.get(url);
        serverUsers = data?.users || [];
      } catch {
        // api fallback
      }

      const clientList = getClientUsers();
      const map = new Map();
      clientList.forEach((u) => {
        if (!isUserDeleted(u.id) && !isUserDeleted(u.email)) {
          map.set(String(u.id), u);
        }
      });
      serverUsers.forEach((u) => {
        if (!isUserDeleted(u.id) && !isUserDeleted(u.email)) {
          const existing = map.get(String(u.id));
          map.set(String(u.id), { ...existing, ...u });
        }
      });

      let all = Array.from(map.values());
      if (roleFilter) {
        all = all.filter((u) => u.role?.toLowerCase() === roleFilter.toLowerCase());
      }
      setUsers(all);
    } catch (err) {
      console.error('Failed to load users', err);
      let clientList = getClientUsers();
      if (roleFilter) {
        clientList = clientList.filter((u) => u.role?.toLowerCase() === roleFilter.toLowerCase());
      }
      setUsers(clientList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
    } catch (err) {
      console.warn('Server toggle user failed, updating locally', err);
    } finally {
      const newStatus = toggleClientUserStatus(user.id);
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    }
  };

  const handleToggleVerification = async (user) => {
    try {
      await api.patch(`/admin/providers/${user.id}/verify`, { is_verified: !user.is_verified });
    } catch (err) {
      console.warn('Server verify provider failed, updating locally', err);
    } finally {
      const verified = toggleContractorVerification(user.id);
      toast.success(`Contractor ${verified ? 'Verified & Certified' : 'Verification Revoked'}`);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
    } catch (err) {
      console.warn('Server delete user failed, updating locally', err);
    } finally {
      deleteClientUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Full Name', 'Email', 'Role', 'City', 'Status', 'Verified Contractor', 'Created At'];
      const rows = filtered.map((u) => [
        u.id,
        `"${u.full_name}"`,
        `"${u.email}"`,
        u.role,
        `"${u.city || 'N/A'}"`,
        u.is_active ? 'Active' : 'Inactive',
        u.is_verified ? 'Yes' : 'No',
        `"${u.created_at || ''}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `homeserve_users_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users directory exported as CSV!');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Directory & Contractor Governance</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review registered platform accounts, toggle contractor credentials, and moderate permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-600" /> Export CSV
          </button>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex gap-2">
        {['', 'customer', 'provider', 'technician', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              roleFilter === r
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {r || 'All Roles'}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Verification</th>
                  <th className="py-3 px-6">City</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Joined</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-6">
                      <div className="font-bold text-gray-900">{u.full_name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' || u.role === 'super_admin' ? 'bg-rose-100 text-rose-700' :
                        u.role === 'provider' ? 'bg-amber-100 text-amber-700' :
                        u.role === 'technician' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {(u.role === 'admin' || u.role === 'super_admin') && <Shield className="h-3 w-3" />}
                        {u.role === 'provider' && <Briefcase className="h-3 w-3" />}
                        {u.role === 'technician' && <Wrench className="h-3 w-3" />}
                        {u.role === 'customer' && <User className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      {u.role === 'provider' ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          {u.is_verified ? 'Verified Pro' : 'Unverified'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-gray-600">{u.city || '—'}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-400">
                      {new Date(u.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === 'provider' && (
                          <button
                            onClick={() => handleToggleVerification(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              u.is_verified
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {u.is_verified ? 'Revoke Pro' : 'Verify Pro'}
                          </button>
                        )}
                        {u.role !== 'admin' && u.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="px-2.5 py-1 border border-gray-200 hover:bg-gray-50 rounded-lg text-[11px] font-semibold text-gray-700 cursor-pointer"
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
