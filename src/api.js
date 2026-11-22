/**
 * Sabji Connect API Client.
 * Connects the React frontend to the FastAPI + MongoDB backend.
 */

const API_BASE = '/api';

export const tokens = {
  getAccess: () => localStorage.getItem('sc_access_token'),
  getRefresh: () => localStorage.getItem('sc_refresh_token'),
  set: (access, refresh) => {
    if (access) localStorage.setItem('sc_access_token', access);
    if (refresh) localStorage.setItem('sc_refresh_token', refresh);
  },
  clear: () => {
    localStorage.removeItem('sc_access_token');
    localStorage.removeItem('sc_refresh_token');
  },
};

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = tokens.getAccess();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Handle Token Expiry -> auto-refresh
  if (res.status === 401 && tokens.getRefresh()) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.getRefresh() }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        tokens.set(data.access_token, data.refresh_token);
        headers['Authorization'] = `Bearer ${data.access_token}`;
        res = await fetch(url, { ...options, headers });
      } else {
        tokens.clear();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch {
      tokens.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.detail || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  // If 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth Endpoints ──────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    tokens.set(data.access_token, data.refresh_token);
    return data;
  },
  getMe: () => request('/auth/me'),
  updateMe: (data) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  adminCreateUser: (userData) => request('/auth/users', { method: 'POST', body: JSON.stringify(userData) }),
  adminListUsers: (unassignedOnly = false) => request(`/auth/users?unassigned_only=${unassignedOnly}`),
  adminUpdateUser: (userId, data) => request(`/auth/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  adminDeleteUser: (userId) => request(`/auth/users/${userId}`, {
    method: 'DELETE',
  }),
};

// ── Catalog Endpoints ───────────────────────────────────────
export const catalogApi = {
  list: (category, search) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    const qs = params.toString();
    return request(`/catalog/${qs ? `?${qs}` : ''}`);
  },
  add: (item) => request('/catalog/', { method: 'POST', body: JSON.stringify(item) }),
  update: (id, item) => request(`/catalog/${id}`, { method: 'PATCH', body: JSON.stringify(item) }),
  delete: (id) => request(`/catalog/${id}`, { method: 'DELETE' }),
};

// ── Orders Endpoints ────────────────────────────────────────
export const ordersApi = {
  list: () => request('/orders/'),
  get: (id) => request(`/orders/${id}`),
  create: (orderDate) => request('/orders/', { method: 'POST', body: JSON.stringify({ order_date: orderDate }) }),
  update: (id, data) => request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};

// ── Families Endpoints ──────────────────────────────────────
export const familiesApi = {
  list: () => request('/families/'),
  create: (name) => request('/families/', { method: 'POST', body: JSON.stringify({ name }) }),
  get: (id) => request(`/families/${id}`),
  update: (id, name) => request(`/families/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }),
  getMembers: (familyId) => request(`/families/${familyId}/members`),
  addMember: (familyId, userId) => request(`/families/${familyId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  }),
  removeMember: (familyId, userId) => request(`/families/${familyId}/members/${userId}`, {
    method: 'DELETE',
  }),
  delete: (id) => request(`/families/${id}`, { method: 'DELETE' }),
};

// ── Requested Items Endpoints ───────────────────────────────
export const requestedItemsApi = {
  list: () => request('/requested-items/'),
  request: (name) => request('/requested-items/', { method: 'POST', body: JSON.stringify({ name }) }),
  approve: (id, category = 'Vegetables', allowedUnits = ['pieces']) => request(`/requested-items/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ category, allowed_units: allowedUnits }),
  }),
  reject: (id) => request(`/requested-items/${id}/reject`, { method: 'PATCH' }),
};

// ── WebSocket Helper for Live Sync ───────────────────────────
export function connectWebSocket(familyId, onMessage) {
  const token = tokens.getAccess();
  if (!token) return null;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws?token=${token}&family_id=${familyId || ''}`;

  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.warn('WebSocket connection error:', err);
    return null;
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch {}
  };

  ws.onclose = () => {
    // Reconnect attempt after 5 seconds
    setTimeout(() => {
      if (tokens.getAccess()) connectWebSocket(familyId, onMessage);
    }, 5000);
  };

  return ws;
}
