import { useState, useEffect, useCallback } from "react";
import { notificationsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await notificationsAPI.getAll({ limit: 30 });
      setNotifications(r.data.notifications);
      setUnreadCount(r.data.unreadCount);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications((ns) =>
      ns.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsAPI.markAllRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Called by useSSE when a new notification arrives for this user
  const addNotification = useCallback((notif) => {
    setNotifications((ns) => [notif, ...ns]);
    setUnreadCount((c) => c + 1);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    addNotification,
  };
}
