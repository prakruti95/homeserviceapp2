const STORAGE_KEY = 'homeserve_client_disputes';

const DEFAULT_SAMPLE_COMPLAINTS = [
  {
    id: 801,
    ticket_number: 'TKT-2026-0891',
    booking_id: 901,
    booking_reference: 'HS-BK-78912',
    service_name: 'Emergency Pipe Leak & Burst Repair',
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    provider_name: 'Apex Home Solutions',
    subject: 'Minor drip under secondary valve',
    description: 'The main burst was fixed well, but a tiny drop formed near the secondary isolation joint later in the evening.',
    priority: 'medium',
    status: 'resolved',
    resolution_notes: 'Technician returned under 30-day warranty, re-tightened the brass union nut and tested at 60 PSI. Certified leak-free.',
    created_at: '2026-11-02T16:45:00Z',
    resolved_at: '2026-11-03T11:00:00Z',
  },
  {
    id: 802,
    ticket_number: 'TKT-2026-0904',
    booking_id: 902,
    booking_reference: 'HS-BK-78913',
    service_name: 'AC Deep Foam Cleaning & Filter Wash',
    customer_id: 3,
    customer_name: 'Emily Watson',
    customer_email: 'customer@homeserve.com',
    provider_name: 'Apex Home Solutions',
    subject: 'Request for detailed filter maintenance report',
    description: 'Please upload the digital air quality inspection certificate and filter efficiency report for my landlord records.',
    priority: 'low',
    status: 'in_review',
    resolution_notes: 'Support specialist has requested the PDF inspection checklist from the field technician.',
    created_at: '2026-11-04T09:15:00Z',
    resolved_at: null,
  },
];

export function getClientComplaints(userEmail) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    const normEmail = (userEmail || '').toLowerCase();
    const all = [...list];

    // Pre-seed sample complaints for demo customer or if no disputes exist yet
    if (!normEmail || normEmail === 'customer@homeserve.com' || all.length === 0) {
      for (const sample of DEFAULT_SAMPLE_COMPLAINTS) {
        if (!all.some((c) => c.id === sample.id || c.ticket_number === sample.ticket_number)) {
          all.push(sample);
        }
      }
    }

    return all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } catch (err) {
    console.error('Failed to read complaints from storage', err);
    return DEFAULT_SAMPLE_COMPLAINTS;
  }
}

export function saveClientComplaint(data, currentUser) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newComplaint = {
      id: Date.now(),
      ticket_number: `TKT-2026-${randomSuffix}`,
      booking_id: data.booking_id || 901,
      booking_reference: data.booking_reference || `HS-BK-${randomSuffix}`,
      service_name: data.service_name || 'Home Maintenance Service',
      customer_id: currentUser?.id || Date.now(),
      customer_name: currentUser?.full_name || 'Valued Customer',
      customer_email: (currentUser?.email || 'customer@homeserve.com').toLowerCase(),
      provider_name: data.provider_name || 'Apex Home Solutions',
      subject: data.subject || 'Service Quality Concern',
      description: data.description || '',
      priority: data.priority || 'medium',
      status: 'open',
      resolution_notes: 'Dispute registered with customer advocacy team. Response typically within 2-4 business hours.',
      created_at: new Date().toISOString(),
      resolved_at: null,
    };

    existing.unshift(newComplaint);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return newComplaint;
  } catch (err) {
    console.error('Failed to save complaint to storage', err);
    return null;
  }
}

export function updateClientComplaint(complaintId, updates) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];

    if (!list.some((c) => String(c.id) === String(complaintId))) {
      const sample = DEFAULT_SAMPLE_COMPLAINTS.find((c) => String(c.id) === String(complaintId));
      if (sample) list.push({ ...sample });
    }

    list = list.map((c) => {
      if (String(c.id) === String(complaintId)) {
        return {
          ...c,
          ...updates,
          resolved_at: updates.status === 'resolved' ? (updates.resolved_at || new Date().toISOString()) : c.resolved_at,
        };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list.find((c) => String(c.id) === String(complaintId));
  } catch (err) {
    console.error('Failed to update complaint in storage', err);
    return null;
  }
}
