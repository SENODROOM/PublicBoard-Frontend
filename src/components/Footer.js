import React from "react";
import { Link } from "react-router-dom";

const LINKS = {
  Platform: [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Issues" },
    { to: "/report", label: "Report Issue" },
    { to: "/search", label: "Advanced Search" },
    { to: "/donate", label: "Donate" },
  ],
  Account: [
    { to: "/login", label: "Sign In" },
    { to: "/register", label: "Create Account" },
    { to: "/profile", label: "My Profile" },
    { to: "/bookmarks", label: "Bookmarks" },
  ],
  Categories: [
    { to: "/dashboard?category=Infrastructure", label: "Infrastructure" },
    { to: "/dashboard?category=Safety", label: "Safety" },
    { to: "/dashboard?category=Sanitation", label: "Sanitation" },
    { to: "/dashboard?category=Environment", label: "Environment" },
    { to: "/dashboard?category=Transportation", label: "Transportation" },
    {
      to: "/dashboard?category=Community+Resources",
      label: "Community Resources",
    },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "var(--ink)",
        borderTop: "2px solid var(--amber)",
        marginTop: "auto",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Main grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px 32px",
          display: "grid",
          gridTemplateColumns: "auto 1fr 1fr 1fr",
          gap: "40px 32px",
        }}
        className="footer-grid"
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <img
              src="/logo.png"
              alt="PublicBoard"
              style={{
                width: 40,
                height: 40,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: "#f5f0e8",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              PublicBoard
            </span>
          </div>
          <p
            style={{
              color: "var(--cement)",
              fontSize: 12,
              lineHeight: 1.8,
              maxWidth: 220,
              marginBottom: 20,
            }}
          >
            Community-powered issue tracking. Report, track, and resolve local
            problems together.
          </p>
          {/* Status dot */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--cement)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                background: "#2a7a4a",
                borderRadius: "50%",
                display: "inline-block",
                boxShadow: "0 0 0 2px rgba(42,122,74,0.3)",
              }}
            />
            All systems operational
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([heading, items]) => (
          <div key={heading}>
            <div
              style={{
                color: "var(--amber)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              {heading}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map(({ to, label }) => (
                <li key={to} style={{ marginBottom: 8 }}>
                  <Link
                    to={to}
                    style={{
                      color: "var(--cement)",
                      fontSize: 12,
                      textDecoration: "none",
                      transition: "color 0.15s",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#f5f0e8")}
                    onMouseLeave={(e) =>
                      (e.target.style.color = "var(--cement)")
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ color: "var(--cement)", fontSize: 11 }}>
          © {year} PublicBoard — Open source civic tech
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { to: "/dashboard", label: "Issues" },
            { to: "/report", label: "Report" },
            { to: "/donate", label: "Donate" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                color: "var(--cement)",
                fontSize: 11,
                textDecoration: "none",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => (e.target.style.color = "var(--amber)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--cement)")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
