import axios from 'axios';

const BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Axios instance ────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh interceptor ─────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    // Only attempt refresh on 401, not on login/refresh routes themselves
    if (
      err.response?.status === 401 &&
      !original._retried &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retried = true;
      const refreshToken = localStorage.getItem('pb_refresh');
      if (!refreshToken) {
        // No refresh token — clear and redirect to login
        localStorage.removeItem('pb_token');
        localStorage.removeItem('pb_refresh');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Queue concurrent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.token;
        localStorage.setItem('pb_token', newToken);
        // Flush queue
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];
        localStorage.removeItem('pb_token');
        localStorage.removeItem('pb_refresh');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// ── Issues API ────────────────────────────────────────────
export const issuesAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getOne: (id) => api.get(`/issues/${id}`),
  getStats: () => api.get('/issues/stats'),
  getRelated: (id) => api.get(`/issues/${id}/related`),
  create: (data) => api.post('/issues', data),
  support: (id) => api.post(`/issues/${id}/support`),
  bookmark: (id) => api.post(`/issues/${id}/bookmark`),
  watch: (id) => api.post(`/issues/${id}/watch`),
  addComment: (id, text) => api.post(`/issues/${id}/comments`, { text }),
  deleteComment: (id, commentId) => api.delete(`/issues/${id}/comments/${commentId}`),
  updateStatus: (id, data) => api.patch(`/issues/${id}/status`, data),
  lock: (id) => api.patch(`/issues/${id}/lock`),
  assign: (id, data) => api.patch(`/issues/${id}/assign`, data),
  exportCSV: () => api.get('/issues/export/csv', { responseType: 'blob' }),
};

// ── Auth API ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

// ── Donations API ─────────────────────────────────────────
export const donationsAPI = {
  getAll: (params) => api.get('/donations', { params }),
  getStats: () => api.get('/donations/stats'),
  createPaymentIntent: (data) => api.post('/donations/create-payment-intent', data),
};

// ── Announcements API ─────────────────────────────────────
export const announcementsAPI = {
  getActive: () => api.get('/announcements'),
  getAll: () => api.get('/announcements/all'),
  create: (data) => api.post('/announcements', data),
  toggle: (id) => api.patch(`/announcements/${id}/toggle`),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ── Notifications API ─────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// ── Admin API ─────────────────────────────────────────────
export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getIssues: (p) => api.get('/admin/issues', { params: p }),
  updateIssue: (id, d) => api.patch(`/admin/issues/${id}`, d),
  deleteIssue: (id) => api.delete(`/admin/issues/${id}`),
  bulkAction: (data) => api.post('/admin/issues/bulk', data),
  bulkStatusUpdate: (ids, status) => api.post('/admin/issues/bulk', { ids, action: 'status', value: status }),
  bulkDelete: (ids) => api.post('/admin/issues/bulk', { ids, action: 'delete' }),
  exportIssuesCSV: () => api.get('/issues/export/csv', { responseType: 'blob' }),
  getUsers: (p) => api.get('/admin/users', { params: p }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, d) => api.patch(`/admin/users/${id}`, d),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDonations: (p) => api.get('/admin/donations', { params: p }),
  exportDonationsCSV: () => api.get('/admin/donations/export', { responseType: 'blob' }),
  getActivity: (p) => api.get('/admin/activity', { params: p }),
  getAnnouncements: () => api.get('/announcements/all'),
  createAnnouncement: (d) => api.post('/announcements', d),
  toggleAnnouncement: (id) => api.patch(`/announcements/${id}/toggle`),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

// ── Analytics API ─────────────────────────────────────────
export const analyticsAPI = {
  get: (range) => api.get('/analytics', { params: { range } }),
};

// ── Default export (backward-compat) ─────────────────────
export default api;

// ── SSE — real-time event stream ──────────────────────────
export function createEventSource(onMessage) {
  const token = localStorage.getItem('pb_token');
  const url = `${BASE_URL}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (_) {}
  };
  es.onerror = () => es.close();
  return es;
}