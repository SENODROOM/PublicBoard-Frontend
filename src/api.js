import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Axios instance ────────────────────────────────────────
export const api = axios.create({ baseURL: BASE_URL });

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem("pb_refresh");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("pb_token", data.token);
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        refreshQueue.forEach((q) => q.resolve(data.token));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach((q) => q.reject(refreshErr));
        refreshQueue = [];
        localStorage.removeItem("pb_token");
        localStorage.removeItem("pb_refresh");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// ── Issues API ────────────────────────────────────────────
export const issuesAPI = {
  getAll: (params) => api.get("/issues", { params }),
  getOne: (id) => api.get(`/issues/${id}`),
  getStats: () => api.get("/issues/stats"),
  getRelated: (id) => api.get(`/issues/${id}/related`),
  create: (data) => api.post("/issues", data),
  support: (id) => api.post(`/issues/${id}/support`),
  bookmark: (id) => api.post(`/issues/${id}/bookmark`),
  watch: (id) => api.post(`/issues/${id}/watch`),
  addComment: (id, text) => api.post(`/issues/${id}/comments`, { text }),
  deleteComment: (id, commentId) =>
    api.delete(`/issues/${id}/comments/${commentId}`),
  updateStatus: (id, data) => api.patch(`/issues/${id}/status`, data),
  lock: (id) => api.patch(`/issues/${id}/lock`),
  assign: (id, data) => api.patch(`/issues/${id}/assign`, data),
  exportCSV: () => api.get("/issues/export/csv", { responseType: "blob" }),
};

// ── Auth API ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  me: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/me", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
};

// ── Donations API ─────────────────────────────────────────
export const donationsAPI = {
  getAll: () => api.get("/donations"),
  getStats: () => api.get("/donations/stats"),
  create: (data) => api.post("/donations", data),
};

// ── Announcements API ─────────────────────────────────────
export const announcementsAPI = {
  getActive: () => api.get("/announcements"),
  getAll: () => api.get("/announcements/all"),
  create: (data) => api.post("/announcements", data),
  toggle: (id) => api.patch(`/announcements/${id}/toggle`),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ── Notifications API ─────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete("/notifications"),
};

// ── Admin API ─────────────────────────────────────────────
export const adminAPI = {
  getOverview: () => api.get("/admin/overview"),
  // Issues
  getIssues: (p) => api.get("/admin/issues", { params: p }),
  updateIssue: (id, d) => api.patch(`/admin/issues/${id}`, d),
  deleteIssue: (id) => api.delete(`/admin/issues/${id}`),
  bulkAction: (data) => api.post("/admin/issues/bulk", data),
  bulkStatusUpdate: (ids, status) =>
    api.post("/admin/issues/bulk", { ids, action: "status", value: status }),
  bulkDelete: (ids) =>
    api.post("/admin/issues/bulk", { ids, action: "delete" }),
  exportIssuesCSV: () =>
    api.get("/issues/export/csv", { responseType: "blob" }),
  // Users
  getUsers: (p) => api.get("/admin/users", { params: p }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, d) => api.patch(`/admin/users/${id}`, d),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // Donations
  getDonations: (p) => api.get("/admin/donations", { params: p }),
  exportDonationsCSV: () =>
    api.get("/admin/donations/export", { responseType: "blob" }),
  // Activity
  getActivity: (p) => api.get("/admin/activity", { params: p }),
  // Announcements
  getAnnouncements: () => api.get("/announcements/all"),
  createAnnouncement: (d) => api.post("/announcements", d),
  toggleAnnouncement: (id) => api.patch(`/announcements/${id}/toggle`),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

// ── Analytics API ─────────────────────────────────────────
export const analyticsAPI = {
  get: (range) => api.get("/analytics", { params: { range } }),
};

// ── Default export (keeps backward-compat with files using `import api from '../api'`) ──
export default api;

// ── SSE — real-time event stream ──────────────────────────
export function createEventSource(onMessage) {
  const token = localStorage.getItem("pb_token");
  const url = `${BASE_URL}/events${token ? `?token=${token}` : ""}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch (_) {}
  };
  es.onerror = () => es.close();
  return es;
}
