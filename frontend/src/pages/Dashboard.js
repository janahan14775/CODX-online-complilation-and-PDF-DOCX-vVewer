import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../logo.jpg";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ── Sidebar icons ──
const icons = {
  dashboard: "⊞",
  projects: "⟨⟩",
  documents: "📝",
  files: "📁",
  profile: "👤",
  logout: "⏻",
};

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [tab, setTab] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [profile, setProfile] = useState({ name: user.name || "", password: "", confirm: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLang, setNewProjectLang] = useState("cpp");
  const [newDocModal, setNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes, fRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers: authHeaders() }),
        axios.get(`${API}/documents`, { headers: authHeaders() }),
        axios.get(`${API}/files`, { headers: authHeaders() }),
      ]);
      setProjects(pRes.data.projects || []);
      setDocuments(dRes.data.documents || []);
      setFiles(fRes.data.files || []);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) { navigate("/"); return; }
    loadAll();
  }, [loadAll, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Projects ──
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await axios.post(`${API}/projects`, { title: newProjectName, language: newProjectLang }, { headers: authHeaders() });
      setNewProjectModal(false);
      setNewProjectName("");
      loadAll();
    } catch (e) { alert("Failed to create project"); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await axios.delete(`${API}/projects/${id}`, { headers: authHeaders() });
    loadAll();
  };

  // ── Documents ──
  const createDocument = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const res = await axios.post(`${API}/documents`, { title: newDocTitle }, { headers: authHeaders() });
      setNewDocModal(false);
      setNewDocTitle("");
      navigate(`/document-editor?docId=${res.data.document._id}`);
    } catch (e) { alert("Failed to create document"); }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await axios.delete(`${API}/documents/${id}`, { headers: authHeaders() });
    loadAll();
  };

  // ── Files ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/files/upload`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      loadAll();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setFileUploading(false);
    }
  };

  const handleDownloadFile = (id, filename) => {
    const a = document.createElement("a");
    a.href = `${API}/files/download/${id}`;
    a.download = filename;
    a.setAttribute("data-auth", getToken());
    // use fetch approach
    axios.get(`${API}/files/download/${id}`, { headers: authHeaders(), responseType: "blob" }).then((res) => {
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await axios.delete(`${API}/files/${id}`, { headers: authHeaders() });
    loadAll();
  };

  // ── Profile ──
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    if (profile.password && profile.password !== profile.confirm) {
      setProfileMsg({ type: "danger", text: "Passwords do not match" });
      return;
    }
    try {
      const payload = { name: profile.name };
      if (profile.password) payload.password = profile.password;
      await axios.put(`${API}/auth/profile/update`, payload, { headers: authHeaders() });
      const updatedUser = { ...user, name: profile.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setProfile((p) => ({ ...p, password: "", confirm: "" }));
    } catch (err) {
      setProfileMsg({ type: "danger", text: err.response?.data?.message || "Update failed" });
    }
  };

  // ── Stats ──
  const totalStorage = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxStorage = 100 * 1024 * 1024; // 100 MB display cap
  const storagePercent = Math.min((totalStorage / maxStorage) * 100, 100);

  // ── Styles ──
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "projects", label: "Code Projects", icon: icons.projects },
    { id: "documents", label: "Documents", icon: icons.documents },
    { id: "files", label: "My Files", icon: icons.files },
    { id: "profile", label: "Profile", icon: icons.profile },
  ];

  const cardStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none", color: "white", padding: "8px 18px",
    borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  };

  const inputStyle = {
    background: "#0f172a", border: "1px solid #334155", color: "white",
    padding: "10px 14px", borderRadius: "8px", width: "100%",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  const langMap = { cpp: "C++", c: "C", java: "Java", python: "Python", javascript: "JavaScript" };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: "220px", background: "#111827", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <img src={logo} alt="OnlineCodX" style={{ height: "40px", borderRadius: "8px" }} />
          <div style={{ color: "#475569", fontSize: "12px", marginTop: "12px" }}>Cloud IDE Platform</div>
        </div>

        <div style={{ flex: 1, padding: "8px 12px" }}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px", borderRadius: "8px", border: "none",
                background: tab === item.id ? "linear-gradient(135deg,rgba(14,165,233,0.15),rgba(99,102,241,0.15))" : "transparent",
                color: tab === item.id ? "#38bdf8" : "#64748b",
                cursor: "pointer", fontWeight: tab === item.id ? 600 : 400,
                fontSize: "14px", marginBottom: "4px",
                borderLeft: tab === item.id ? "3px solid #38bdf8" : "3px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px" }}>
          <div style={{ ...cardStyle, padding: "14px", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>Storage</div>
            <div style={{ height: "6px", background: "#334155", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${storagePercent}%`, height: "100%", background: "linear-gradient(90deg,#0ea5e9,#6366f1)", borderRadius: "4px" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>{formatSize(totalStorage)} used</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.1)", color: "#f87171", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
          >
            <span>{icons.logout}</span> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
              Welcome back, {user.name || "Developer"} 👋
            </h1>
            <p style={{ color: "#64748b", marginBottom: "28px" }}>Here's your overview</p>

            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Code Projects", value: projects.length, icon: "⟨⟩", color: "#0ea5e9" },
                { label: "Documents", value: documents.length, icon: "📝", color: "#6366f1" },
                { label: "Uploaded Files", value: files.length, icon: "📁", color: "#10b981" },
                { label: "Storage Used", value: formatSize(totalStorage), icon: "💾", color: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${s.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent projects */}
            <h3 style={{ fontWeight: 600, marginBottom: "12px", color: "#94a3b8", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Recent Projects</h3>
            {projects.slice(0, 3).map((p) => (
              <div key={p._id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>⟨⟩</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{langMap[p.language] || p.language} • {timeAgo(p.createdAt)}</div>
                  </div>
                </div>
                <button onClick={() => navigate(`/editor?projectId=${p._id}`)} style={btnPrimary}>Open</button>
              </div>
            ))}
            {projects.length === 0 && <div style={{ color: "#475569", fontSize: "14px", marginBottom: "16px" }}>No projects yet. Create one!</div>}

            {/* Recent documents */}
            <h3 style={{ fontWeight: 600, margin: "20px 0 12px", color: "#94a3b8", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Recent Documents</h3>
            {documents.slice(0, 3).map((d) => (
              <div key={d._id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px" }}>📝</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{timeAgo(d.createdAt)}</div>
                  </div>
                </div>
                <button onClick={() => navigate(`/document-editor?docId=${d._id}`)} style={btnPrimary}>Edit</button>
              </div>
            ))}
            {documents.length === 0 && <div style={{ color: "#475569", fontSize: "14px" }}>No documents yet. Create one!</div>}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Code Projects</h2>
              <button onClick={() => setNewProjectModal(true)} style={btnPrimary}>+ New Project</button>
            </div>

            {loading ? <div style={{ color: "#64748b" }}>Loading...</div> : (
              projects.length === 0
                ? <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", padding: "40px" }}>No projects yet. Create your first one!</div>
                : projects.map((p) => (
                  <div key={p._id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "linear-gradient(135deg,#0ea5e920,#6366f120)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⟨⟩</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{langMap[p.language] || p.language} • {timeAgo(p.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => navigate(`/editor?projectId=${p._id}`)} style={btnPrimary}>Open IDE</button>
                      <button onClick={() => deleteProject(p._id)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef444440", color: "#f87171", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </div>
                  </div>
                ))
            )}

            {/* New project modal */}
            {newProjectModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "32px", width: "400px" }}>
                  <h3 style={{ margin: "0 0 20px", fontWeight: 700 }}>New Code Project</h3>
                  <input placeholder="Project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} style={{ ...inputStyle, marginBottom: "12px" }} />
                  <select value={newProjectLang} onChange={(e) => setNewProjectLang(e.target.value)} style={{ ...inputStyle, marginBottom: "20px" }}>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={createProject} style={{ ...btnPrimary, flex: 1, padding: "11px" }}>Create</button>
                    <button onClick={() => setNewProjectModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "8px", background: "#334155", border: "none", color: "white", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Documents</h2>
              <button onClick={() => setNewDocModal(true)} style={btnPrimary}>+ New Document</button>
            </div>

            {loading ? <div style={{ color: "#64748b" }}>Loading...</div> : (
              documents.length === 0
                ? <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", padding: "40px" }}>No documents yet. Create your first one!</div>
                : documents.map((d) => (
                  <div key={d._id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📝</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.title}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Rich Text • {timeAgo(d.updatedAt || d.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => navigate(`/document-editor?docId=${d._id}`)} style={btnPrimary}>Edit</button>
                      <button onClick={() => deleteDocument(d._id)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef444440", color: "#f87171", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </div>
                  </div>
                ))
            )}

            {newDocModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "32px", width: "380px" }}>
                  <h3 style={{ margin: "0 0 16px", fontWeight: 700 }}>New Document</h3>
                  <input placeholder="Document title" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} style={{ ...inputStyle, marginBottom: "20px" }} />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={createDocument} style={{ ...btnPrimary, flex: 1, padding: "11px" }}>Create</button>
                    <button onClick={() => setNewDocModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "8px", background: "#334155", border: "none", color: "white", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FILES ── */}
        {tab === "files" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 700 }}>My Files</h2>
              <label style={{ ...btnPrimary, cursor: "pointer" }}>
                {fileUploading ? "Uploading..." : "↑ Upload File"}
                <input type="file" hidden accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} disabled={fileUploading} />
              </label>
            </div>

            {loading ? <div style={{ color: "#64748b" }}>Loading...</div> : (
              files.length === 0
                ? <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", padding: "40px" }}>No files uploaded yet.</div>
                : files.map((f) => (
                  <div key={f._id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                        {f.filetype === "pdf" ? "📕" : f.filetype === "docx" || f.filetype === "doc" ? "📘" : "📄"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.filename}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{f.filetype?.toUpperCase()} • {formatSize(f.size)} • {timeAgo(f.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleDownloadFile(f._id, f.filename)} style={{ background: "rgba(14,165,233,0.15)", border: "1px solid #0ea5e940", color: "#38bdf8", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Download</button>
                      <button onClick={() => deleteFile(f._id)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef444440", color: "#f87171", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div style={{ maxWidth: "520px" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "24px" }}>Profile Settings</h2>

            {profileMsg.text && (
              <div style={{
                background: profileMsg.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${profileMsg.type === "success" ? "#22c55e" : "#ef4444"}`,
                color: profileMsg.type === "success" ? "#86efac" : "#fca5a5",
                padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px",
              }}>
                {profileMsg.text}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 700 }}>
                  {(user.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "18px" }}>{user.name || "Developer"}</div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>{user.email}</div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Display Name</label>
                  <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>New Password (leave blank to keep current)</label>
                  <input type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} placeholder="New password..." style={inputStyle} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", marginBottom: "6px" }}>Confirm New Password</label>
                  <input type="password" value={profile.confirm} onChange={(e) => setProfile({ ...profile, confirm: e.target.value })} placeholder="Repeat new password..." style={inputStyle} />
                </div>
                <button type="submit" style={{ ...btnPrimary, padding: "11px 24px" }}>Save Changes</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
