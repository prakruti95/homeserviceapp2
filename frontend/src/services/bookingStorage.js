const STORAGE_KEY = 'homeserve_client_bookings';

const DEFAULT_SAMPLE_BOOKINGS = [
  {
    id: 901,
    booking_reference: 'HS-BK-78912',
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    service_id: 1,
    service_name: 'Emergency Pipe Leak & Burst Repair',
    provider_id: 2,
    provider_name: 'Apex Home Solutions',
    technician_id: 4,
    technician_name: 'Alex Rivera (Technician)',
    status: 'completed',
    payment_status: 'paid',
    scheduled_date: '2026-11-02',
    scheduled_time: '14:00:00',
    duration_minutes: 60,
    total_price: 89.0,
    address: '742 Evergreen Terrace',
    city: 'San Francisco',
    zip_code: '94102',
    notes: 'Urgent kitchen sink drain pipe dripping.',
    created_at: '2026-11-02T10:00:00Z',
    transaction_id: 'TXN-DEMO-901X7A',
    payment_method: 'credit_card',
    completion_notes: 'Replaced brass union valve and verified no drips at 60 PSI.',
  },
  {
    id: 902,
    booking_reference: 'HS-BK-78913',
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    service_id: 2,
    service_name: 'AC Deep Foam Cleaning & Filter Wash',
    provider_id: 2,
    provider_name: 'Apex Home Solutions',
    technician_id: 4,
    technician_name: 'Alex Rivera (Technician)',
    status: 'confirmed',
    payment_status: 'paid',
    scheduled_date: '2026-11-06',
    scheduled_time: '11:00:00',
    duration_minutes: 75,
    total_price: 79.0,
    address: '742 Evergreen Terrace',
    city: 'San Francisco',
    zip_code: '94102',
    notes: 'Living room dual-split AC unit.',
    created_at: '2026-11-03T14:30:00Z',
    transaction_id: 'TXN-DEMO-902Y8B',
    payment_method: 'wallet',
  },
  {
    id: 903,
    booking_reference: 'HS-BK-78914',
    customer_id: 15,
    customer_name: 'David Reynolds',
    customer_email: 'david.r@example.com',
    service_id: 3,
    service_name: 'Full Home Electrical Safety Audit',
    provider_id: 2,
    provider_name: 'Apex Home Solutions',
    technician_id: 4,
    technician_name: 'Alex Rivera (Technician)',
    status: 'pending',
    payment_status: 'pending',
    scheduled_date: '2026-11-08',
    scheduled_time: '09:30:00',
    duration_minutes: 90,
    total_price: 99.0,
    address: '105 Market Street, Apt 4B',
    city: 'San Francisco',
    zip_code: '94105',
    notes: 'Main circuit breaker trips under dryer load. Incoming new booking.',
    created_at: '2026-11-04T08:00:00Z',
  },
  {
    id: 904,
    booking_reference: 'HS-BK-78915',
    customer_id: 16,
    customer_name: 'Sophia Martinez',
    customer_email: 'sophia.m@example.com',
    service_id: 4,
    service_name: 'Whole-House Deep Sanitization Clean',
    provider_id: 2,
    provider_name: 'Apex Home Solutions',
    technician_id: 4,
    technician_name: 'Alex Rivera (Technician)',
    status: 'in_progress',
    payment_status: 'paid',
    scheduled_date: '2026-11-05',
    scheduled_time: '13:00:00',
    duration_minutes: 180,
    total_price: 129.0,
    address: '512 Oak Avenue',
    city: 'San Francisco',
    zip_code: '94107',
    notes: 'Kitchen deep degreasing and tile sanitize underway.',
    created_at: '2026-11-04T12:00:00Z',
    transaction_id: 'TXN-DEMO-904Z9C',
    payment_method: 'credit_card',
  },
];

export function getClientBookings(userEmail) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const clientList = raw ? JSON.parse(raw) : [];

    const normEmail = (userEmail || '').toLowerCase();
    const all = [...clientList];

    // Seed defaults if not present
    for (const sample of DEFAULT_SAMPLE_BOOKINGS) {
      if (!all.some((b) => b.id === sample.id || b.booking_reference === sample.booking_reference)) {
        all.push(sample);
      }
    }

    // Role-aware filtering
    if (!normEmail || ['admin@homeserve.com', 'superadmin@homeserve.com'].includes(normEmail)) {
      return all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    if (normEmail === 'provider@homeserve.com') {
      return all.filter((b) => b.provider_id === 2 || (b.provider_name && b.provider_name.includes('Apex')))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    if (['technician@homeserve.com', 'tech@homeserve.com'].includes(normEmail)) {
      return all.filter((b) => b.technician_id === 4 || ['confirmed', 'in_progress', 'completed'].includes(b.status))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    // Default customer filter: return own bookings, or default sample bookings if customer@homeserve.com
    return all.filter((b) => !b.customer_email || b.customer_email.toLowerCase() === normEmail || normEmail === 'customer@homeserve.com')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch (err) {
    console.error('Failed to read bookings from storage', err);
    return DEFAULT_SAMPLE_BOOKINGS;
  }
}

export function saveClientBooking(newBooking, currentUser) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];

    const enriched = {
      ...newBooking,
      id: newBooking.id || Date.now(),
      booking_reference: newBooking.booking_reference || `HS-${Date.now().toString(36).toUpperCase()}`,
      customer_id: currentUser?.id || Date.now(),
      customer_name: currentUser?.full_name || 'Valued Customer',
      customer_email: (currentUser?.email || '').toLowerCase(),
      created_at: newBooking.created_at || new Date().toISOString(),
      status: newBooking.status || 'pending',
      payment_status: newBooking.payment_status || (newBooking.status === 'confirmed' ? 'paid' : 'pending'),
    };

    const filtered = existing.filter(
      (b) => b.id !== enriched.id && b.booking_reference !== enriched.booking_reference
    );
    filtered.unshift(enriched);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return enriched;
  } catch (err) {
    console.error('Failed to save booking to storage', err);
    return newBooking;
  }
}

export function updateClientBooking(bookingId, updates) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];

    if (!list.some((b) => String(b.id) === String(bookingId))) {
      const sample = DEFAULT_SAMPLE_BOOKINGS.find((b) => String(b.id) === String(bookingId));
      if (sample) list.push({ ...sample });
    }

    list = list.map((b) => {
      if (String(b.id) === String(bookingId)) {
        return { ...b, ...updates };
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list.find((b) => String(b.id) === String(bookingId));
  } catch (err) {
    console.error('Failed to update booking in storage', err);
    return null;
  }
}
