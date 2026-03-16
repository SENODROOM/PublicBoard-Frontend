import React, { useState, useEffect } from "react";
import { adminAPI } from "../../api";
import toast from "react-hot-toast";

const TYPE_STYLES = {
  info: { bg: "#1a4a8a", label: "Info" },
  warning: { bg: "#e8a020", label: "Warning" },
  success: { bg: "#2a7a4a", label: "Success" },
  critical: { bg: "#c83232", label: "Critical" },
};

const EMPTY_FORM = {
  title: "",
  body: "",
  type: "info",
  pinned: false,
  dismissible: true,
  expiresAt: "",
  link: "",
  linkLabel: "",
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getAnnouncements();
      setAnnouncements(r.data.announcements || []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim())
      return toast.error("Title and body required");
    setSaving(true);
    try {
      await adminAPI.createAnnouncement({
        ...form,
        expiresAt: form.expiresAt || null,
      });
      toast.success("Announcement created");
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleAnnouncement(id);
      fetch();
      toast.success("Toggled");
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      fetch();
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div style={{ padding: "32px 24px" }}>
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
            Admin / Announcements
          </div>
          <h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>Announcements</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "✕ Cancel" : "+ New Announcement"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "var(--white)",
            border: "2px solid var(--amber)",
            padding: 24,
            marginBottom: 28,
            boxShadow: "4px 4px 0 var(--amber)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 20,
            }}
          >
            New Announcement
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
              <label>Title *</label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Announcement title"
                maxLength={120}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                {Object.entries(TYPE_STYLES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Body * (max 600 chars)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={3}
              maxLength={600}
              placeholder="Announcement body text…"
              style={{ resize: "vertical" }}
            />
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
              <label>Expiry date (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Link URL (optional)</label>
              <input
                value={form.link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link: e.target.value }))
                }
                placeholder="https://…"
              />
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 12 }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pinned: e.target.checked }))
                }
              />{" "}
              Pin to top
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.dismissible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dismissible: e.target.checked }))
                }
              />{" "}
              Dismissible
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating…" : "✓ Create Announcement"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "#aaa",
            fontSize: 14,
          }}
        >
          No announcements yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {announcements.map((ann) => {
            const ts = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
            return (
              <div
                key={ann._id}
                style={{
                  background: "var(--white)",
                  border: "2px solid var(--ink)",
                  borderLeft: `5px solid ${ts.bg}`,
                  padding: "16px 20px",
                  opacity: ann.isActive ? 1 : 0.55,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 7px",
                          background: ts.bg,
                          color: "#fff",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {ts.label.toUpperCase()}
                      </span>
                      {ann.pinned && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            background: "var(--amber)",
                            color: "var(--ink)",
                            fontWeight: 700,
                          }}
                        >
                          PINNED
                        </span>
                      )}
                      {!ann.isActive && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            border: "1px solid #aaa",
                            color: "#aaa",
                          }}
                        >
                          INACTIVE
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          color: "#aaa",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        by {ann.createdBy}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      {ann.title}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}
                    >
                      {ann.body}
                    </div>
                    {ann.expiresAt && (
                      <div
                        style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}
                      >
                        Expires: {new Date(ann.expiresAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggle(ann._id)}
                      className="btn btn-sm"
                      style={{ fontSize: 10 }}
                    >
                      {ann.isActive ? "⏸ Deactivate" : "▶ Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="btn btn-sm btn-red"
                      style={{ fontSize: 10 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
