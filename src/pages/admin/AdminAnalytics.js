import React, { useEffect, useState } from "react";
import { analyticsAPI } from "../../api";
import toast from "react-hot-toast";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const BAR_COLORS = [
  "#c83232",
  "#1a4a8a",
  "#2a7a4a",
  "#e8a020",
  "#6a3a9a",
  "#888",
  "#3a8a8a",
];

function MiniBar({ label, value, max, color = "var(--blue)" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 130,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "#555",
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{ flex: 1, height: 14, background: "#eee", overflow: "hidden" }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <div
        style={{
          width: 28,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "var(--ink)" }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "2px solid var(--ink)",
        padding: "18px 20px",
        boxShadow: "3px 3px 0 var(--ink)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#888",
          marginTop: 6,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function TrendLine({ data, width = 300, height = 60, color = "#1a4a8a" }) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.created || d.count || 0);
  const max = Math.max(...vals, 1);
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * (width - 20) + 10;
      const y = height - 10 - (v / max) * (height - 20);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * (width - 20) + 10;
        const y = height - 10 - (v / max) * (height - 20);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    analyticsAPI
      .get(range)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading)
    return (
      <div style={{ padding: 32 }}>
        <div className="loading">
          <div className="spinner" />
          Loading analytics…
        </div>
      </div>
    );

  if (!data) return null;

  const maxDow = Math.max(...(data.byDayOfWeek || []).map((d) => d.count), 1);
  const maxHour = Math.max(...(data.byHour || []).map((h) => h.count), 1);
  const maxCat = Math.max(...(data.categoryTrend || []).map((c) => c.count), 1);
  const maxLoc = Math.max(...(data.topLocations || []).map((l) => l.count), 1);
  const avgHrs = data.avgResolutionTime?.avg || 0;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#888",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 4,
            }}
          >
            Admin / Analytics
          </div>
          <h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>Analytics</h1>
        </div>
        <div
          style={{ display: "flex", gap: 0, border: "2px solid var(--ink)" }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              style={{
                padding: "6px 16px",
                border: "none",
                cursor: "pointer",
                background: range === opt.value ? "var(--ink)" : "var(--white)",
                color: range === opt.value ? "#fff" : "var(--ink)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.05em",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Avg Resolution"
          value={
            avgHrs < 24
              ? `${Math.round(avgHrs)}h`
              : `${Math.round(avgHrs / 24)}d`
          }
          sub={`Min: ${Math.round(data.avgResolutionTime?.min || 0)}h`}
          color="var(--green)"
        />
        <StatCard
          label="Issues Reported"
          value={(data.issuesTrend || []).reduce((s, d) => s + d.created, 0)}
          sub={`Last ${range} days`}
          color="var(--blue)"
        />
        <StatCard
          label="Issues Resolved"
          value={(data.issuesTrend || []).reduce(
            (s, d) => s + (d.resolved || 0),
            0,
          )}
          sub="in period"
          color="var(--green)"
        />
        <StatCard
          label="New Users"
          value={(data.userTrend || []).reduce((s, d) => s + d.count, 0)}
          sub="registrations"
          color="var(--purple)"
        />
        <StatCard
          label="Top Issue"
          value={(data.topIssues?.[0]?.supportCount || 0) + "▲"}
          sub={(data.topIssues?.[0]?.title || "").slice(0, 24) + "…"}
          color="var(--amber)"
        />
      </div>

      {/* Two columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Issue trend */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Issues Created vs Resolved
          </div>
          <div style={{ marginBottom: 8 }}>
            <TrendLine
              data={data.issuesTrend}
              width={360}
              height={80}
              color="#c83232"
            />
          </div>
          {data.issuesTrend?.length > 0 && (
            <div
              style={{
                fontSize: 10,
                color: "#aaa",
                fontFamily: "var(--font-mono)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{data.issuesTrend[0]?._id}</span>
              <span>{data.issuesTrend[data.issuesTrend.length - 1]?._id}</span>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Issues by Category
          </div>
          {(data.categoryTrend || []).map((c, i) => (
            <MiniBar
              key={c._id}
              label={c._id}
              value={c.count}
              max={maxCat}
              color={BAR_COLORS[i % BAR_COLORS.length]}
            />
          ))}
        </div>

        {/* Day of week heatmap */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Issues by Day of Week
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "flex-end",
              height: 80,
            }}
          >
            {(data.byDayOfWeek || []).map((d, i) => {
              const pct = maxDow > 0 ? d.count / maxDow : 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(4, pct * 60)}px`,
                      background:
                        pct > 0.7
                          ? "var(--red)"
                          : pct > 0.4
                            ? "var(--amber)"
                            : "var(--blue)",
                      transition: "height 0.6s",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      color: "#888",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly heatmap */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Reports by Hour of Day
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              alignItems: "flex-end",
              height: 60,
              overflow: "hidden",
            }}
          >
            {(data.byHour || []).map((h) => {
              const pct = maxHour > 0 ? h.count / maxHour : 0;
              return (
                <div
                  key={h.hour}
                  title={`${h.hour}:00 — ${h.count} issues`}
                  style={{
                    flex: 1,
                    height: `${Math.max(2, pct * 56)}px`,
                    background: `rgba(26,74,138,${0.2 + pct * 0.8})`,
                    transition: "height 0.6s",
                    cursor: "default",
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              fontSize: 9,
              color: "#aaa",
            }}
          >
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
        </div>

        {/* Top locations */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Top Hotspot Locations
          </div>
          {(data.topLocations || []).slice(0, 8).map((l, i) => (
            <MiniBar
              key={l._id}
              label={l._id}
              value={l.count}
              max={maxLoc}
              color={i < 3 ? "var(--red)" : "var(--blue)"}
            />
          ))}
        </div>

        {/* Resolution by category */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Avg Resolution Time (hrs) by Category
          </div>
          {(data.resolutionByCategory || []).map((c) => (
            <div
              key={c._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid #f5f0e8",
                fontSize: 12,
              }}
            >
              <span style={{ color: "#555" }}>{c._id}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {c.avgHours < 24
                  ? `${Math.round(c.avgHours)}h`
                  : `${Math.round(c.avgHours / 24)}d`}
                <span style={{ fontWeight: 400, color: "#aaa", fontSize: 10 }}>
                  {" "}
                  ({c.count} resolved)
                </span>
              </span>
            </div>
          ))}
          {(!data.resolutionByCategory ||
            data.resolutionByCategory.length === 0) && (
            <div style={{ color: "#aaa", fontSize: 12 }}>
              No resolved issues yet
            </div>
          )}
        </div>

        {/* Top supported issues */}
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
            gridColumn: "1 / -1",
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 14,
            }}
          >
            Most Supported Open Issues
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 500,
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ background: "var(--paper)" }}>
                  {["Title", "Category", "Priority", "Status", "Supports"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          fontSize: 10,
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(data.topIssues || []).map((issue, i) => (
                  <tr
                    key={issue._id}
                    style={{ borderBottom: "1px solid #f0ebe0" }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                      {issue.title}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#666" }}>
                      {issue.category}
                    </td>
                    <td style={{ padding: "10px 12px" }}>{issue.priority}</td>
                    <td style={{ padding: "10px 12px" }}>{issue.status}</td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--amber)",
                      }}
                    >
                      ▲ {issue.supportCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
