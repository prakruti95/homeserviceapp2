const USER_STORAGE_KEY = 'homeserve_client_user_directory';
const DELETED_USERS_KEY = 'homeserve_deleted_user_keys';

const DEFAULT_USERS = [
  {
    id: 1,
    full_name: 'System Admin',
    email: 'admin@homeserve.com',
    role: 'admin',
    city: 'San Francisco',
    phone: '+1-800-555-0100',
    is_active: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 5,
    full_name: 'Chief Executive (Super Admin)',
    email: 'superadmin@homeserve.com',
    role: 'super_admin',
    city: 'San Francisco',
    phone: '+1-800-555-0001',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    full_name: 'Apex Home Solutions (Provider)',
    email: 'provider@homeserve.com',
    role: 'provider',
    city: 'San Francisco',
    phone: '+1-800-555-0102',
    is_active: true,
    is_verified: true,
    hourly_rate: 65,
    average_rating: 4.9,
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 12,
    full_name: 'VoltSmart Electrical Pros',
    email: 'voltsmart@homeserve.com',
    role: 'provider',
    city: 'San Jose',
    phone: '+1-800-555-0112',
    is_active: true,
    is_verified: true,
    hourly_rate: 75,
    average_rating: 4.95,
    created_at: '2026-03-01T12:00:00Z',
  },
  {
    id: 13,
    full_name: 'ProClean Deep Cleaning Co.',
    email: 'proclean@homeserve.com',
    role: 'provider',
    city: 'Oakland',
    phone: '+1-800-555-0113',
    is_active: true,
    is_verified: false,
    hourly_rate: 55,
    average_rating: 4.88,
    created_at: '2026-03-10T14:00:00Z',
  },
  {
    id: 4,
    full_name: 'Alex Rivera (Technician)',
    email: 'technician@homeserve.com',
    role: 'technician',
    city: 'San Francisco',
    phone: '+1-800-555-0104',
    is_active: true,
    created_at: '2026-02-20T09:00:00Z',
  },
  {
    id: 14,
    full_name: 'Marcus Chen (Senior Tech)',
    email: 'marcus.tech@homeserve.com',
    role: 'technician',
    city: 'San Francisco',
    phone: '+1-800-555-0114',
    is_active: true,
    created_at: '2026-02-22T11:00:00Z',
  },
  {
    id: 3,
    full_name: 'Emily Watson (Customer)',
    email: 'customer@homeserve.com',
    role: 'customer',
    city: 'San Francisco',
    phone: '+1-800-555-0103',
    is_active: true,
    created_at: '2026-03-05T15:00:00Z',
  },
  {
    id: 15,
    full_name: 'David Reynolds',
    email: 'david.r@example.com',
    role: 'customer',
    city: 'San Jose',
    phone: '+1-800-555-0115',
    is_active: true,
    created_at: '2026-03-12T16:30:00Z',
  },
  {
    id: 16,
    full_name: 'Sophia Martinez',
    email: 'sophia.m@example.com',
    role: 'customer',
    city: 'Oakland',
    phone: '+1-800-555-0116',
    is_active: true,
    created_at: '2026-03-14T11:20:00Z',
  },
];

export function getDeletedUserKeys() {
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isUserDeleted(emailOrId) {
  if (!emailOrId) return false;
  const key = String(emailOrId).trim().toLowerCase();
  const deleted = getDeletedUserKeys();
  return deleted.some((k) => String(k).trim().toLowerCase() === key);
}

export function getClientUsers() {
  try {
    const deletedKeys = new Set(getDeletedUserKeys().map((k) => String(k).trim().toLowerCase()));

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : null;

    if (!list) {
      list = [...DEFAULT_USERS];
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(list));
    }

    // Merge registered users from auth storage
    const demoRaw = localStorage.getItem('homeserve_demo_users');
    const demoUsers = demoRaw ? JSON.parse(demoRaw) : [];

    const map = new Map();
    list.forEach((u) => {
      const emailKey = (u.email || '').trim().toLowerCase();
      const idKey = String(u.id);
      if (!deletedKeys.has(emailKey) && !deletedKeys.has(idKey)) {
        map.set(emailKey, u);
      }
    });

    demoUsers.forEach((u) => {
      const emailKey = (u.email || '').trim().toLowerCase();
      const idKey = String(u.id);
      if (!deletedKeys.has(emailKey) && !deletedKeys.has(idKey) && !map.has(emailKey)) {
        const enriched = {
          ...u,
          city: u.city || 'San Francisco',
          is_active: u.is_active !== undefined ? u.is_active : true,
          created_at: u.created_at || new Date().toISOString(),
        };
        map.set(emailKey, enriched);
      }
    });

    const activeList = Array.from(map.values());
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(activeList));
    return activeList;
  } catch (err) {
    console.error('Failed to read users from storage', err);
    return DEFAULT_USERS;
  }
}

