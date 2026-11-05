import { fallbackCategories, fallbackServices } from '../data/catalog';

const CAT_STORAGE_KEY = 'homeserve_client_categories';
const SRV_STORAGE_KEY = 'homeserve_client_services';

export function getClientCategories() {
  try {
    const raw = localStorage.getItem(CAT_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    // Pre-seed with fallbackCategories if empty
    if (!list || list.length === 0) {
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(fallbackCategories));
      return [...fallbackCategories];
    }

    // Ensure any new fallback categories exist
    const map = new Map();
    fallbackCategories.forEach((c) => map.set(c.id, c));
    list.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  } catch (err) {
    console.error('Failed to read categories from storage', err);
    return fallbackCategories;
  }
}

export function saveClientCategory(categoryData) {
  try {
    const current = getClientCategories();
    const newCat = {
      id: Date.now(),
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || 'Service Category',
      image_url: categoryData.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    };
    current.push(newCat);
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(current));
    return newCat;
  } catch (err) {
    console.error('Failed to save category to storage', err);
    return null;
  }
}

export function getClientServices() {
  try {
    const raw = localStorage.getItem(SRV_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];

    if (!list || list.length === 0) {
      localStorage.setItem(SRV_STORAGE_KEY, JSON.stringify(fallbackServices));
      return [...fallbackServices];
    }

    const map = new Map();
    fallbackServices.forEach((s) => map.set(s.id, s));
    list.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  } catch (err) {
    console.error('Failed to read services from storage', err);
    return fallbackServices;
  }
}

export function saveClientService(serviceData) {
  try {
    const current = getClientServices();
    const categories = getClientCategories();
    const catId = Number(serviceData.category_id);
    const matchedCategory = categories.find((c) => c.id === catId) || { id: catId, name: 'General Maintenance' };

    const newService = {
      id: Date.now(),
      name: serviceData.name.trim(),
      description: serviceData.description?.trim() || '',
      base_price: Number(serviceData.base_price || 79.0),
      duration_minutes: Number(serviceData.duration_minutes || 60),
      category_id: catId,
      category: matchedCategory,
      image_url: serviceData.image_url || matchedCategory.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviews_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    current.unshift(newService);
    localStorage.setItem(SRV_STORAGE_KEY, JSON.stringify(current));
    return newService;
  } catch (err) {
    console.error('Failed to save service to storage', err);
    return null;
  }
}

export function deleteClientService(serviceId) {
  try {
    const current = getClientServices();
    const filtered = current.filter((s) => s.id !== Number(serviceId));
    localStorage.setItem(SRV_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete service from storage', err);
    return false;
  }
}

export function updateClientService(serviceId, updates) {
  try {
    const current = getClientServices();
    const updated = current.map((s) => {
      if (s.id === Number(serviceId)) {
        return { ...s, ...updates };
      }
      return s;
    });
    localStorage.setItem(SRV_STORAGE_KEY, JSON.stringify(updated));
    return updated.find((s) => s.id === Number(serviceId));
  } catch (err) {
    console.error('Failed to update service in storage', err);
    return null;
  }
}
