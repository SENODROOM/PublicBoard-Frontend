import React from "react";
import { Link } from "react-router-dom";

const TYPE_ICONS = {
  "issue.status_changed": "🔄",
  "issue.commented": "💬",
  "issue.supported": "▲",
  mention: "@",
  system: "📢",
  "donation.received": "💚",
  "badge.earned": "🏆",
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: "var(--paper)",
        borderLeft: "2px solid var(--ink)",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-6px 0 24px rgba(0,0,0,0.18)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "var(--ink)",
          borderBottom: "2px solid var(--amber)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              color: "white",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            Notifications
          </div>
          {unreadCount > 0 && (
            <div style={{ color: "var(--amber)", fontSize: 10, marginTop: 2 }}>
              {unreadCount} unread
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                background: "none",
                border: "1px solid var(--cement)",
                color: "var(--cement)",
                fontSize: 10,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div
            style={{ padding: "48px 20px", textAlign: "center", color: "#aaa" }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 13 }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && onMarkRead(n._id)}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #e8e4d8",
                background: n.isRead ? "transparent" : "rgba(232,160,32,0.06)",
                cursor: n.isRead ? "default" : "pointer",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: n.isRead ? "#eee" : "var(--ink)",
                    color: n.isRead ? "#888" : "var(--amber)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                  }}
                >
                  {TYPE_ICONS[n.type] || "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: n.isRead ? "#777" : "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.message}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 5,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#bbb" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          background: "var(--amber)",
                          borderRadius: "50%",
                          display: "inline-block",
                        }}
                      />
                    )}
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={onClose}
                        style={{
                          fontSize: 10,
                          color: "var(--blue)",
                          textDecoration: "none",
                        }}
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
