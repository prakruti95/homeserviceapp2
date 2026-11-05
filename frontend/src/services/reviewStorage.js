const STORAGE_KEY = 'homeserve_client_reviews';

const DEFAULT_SAMPLE_REVIEWS = [
  {
    id: 701,
    booking_id: 901,
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    provider_name: 'Apex Home Solutions',
    service_name: 'Emergency Pipe Leak & Burst Repair',
    rating: 5,
    comment: 'The plumber arrived within 35 minutes of booking, diagnosed the leaky kitchen joint, and replaced the valve. Outstanding professionalism and clean workspace!',
    created_at: '2026-11-02T15:20:00Z',
  },
  {
    id: 702,
    booking_id: 902,
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    provider_name: 'Apex Home Solutions',
    service_name: 'AC Deep Foam Cleaning & Filter Wash',
    rating: 5,
    comment: 'Cleaned both split units thoroughly. Airflow is icy cold again and the foul odor is completely gone. Great service and fair pricing.',
    created_at: '2026-11-03T18:00:00Z',
  },
  {
    id: 703,
    booking_id: 850,
    customer_id: 14,
    customer_name: 'David Reynolds',
    customer_email: 'david.r@example.com',
    provider_name: 'VoltSmart Electrical Solutions',
    service_name: 'Circuit Breaker Tripping Diagnostic',
    rating: 5,
    comment: 'Identified a grounded wire on the breaker panel that two previous electricians could not diagnose. Safe, polite, and very knowledgeable.',
    created_at: '2026-10-28T14:10:00Z',
  },
  {
    id: 704,
    booking_id: 842,
    customer_id: 22,
    customer_name: 'Sophia Martinez',
    customer_email: 'sophia.m@example.com',
    provider_name: 'ProClean Deep Cleaning Co.',
    service_name: 'Move-in & Move-out Deep Cleaning',
    rating: 5,
    comment: 'They left the 3-bedroom apartment spotless. Full deposit refund from the landlord with zero deductions. Highly recommend HomeServe!',
    created_at: '2026-10-24T11:45:00Z',
  },
];

export function getClientReviews(userEmail) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const all = [...list];

    // Pre-seed sample reviews if none exist
    for (const sample of DEFAULT_SAMPLE_REVIEWS) {
      if (!all.some((r) => r.id === sample.id || (r.booking_id === sample.booking_id && r.customer_email === sample.customer_email))) {
        all.push(sample);
      }
    }

    return all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch (err) {
    console.error('Failed to read reviews from storage', err);
    return DEFAULT_SAMPLE_REVIEWS;
  }
}

export function saveClientReview(data, currentUser) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];

    const newReview = {
      id: Date.now(),
      booking_id: data.booking_id || 901,
      customer_id: currentUser?.id || Date.now(),
      customer_name: currentUser?.full_name || 'Valued Customer',
      customer_email: (currentUser?.email || 'customer@homeserve.com').toLowerCase(),
      provider_name: data.provider_name || 'Apex Home Solutions',
      service_name: data.service_name || 'Home Maintenance Service',
      rating: Number(data.rating || 5),
      comment: (data.comment || '').trim(),
      created_at: new Date().toISOString(),
    };

    // Replace if review already exists for this booking
    const filtered = existing.filter((r) => r.booking_id !== newReview.booking_id);
    filtered.unshift(newReview);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return newReview;
  } catch (err) {
    console.error('Failed to save review to storage', err);
    return null;
  }
}
