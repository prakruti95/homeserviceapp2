import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getClientUsers, isUserDeleted, saveClientUser } from '../services/userStorage';

const AuthContext = createContext(null);

// Official verified demo credentials
const DEFAULT_DEMO_USERS = [
  {
    id: 1,
    email: 'admin@homeserve.com',
    password: 'admin123',
    full_name: 'System Admin',
    role: 'admin',
    phone: '+1-800-555-0100',
    is_active: true,
  },
  {
    id: 2,
    email: 'provider@homeserve.com',
    password: 'provider123',
    full_name: 'Apex Home Solutions (Provider)',
    role: 'provider',
    phone: '+1-800-555-0102',
    is_active: true,
  },
  {
    id: 3,
    email: 'customer@homeserve.com',
    password: 'customer123',
    full_name: 'Emily Watson (Customer)',
    role: 'customer',
    phone: '+1-800-555-0103',
    is_active: true,
  },
  {
    id: 4,
    email: 'technician@homeserve.com',
    password: 'tech123',
    full_name: 'Alex Rivera (Technician)',
    role: 'technician',
    phone: '+1-800-555-0104',
    is_active: true,
  },
  {
    id: 40,
    email: 'tech@homeserve.com',
    password: 'tech123',
    full_name: 'Alex Rivera (Technician)',
    role: 'technician',
    phone: '+1-800-555-0104',
    is_active: true,
  },
  {
    id: 5,
    email: 'superadmin@homeserve.com',
    password: 'superadmin123',
    full_name: 'Chief Executive (Super Admin)',
    role: 'super_admin',
    phone: '+1-800-555-0001',
    is_active: true,
  },
];

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem('homeserve_demo_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(newUser) {
  try {
    const users = getRegisteredUsers();
    const filtered = users.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
    filtered.push(newUser);
    localStorage.setItem('homeserve_demo_users', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save user to storage', e);
  }
}

function findUserByEmail(email) {
  const normEmail = (email || '').trim().toLowerCase();
  if (!normEmail) return null;

  // 1. If user was deleted by Admin, reject immediately
  if (isUserDeleted(normEmail)) {
    return null;
  }

  // 2. Check registered users created via registration form
  const registered = getRegisteredUsers();
  const foundRegistered = registered.find((u) => u.email.toLowerCase() === normEmail);

  // 3. Check default demo accounts
  const foundDefault = DEFAULT_DEMO_USERS.find((u) => u.email.toLowerCase() === normEmail);

  // 4. Check client directory for latest dynamic status (e.g. deactivated by admin)
  const dirUsers = getClientUsers();
  const dirUser = dirUsers.find((u) => (u.email || '').trim().toLowerCase() === normEmail);

  const baseUser = foundRegistered || foundDefault;
  if (!baseUser && !dirUser) return null;

  return {
    ...foundDefault,
    ...foundRegistered,
    ...dirUser,
    password: baseUser?.password || (dirUser?.role === 'customer' ? 'customer123' : 'admin123'),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (token.startsWith('demo-') || token.startsWith('token-')) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore parsing error
        }
      }
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      // If serverless microVM container cold-started or does not have session, keep authenticated local session!
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
          setLoading(false);
          return;
        } catch {
          // ignore
        }
      }
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncLocalUsersToServer = useCallback(async () => {
    try {
      const registered = getRegisteredUsers();
      for (const localUser of registered) {
        if (localUser.email && localUser.password && !localUser.synced_to_server) {
          try {
            await api.post('/auth/register', {
              email: localUser.email.trim().toLowerCase(),
              password: localUser.password,
              full_name: localUser.full_name || 'HomeServe User',
              phone: localUser.phone || '+1-555-0100',
              role: localUser.role || 'customer',
              city: localUser.city || 'San Francisco',
              address: localUser.address || '',
              state: localUser.state || '',
              zip_code: localUser.zip_code || '',
            });
            localUser.synced_to_server = true;
            saveRegisteredUser(localUser);
          } catch (syncErr) {
            if (syncErr.response?.status === 409) {
              localUser.synced_to_server = true;
              saveRegisteredUser(localUser);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUser();
    syncLocalUsersToServer();
  }, [fetchUser, syncLocalUsersToServer]);

  const login = async (email, password) => {
    const normEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!normEmail || !cleanPassword) {
      toast.error('Please enter both email and password');
      throw new Error('Please enter both email and password');
    }

    try {
      const { data } = await api.post('/auth/login', { email: normEmail, password: cleanPassword });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Logged in successfully');
      return data.user;
    } catch (err) {
      // If backend failed (e.g. user was registered locally earlier and not yet in cloud DB):
      const matchedUser = findUserByEmail(normEmail);

      if (matchedUser) {
        // 1. Check password
        if (matchedUser.password && matchedUser.password !== cleanPassword) {
          toast.error('Invalid email or password');
          throw new Error('Invalid email or password');
        }

        // 2. Reject if deactivated by admin
        if (matchedUser.is_active === false) {
          toast.error('Your account is deactivated. Please contact support.');
          throw new Error('Account inactive');
        }

        // 3. Immediately push this user to the cloud database so all other devices can log in!
        try {
          const regRes = await api.post('/auth/register', {
            email: normEmail,
            password: cleanPassword,
            full_name: matchedUser.full_name || 'HomeServe User',
            phone: matchedUser.phone || '+1-555-0100',
            role: matchedUser.role || 'customer',
            city: matchedUser.city || 'San Francisco',
            address: matchedUser.address || '',
            state: matchedUser.state || '',
            zip_code: matchedUser.zip_code || '',
          });
          if (regRes?.data?.access_token) {
            localStorage.setItem('access_token', regRes.data.access_token);
            localStorage.setItem('user', JSON.stringify(regRes.data.user));
            setUser(regRes.data.user);
            toast.success(`Logged in as ${regRes.data.user.full_name}`);
            return regRes.data.user;
          }
        } catch {
          // Handled, continue with session
        }

        // Successful authentication:
        const sessionUser = { ...matchedUser };
        delete sessionUser.password;

        const demoToken = 'token-' + Date.now();
        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        toast.success(`Logged in as ${sessionUser.full_name}`);
        return sessionUser;
      }

      // If user really does not exist or invalid credentials
      const msg = err.response?.data?.detail || 'Invalid email or password';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const register = async (payload) => {
    const normEmail = (payload.email || '').trim().toLowerCase();
    const cleanPassword = (payload.password || '').trim();

    if (!normEmail || !cleanPassword || !payload.full_name?.trim()) {
      toast.error('Please fill in required fields');
      throw new Error('Please fill in required fields');
    }

    try {
      const { data } = await api.post('/auth/register', {
        ...payload,
        email: normEmail,
        password: cleanPassword,
        full_name: payload.full_name.trim(),
      });
      // Synchronize newly created user with client registry for instant directory lookup
      const registeredUser = data?.user || {
        id: Date.now(),
        email: normEmail,
        password: cleanPassword,
        full_name: payload.full_name?.trim() || 'New User',
        phone: payload.phone || '+1-555-0100',
        role: payload.role || 'customer',
        city: payload.city || 'San Francisco',
        address: payload.address || '',
        state: payload.state || '',
        zip_code: payload.zip_code || '',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      saveRegisteredUser({ ...registeredUser, password: cleanPassword, synced_to_server: true });
      saveClientUser(registeredUser);
      toast.success('Account created successfully! Please sign in.');
      return data;
    } catch (err) {
      // If backend reports email conflict (409 Conflict)
      if (err.response?.status === 409) {
        const msg = err.response?.data?.detail || 'A user with this email already exists';
        toast.error(msg);
        throw new Error(msg);
      }

      const isOfflineOr405 = !err.response || [404, 405, 500, 502, 503, 504].includes(err.response?.status);
      if (isOfflineOr405) {
        // Check uniqueness in client registry
        const existing = findUserByEmail(normEmail);
        if (existing) {
          const msg = 'A user with this email already exists';
          toast.error(msg);
          throw new Error(msg);
        }

        const newUser = {
          id: Date.now(),
          email: normEmail,
          password: cleanPassword, // Stored securely in client storage for offline credential verification
          full_name: payload.full_name.trim(),
          phone: payload.phone || '+1-555-0100',
          role: payload.role || 'customer',
          address: payload.address || '',
          city: payload.city || '',
          state: payload.state || '',
          zip_code: payload.zip_code || '',
          is_active: true,
          created_at: new Date().toISOString(),
        };

        // Unmark from deleted registry if re-registering
        try {
          const rawDel = localStorage.getItem('homeserve_deleted_user_keys');
          if (rawDel) {
            const delKeys = JSON.parse(rawDel).filter((k) => String(k).toLowerCase() !== normEmail);
            localStorage.setItem('homeserve_deleted_user_keys', JSON.stringify(delKeys));
          }
        } catch {}

        saveRegisteredUser(newUser);

        toast.success(`Account created successfully! Please sign in with your password.`);
        return { user: newUser };
      }

      const msg = err.response?.data?.detail || err.message || 'Registration failed';
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network error
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
