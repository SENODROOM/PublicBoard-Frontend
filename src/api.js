import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Issues ───────────────────────────────────────────────
export const issuesAPI = {
  getAll: (params = {}) =>
    api.get('/issues', { params }).then(r => r.data),
  getOne: (id) =>
    api.get(`/issues/${id}`).then(r => r.data),
  getRelated: (id) =>
    api.get(`/issues/${id}/related`).then(r => r.data),
  getStats: () =>
    api.get('/issues/stats').then(r => r.data),
  create: (data) =>
    api.post('/issues', data).then(r => r.data),
  support: (id) =>
    api.post(`/issues/${id}/support`).then(r => r.data),
  watch: (id) =>
    api.post(`/issues/${id}/watch`).then(r => r.data),
  bookmark: (id) =>
    api.post(`/issues/${id}/bookmark`).then(r => r.data),
  addComment: (id, text) =>
    api.post(`/issues/${id}/comments`, { text }).then(r => r.data),
  deleteComment: (issueId, commentId) =>
    api.delete(`/issues/${issueId}/comments/${commentId}`).then(r => r.data),
  updateStatus: (id, status, message) =>
    api.patch(`/issues/${id}/status`, { status, message }).then(r => r.data),
  lockComments: (id) =>
    api.patch(`/issues/${id}/lock`).then(r => r.data),
  assign: (id, userId, name) =>
    api.patch(`/issues/${id}/assign`, { userId, name }).then(r => r.data),
  exportCSV: () =>
    api.get('/issues/export/csv', { responseType: 'blob' }).then(r => r.data),
};

// ── Announcements ────────────────────────────────────────
export const announcementsAPI = {
  getActive: () =>
    api.get('/announcements').then(r => r.data),
  getAll: () =>
    api.get('/announcements/all').then(r => r.data),
  create: (data) =>
    api.post('/announcements', data).then(r => r.data),
  toggle: (id) =>
    api.patch(`/announcements/${id}/toggle`).then(r => r.data),
  delete: (id) =>
    api.delete(`/announcements/${id}`).then(r => r.data),
};

// ── Users / Auth ─────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }).then(r => r.data),
  me: () =>
    api.get('/auth/me').then(r => r.data),
  updateProfile: (data) =>
    api.patch('/auth/me', data).then(r => r.data),
  getMyBookmarks: () =>
    api.get('/users/me/bookmarks').then(r => r.data),
  getMyIssues: () =>
    api.get('/users/me/issues').then(r => r.data),
};

// ── Admin ────────────────────────────────────────────────
export const adminAPI = {
  getOverview: () =>
    api.get('/admin/overview').then(r => r.data),
  getIssues: (params = {}) =>
    api.get('/admin/issues', { params }).then(r => r.data),
  updateIssue: (id, data) =>
    api.patch(`/admin/issues/${id}`, data).then(r => r.data),
  bulkAction: (ids, action, value) =>
    api.post('/admin/issues/bulk', { ids, action, value }).then(r => r.data),
  getUsers: (params = {}) =>
    api.get('/admin/users', { params }).then(r => r.data),
  getUser: (id) =>
    api.get(`/admin/users/${id}`).then(r => r.data),
  updateUser: (id, data) =>
    api.patch(`/admin/users/${id}`, data).then(r => r.data),
  getActivityLog: (params = {}) =>
    api.get('/admin/activity', { params }).then(r => r.data),
  getAnalytics: (range = '30') =>
    api.get('/analytics', { params: { range } }).then(r => r.data),
  exportIssuesCSV: () =>
    api.get('/issues/export/csv', { responseType: 'blob' }).then(r => r.data),
  exportDonationsCSV: () =>
    api.get('/admin/donations/export', { responseType: 'blob' }).then(r => r.data),
};

// ── Donations ────────────────────────────────────────────
export const donationsAPI = {
  create: (data) =>
    api.post('/donations', data).then(r => r.data),
  getAll: (params = {}) =>
    api.get('/admin/donations', { params }).then(r => r.data),
};

// Simple GET helper for AnnouncementBanner
export const api_get = (path) => api.get(path).then(r => r.data);

export default api;