export function saveClientUser(userData) {
  try {
    const current = getClientUsers();
    const emailKey = userData.email.trim().toLowerCase();

    // Undelete if previously deleted
    const deleted = getDeletedUserKeys().filter((k) => String(k).toLowerCase() !== emailKey);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deleted));

    const newUser = {
      id: Date.now(),
      full_name: userData.full_name?.trim() || 'New User',
      email: emailKey,
      role: userData.role || 'customer',
      city: userData.city || 'San Francisco',
      phone: userData.phone || '+1-800-555-0199',
      is_active: true,
      is_verified: userData.role === 'provider' ? false : undefined,
      created_at: new Date().toISOString(),
    };

    const filtered = current.filter((u) => (u.email || '').trim().toLowerCase() !== emailKey);
    filtered.unshift(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(filtered));
    return newUser;
  } catch (err) {
    console.error('Failed to save user to storage', err);
    return null;
  }
}

export function toggleClientUserStatus(userId) {
  try {
    const current = getClientUsers();
    let updatedStatus = false;
    let targetEmail = '';

    const updated = current.map((u) => {
      if (String(u.id) === String(userId) || (u.email && String(u.email).toLowerCase() === String(userId).toLowerCase())) {
        updatedStatus = !u.is_active;
        targetEmail = (u.email || '').toLowerCase();
        return { ...u, is_active: updatedStatus };
      }
      return u;
    });

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

    // Also update demo registration store if present
    if (targetEmail) {
      try {
        const demoRaw = localStorage.getItem('homeserve_demo_users');
        if (demoRaw) {
          const demoUsers = JSON.parse(demoRaw);
          const demoUpdated = demoUsers.map((du) => {
            if ((du.email || '').toLowerCase() === targetEmail) {
              return { ...du, is_active: updatedStatus };
            }
            return du;
          });
          localStorage.setItem('homeserve_demo_users', JSON.stringify(demoUpdated));
        }
      } catch (e) {
        console.warn('Could not sync demo users status', e);
      }
    }

    return updatedStatus;
  } catch (err) {
    console.error('Failed to toggle user status in storage', err);
    return false;
  }
}

export function toggleContractorVerification(userId) {
  try {
    const current = getClientUsers();
    let newVerifiedState = true;
    const updated = current.map((u) => {
      if (String(u.id) === String(userId)) {
        newVerifiedState = !u.is_verified;
        return { ...u, is_verified: newVerifiedState };
      }
      return u;
    });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    return newVerifiedState;
  } catch (err) {
    console.error('Failed to toggle contractor verification in storage', err);
    return false;
  }
}

export function deleteClientUser(userId) {
  try {
    const current = getClientUsers();
    const target = current.find(
      (u) => String(u.id) === String(userId) || (u.email && String(u.email).toLowerCase() === String(userId).toLowerCase())
    );

    const deleted = getDeletedUserKeys();
    deleted.push(String(userId));
    if (target?.email) {
      deleted.push(target.email.trim().toLowerCase());
    }
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(new Set(deleted))));

    const filtered = current.filter(
      (u) => String(u.id) !== String(userId) && (!target?.email || (u.email || '').toLowerCase() !== target.email.toLowerCase())
    );
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(filtered));

    // Also clean from demo registered users
    try {
      const demoRaw = localStorage.getItem('homeserve_demo_users');
      if (demoRaw) {
        const demoUsers = JSON.parse(demoRaw);
        const demoFiltered = demoUsers.filter(
          (du) => String(du.id) !== String(userId) && (!target?.email || (du.email || '').toLowerCase() !== target.email.toLowerCase())
        );
        localStorage.setItem('homeserve_demo_users', JSON.stringify(demoFiltered));
      }
    } catch (e) {
      console.warn('Could not remove from demo users', e);
    }

    return true;
  } catch (err) {
    console.error('Failed to delete user from storage', err);
    return false;
  }
}
