import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { issuesAPI, authAPI } from "../api";
import IssueCard from "../components/IssueCard";
import toast from "react-hot-toast";

const BADGE_COLORS = {
  first_report: "#1a4a8a",
  five_reports: "#6a3a9a",
  ten_reports: "#c83232",
  first_resolve: "#2a7a4a",
  five_resolves: "#e8a020",
  supporter: "#1a4a8a",
  donor: "#2a7a4a",
  veteran: "#e8a020",
};

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", neighborhood: "" });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [changingPw, setChangingPw] = useState(false);
  const [tab, setTab] = useState("issues");

  useEffect(() => {
    if (user)
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        neighborhood: user.neighborhood || "",
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    issuesAPI
      .getAll({ limit: 20, sort: "-createdAt" })
      .then((r) => {
        const mine = r.data.issues.filter(
          (i) => i.reporter?.userId === user.id,
        );
        setMyIssues(mine);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm)
      return toast.error("New passwords do not match");
    if (pwForm.newPassword.length < 8)
      return toast.error("Password must be at least 8 characters");
    setChangingPw(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return null;

  const resolvedCount = myIssues.filter((i) => i.status === "Resolved").length;
  const repLevel = Math.floor((user.reputation || 0) / 50) + 1;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 20px",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Header card */}
      <div
        style={{
          background: "var(--white)",
          border: "2px solid var(--ink)",
          padding: 28,
          marginBottom: 24,
          boxShadow: "4px 4px 0 var(--ink)",
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--amber)",
            flexShrink: 0,
          }}
        >
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {user.name}
            </h1>
            {user.role === "admin" && (
              <span
                style={{
                  background: "var(--amber)",
                  color: "var(--ink)",
                  fontSize: 9,
                  padding: "3px 8px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                }}
              >
                ADMIN
              </span>
            )}
          </div>
          {user.bio && (
            <div
              style={{
                fontSize: 13,
                color: "#555",
                marginBottom: 8,
                lineHeight: 1.6,
                maxWidth: 400,
              }}
            >
              {user.bio}
            </div>
          )}
          {user.neighborhood && (
            <div style={{ fontSize: 11, color: "#888" }}>
              🏘️ {user.neighborhood}
            </div>
          )}
          {/* Rep */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 800,
                color: "var(--amber)",
                lineHeight: 1,
              }}
            >
              {user.reputation || 0}
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#888",
                }}
              >
                Reputation
              </div>
              <div style={{ fontSize: 10, color: "#aaa" }}>
                Level {repLevel}
              </div>
            </div>
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => setEditing(!editing)}>
          {editing ? "✕ Cancel" : "✏️ Edit Profile"}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <form
          onSubmit={handleSave}
          style={{
            background: "var(--white)",
            border: "2px solid var(--amber)",
            padding: 24,
            marginBottom: 24,
            boxShadow: "4px 4px 0 var(--amber)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 16,
            }}
          >
            Edit Profile
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div className="form-group">
              <label>Display Name</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Neighborhood</label>
              <input
                value={form.neighborhood}
                onChange={(e) =>
                  setForm((f) => ({ ...f, neighborhood: e.target.value }))
                }
                placeholder="Your area…"
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Bio (max 200 chars)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={200}
              rows={2}
              style={{ resize: "vertical" }}
              placeholder="Tell the community about yourself…"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      )}

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Reported",
            value: user.stats?.issuesReportedCount || myIssues.length,
          },
          {
            label: "Resolved",
            value: user.stats?.issuesResolvedCount || resolvedCount,
          },
          { label: "Supported", value: user.stats?.totalSupportGiven || 0 },
          { label: "Comments", value: user.stats?.commentsCount || 0 },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "var(--white)",
              border: "2px solid var(--ink)",
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#888",
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {user.badges?.length > 0 && (
        <div
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#888",
              marginBottom: 12,
            }}
          >
            Badges Earned
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user.badges.map((b) => (
              <span
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  fontSize: 11,
                  border: `2px solid ${BADGE_COLORS[b.id] || "#888"}`,
                  color: BADGE_COLORS[b.id] || "#888",
                  fontWeight: 700,
                  background: (BADGE_COLORS[b.id] || "#888") + "10",
                }}
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          border: "2px solid var(--ink)",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {["issues", "password"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              background: tab === t ? "var(--ink)" : "var(--white)",
              color: tab === t ? "#fff" : "var(--ink)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {t === "issues"
              ? `My Issues (${myIssues.length})`
              : "Change Password"}
          </button>
        ))}
      </div>

      {tab === "issues" &&
        (loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : myIssues.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#aaa" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div>You haven't reported any issues yet.</div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {myIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        ))}

      {tab === "password" && (
        <form
          onSubmit={handlePwChange}
          style={{
            background: "var(--white)",
            border: "2px solid var(--ink)",
            padding: 24,
            maxWidth: 440,
          }}
        >
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>New Password (min 8 chars)</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirm: e.target.value }))
              }
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={changingPw}
          >
            {changingPw ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
