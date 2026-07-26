import React, { useState, useEffect, useCallback, useRef } from "react";
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

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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

function getFileIcon(filetype) {
  switch (filetype?.toLowerCase()) {
    case "pdf": return "📕";
    case "docx": return "📘";
    case "doc": return "📗";
    case "txt": return "📄";
    default: return "📎";
  }
}

function getFileColor(filetype) {
  switch (filetype?.toLowerCase()) {
    case "pdf": return "#ef4444";
    case "docx": return "#3b82f6";
    case "doc": return "#22c55e";
    case "txt": return "#f59e0b";
    default: return "#94a3b8";
  }
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

  // File management state
  const [renameModal, setRenameModal] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast("Project created successfully!");
    } catch (e) { showToast("Failed to create project", "error"); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await axios.delete(`${API}/projects/${id}`, { headers: authHeaders() });
    loadAll();
    showToast("Project deleted");
  };

  // ── Documents ──
  const createDocument = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const res = await axios.post(`${API}/documents`, { title: newDocTitle }, { headers: authHeaders() });
      setNewDocModal(false);
      setNewDocTitle("");
      navigate(`/document-editor?docId=${res.data.document._id}`);
    } catch (e) { showToast("Failed to create document", "error"); }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await axios.delete(`${API}/documents/${id}`, { headers: authHeaders() });
    loadAll();
    showToast("Document deleted");
  };

  // ── Files ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext)) {
      showToast("Only PDF, DOCX, DOC, and TXT files are supported", "error");
      return;
    }

    setFileUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/files/upload`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });
      loadAll();
      showToast(`"${file.name}" uploaded successfully!`);
    } catch (err) {
      showToast("Upload failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadFile = (id, filename) => {
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
    showToast("File deleted");
  };

  const handleOpenFile = (fileId) => {
    navigate(`/file-viewer?fileId=${fileId}`);
  };

  const handleViewFile = async (file) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    try {
      const res = await axios.get(`${API}/files/${file._id}/content`, {
        headers: authHeaders(),
        responseType: file.filetype === "txt" ? "text" : "blob",
      });
      if (file.filetype === "txt") {
        setPreviewUrl(res.data);
      } else {
        setPreviewUrl(URL.createObjectURL(res.data));
      }
    } catch (err) {
      showToast("Failed to load preview", "error");
      setPreviewFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl && typeof previewUrl !== "string") {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleEditFile = (file) => {
    if (file.filetype === "txt") {
      // Open in code editor
      navigate(`/editor`);
    } else if (file.filetype === "docx" || file.filetype === "doc") {
      // Navigate to document editor - create a new doc based on this file
      navigate(`/file-viewer?fileId=${file._id}`);
    } else {
      // PDF - open in viewer
      navigate(`/file-viewer?fileId=${file._id}`);
    }
  };

  const handleRenameFile = async () => {
    if (!renameValue.trim() || !renameModal) return;
    try {
      await axios.put(`${API}/files/${renameModal._id}/rename`, { filename: renameValue }, { headers: authHeaders() });
      setRenameModal(null);
      setRenameValue("");
      loadAll();
      showToast("File renamed successfully!");
    } catch (err) {
      showToast("Rename failed: " + (err.response?.data?.message || err.message), "error");
    }
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
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const cardHover = {
    borderColor: "#475569",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none", color: "white", padding: "8px 18px",
    borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
    transition: "opacity 0.2s, transform 0.1s",
  };

  const btnSecondary = {
    background: "rgba(14,165,233,0.15)", border: "1px solid #0ea5e940",
    color: "#38bdf8", padding: "7px 12px", borderRadius: "6px",
    cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
  };

  const btnDanger = {
    background: "rgba(239,68,68,0.15)", border: "1px solid #ef444440",
    color: "#f87171", padding: "7px 12px", borderRadius: "6px",
    cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
  };

  const btnAction = {
    background: "#1e293b", border: "1px solid #334155",
    color: "#94a3b8", padding: "6px 10px", borderRadius: "6px",
    cursor: "pointer", fontSize: "11px", fontWeight: 600, transition: "all 0.15s",
  };

  const inputStyle = {
    background: "#0f172a", border: "1px solid #334155", color: "white",
    padding: "10px 14px", borderRadius: "8px", width: "100%",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  const langMap = { cpp: "C++", c: "C", java: "Java", python: "Python", javascript: "JavaScript" };

  const [hoveredCard, setHoveredCard] = useState(null);

  // ── Loading Spinner ──
  const Spinner = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #334155", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#64748b", fontSize: "13px" }}>Loading...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Empty State ──
  const EmptyState = ({ icon, title, desc }) => (
    <div style={{ ...cardStyle, textAlign: "center", padding: "48px 32px" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.6 }}>{icon}</div>
      <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: "16px", marginBottom: "6px" }}>{title}</div>
      <div style={{ color: "#475569", fontSize: "13px" }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "error" ? "rgba(239,68,68,0.95)" : "rgba(16,185,129,0.95)",
          color: "white", padding: "12px 20px", borderRadius: "10px",
          fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideIn 0.3s ease",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span>{toast.type === "error" ? "✗" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: "220px", background: "#111827", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <img src={logo} alt="ComView" style={{ height: "40px", borderRadius: "8px" }} />
          <div style={{ color: "#475569", fontSize: "12px", marginTop: "12px" }}>Code. Document. View.</div>
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
              <div style={{ width: `${storagePercent}%`, height: "100%", background: "linear-gradient(90deg,#0ea5e9,#6366f1)", borderRadius: "4px", transition: "width 0.5s" }} />
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
            {projects.length === 0 && <EmptyState icon="⟨⟩" title="No projects yet" desc="Create your first code project!" />}

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
            {documents.length === 0 && <EmptyState icon="📝" title="No documents yet" desc="Create your first document!" />}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Code Projects</h2>
              <button onClick={() => setNewProjectModal(true)} style={btnPrimary}>+ New Project</button>
            </div>

            {loading ? <Spinner /> : (
              projects.length === 0
                ? <EmptyState icon="⟨⟩" title="No projects yet" desc="Create your first code project to get started!" />
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
                      <button onClick={() => deleteProject(p._id)} style={btnDanger}>Delete</button>
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

            {loading ? <Spinner /> : (
              documents.length === 0
                ? <EmptyState icon="📝" title="No documents yet" desc="Create your first rich text document!" />
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
                      <button onClick={() => deleteDocument(d._id)} style={btnDanger}>Delete</button>
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
              <div>
                <h2 style={{ margin: 0, fontWeight: 700 }}>My Files</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>Upload and manage your documents</p>
              </div>
              <label style={{ ...btnPrimary, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {fileUploading ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
                    Uploading...
                  </>
                ) : (
                  <>↑ Upload File</>
                )}
                <input type="file" hidden accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} disabled={fileUploading} ref={fileInputRef} />
              </label>
            </div>

            {/* Supported formats hint */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[
                { ext: "PDF", color: "#ef4444" },
                { ext: "DOCX", color: "#3b82f6" },
                { ext: "DOC", color: "#22c55e" },
                { ext: "TXT", color: "#f59e0b" },
              ].map(f => (
                <span key={f.ext} style={{
                  background: `${f.color}15`, border: `1px solid ${f.color}30`,
                  color: f.color, padding: "3px 10px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: 600,
                }}>
                  .{f.ext}
                </span>
              ))}
              <span style={{ color: "#475569", fontSize: "12px", alignSelf: "center" }}>supported</span>
            </div>

            {loading ? <Spinner /> : (
              files.length === 0
                ? <EmptyState icon="📁" title="No files uploaded" desc="Upload your first PDF, DOCX, DOC, or TXT file to get started!" />
                : files.map((f) => (
                  <div
                    key={f._id}
                    onMouseEnter={() => setHoveredCard(f._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      ...cardStyle,
                      ...(hoveredCard === f._id ? cardHover : {}),
                      padding: "16px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      {/* File info */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "10px",
                          background: `${getFileColor(f.filetype)}15`,
                          border: `1px solid ${getFileColor(f.filetype)}25`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "22px", flexShrink: 0,
                        }}>
                          {getFileIcon(f.filetype)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.filename}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span style={{ color: getFileColor(f.filetype), fontWeight: 600 }}>{f.filetype?.toUpperCase()}</span>
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>📏 {formatSize(f.size)}</span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>📅 {formatDate(f.createdAt)}</span>
                            {f.updatedAt && f.updatedAt !== f.createdAt && (
                              <span style={{ fontSize: "12px", color: "#64748b" }}>✏️ {timeAgo(f.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button onClick={() => handleOpenFile(f._id)} style={btnSecondary} title="Open in full viewer">Open</button>
                        <button onClick={() => handleViewFile(f)} style={btnAction} title="Quick preview">View</button>
                        <button onClick={() => handleEditFile(f)} style={btnAction} title="Edit file">Edit</button>
                        <button onClick={() => handleDownloadFile(f._id, f.filename)} style={btnAction} title="Download file">↓</button>
                        <button onClick={() => { setRenameModal(f); setRenameValue(f.filename); }} style={btnAction} title="Rename file">✏️</button>
                        <button onClick={() => deleteFile(f._id)} style={{ ...btnAction, color: "#f87171", borderColor: "#ef444430" }} title="Delete file">🗑</button>
                      </div>
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

      {/* ── RENAME MODAL ── */}
      {renameModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "32px", width: "400px" }}>
            <h3 style={{ margin: "0 0 8px", fontWeight: 700 }}>Rename File</h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px" }}>Enter a new name for "{renameModal.filename}"</p>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFile(); if (e.key === "Escape") setRenameModal(null); }}
              placeholder="New filename"
              style={{ ...inputStyle, marginBottom: "20px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleRenameFile} style={{ ...btnPrimary, flex: 1, padding: "11px" }}>Rename</button>
              <button onClick={() => setRenameModal(null)} style={{ flex: 1, padding: "11px", borderRadius: "8px", background: "#334155", border: "none", color: "white", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewFile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", zIndex: 1000 }}>
          {/* Preview header */}
          <div style={{ height: "52px", background: "#111827", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0 }}>
            <span style={{ fontSize: "18px" }}>{getFileIcon(previewFile.filetype)}</span>
            <span style={{ fontWeight: 600, fontSize: "14px", flex: 1 }}>{previewFile.filename}</span>
            <button onClick={() => handleOpenFile(previewFile._id)} style={btnSecondary}>Open Full View</button>
            <button onClick={closePreview} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef444440", color: "#f87171", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>✕ Close</button>
          </div>

          {/* Preview content */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {previewLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Spinner />
              </div>
            ) : previewFile.filetype === "txt" ? (
              <div style={{ height: "100%", overflowY: "auto", padding: "32px", display: "flex", justifyContent: "center" }}>
                <div style={{
                  width: "100%", maxWidth: "850px", background: "#fff", borderRadius: "4px",
                  padding: "40px 60px", color: "#1e293b", fontFamily: "'Courier New', monospace",
                  fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap",
                }}>
                  {previewUrl || <span style={{ color: "#94a3b8" }}>Empty file</span>}
                </div>
              </div>
            ) : previewFile.filetype === "pdf" && previewUrl ? (
              <div style={{ height: "100%" }}>
                <iframe src={previewUrl} title="PDF Preview" style={{ width: "100%", height: "100%", border: "none" }} />
              </div>
            ) : (previewFile.filetype === "docx" || previewFile.filetype === "doc") && previewUrl ? (
              <DocxPreview url={previewUrl} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                Preview not available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple inline DOCX preview component for the modal
function DocxPreview({ url }) {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        const response = await fetch(url);
        const blob = await response.blob();
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(blob, ref.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
        });
      } catch (err) {
        console.error("DOCX preview error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#e2e8f0", padding: "24px" }}>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ color: "#64748b" }}>Rendering document...</div>
        </div>
      )}
      <div ref={ref} />
    </div>
  );
}
