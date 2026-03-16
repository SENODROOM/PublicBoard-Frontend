import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: "⬛", exact: true },
  { to: "/admin/issues", label: "Issues", icon: "📋" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/donations", label: "Donations", icon: "💚" },
  { to: "/admin/analytics", label: "Analytics", icon: "📊" },
  { to: "/admin/announcements", label: "Announcements", icon: "📢" },
  { to: "/admin/activity", label: "Activity Log", icon: "📜" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  const SidebarContent = () => (
    <div
      style={{
        width: "100%",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(232,160,32,0.25)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#e8a020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              color: "#0a0a0f",
            }}
          >
            PB
          </div>
          <div>
            <div
              style={{
                color: "#f5f0e8",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              PublicBoard
            </div>
            <div
              style={{
                color: "#e8a020",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Admin Panel
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 24px",
                color: active ? "#e8a020" : "#c8c2b4",
                background: active ? "rgba(232,160,32,0.08)" : "transparent",
                borderLeft: `3px solid ${active ? "#e8a020" : "transparent"}`,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                fontWeight: active ? 700 : 400,
                textDecoration: "none",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#666",
            marginBottom: 6,
            letterSpacing: "0.1em",
            fontFamily: "var(--font-mono)",
          }}
        >
          SIGNED IN AS
        </div>
        <div
          style={{
            color: "#f5f0e8",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            marginBottom: 4,
          }}
        >
          {user?.name}
        </div>
        <div style={{ color: "#666", fontSize: 10, marginBottom: 12 }}>
          {user?.email}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link
            to="/"
            style={{
              flex: 1,
              padding: "6px 0",
              textAlign: "center",
              border: "1px solid #333",
              color: "#888",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            ← Site
          </Link>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              padding: "6px 0",
              border: "1px solid #c83232",
              background: "transparent",
              color: "#c83232",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f0e8" }}>
      {/* Desktop sidebar */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
        className="admin-sidebar-desktop"
      >
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div
        className="admin-mobile-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "#0a0a0f",
          borderBottom: "2px solid #e8a020",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 54,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#e8a020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 12,
              color: "#0a0a0f",
            }}
          >
            PB
          </div>
          <span
            style={{
              color: "#f5f0e8",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Admin
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "none",
            border: "1px solid #444",
            color: "#f5f0e8",
            padding: "5px 12px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
        >
          {sidebarOpen ? "✕ Close" : "☰ Menu"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: 54,
            left: 0,
            right: 0,
            zIndex: 199,
            height: "calc(100vh - 54px)",
            background: "#0a0a0f",
            overflowY: "auto",
          }}
        >
          <SidebarContent />
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
        <Outlet />
      </main>

      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar-desktop { display: flex !important; }
          .admin-mobile-bar { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-bar { display: flex !important; }
          main { padding-top: 54px; }
        }
      `}</style>
    </div>
  );
}
