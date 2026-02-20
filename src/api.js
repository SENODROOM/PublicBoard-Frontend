import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const issuesAPI = {
  getAll: (params) => API.get('/issues', { params }),
  getOne: (id) => API.get(`/issues/${id}`),
  getStats: () => API.get('/issues/stats'),
  create: (data) => API.post('/issues', data),
  support: (id) => API.post(`/issues/${id}/support`),
  updateStatus: (id, data) => API.patch(`/issues/${id}/status`, data),
  delete: (id) => API.delete(`/issues/${id}`)
};

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me')
};

export const donationsAPI = {
  getAll: () => API.get('/donations'),
  getStats: () => API.get('/donations/stats'),
  create: (data) => API.post('/donations', data)
};

export const adminAPI = {
  getOverview: () => API.get('/admin/overview'),
  getUsers: (params) => API.get('/admin/users', { params }),
  getUser: (id) => API.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => API.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getIssues: (params) => API.get('/admin/issues', { params }),
  updateIssue: (id, data) => API.patch(`/admin/issues/${id}`, data),
  deleteIssue: (id) => API.delete(`/admin/issues/${id}`),
  bulkStatusUpdate: (ids, status) => API.post('/admin/issues/bulk-status', { ids, status }),
  bulkDelete: (ids) => API.post('/admin/issues/bulk-delete', { ids }),
  getDonations: (params) => API.get('/admin/donations', { params }),
};

export default API;
