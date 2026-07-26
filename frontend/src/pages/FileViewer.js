import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import PdfViewer from "../components/PdfViewer";
import DocxViewer from "../components/DocxViewer";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("token"); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

export default function FileViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("fileId");

  const [fileMeta, setFileMeta] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { navigate("/"); return; }
    if (!fileId) { navigate("/dashboard"); return; }

    const loadFile = async () => {
      setLoading(true);
      setError("");
      try {
        // Get file metadata
        const filesRes = await axios.get(`${API}/files`, { headers: authHeaders() });
        const meta = (filesRes.data.files || []).find(f => f._id === fileId);
        if (!meta) { setError("File not found"); setLoading(false); return; }
        setFileMeta(meta);

        // Get file content
        const contentRes = await axios.get(`${API}/files/${fileId}/content`, {
          headers: authHeaders(),
          responseType: meta.filetype === "txt" ? "text" : "blob",
        });

        if (meta.filetype === "txt") {
          setTextContent(contentRes.data);
        } else {
          const url = URL.createObjectURL(contentRes.data);
          setFileUrl(url);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, navigate]);

  const handleDownload = () => {
    if (!fileMeta) return;
    axios.get(`${API}/files/download/${fileId}`, { headers: authHeaders(), responseType: "blob" }).then((res) => {
      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileMeta.filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "4px solid #334155", borderTop: "4px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#94a3b8", fontSize: "14px" }}>Loading file...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <div style={{ color: "#f87171", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Error Loading File</div>
          <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>{error}</div>
          <button onClick={() => navigate("/dashboard")} style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fileType = fileMeta?.filetype?.toLowerCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Top bar */}
      <div style={{ height: "52px", background: "#111827", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0 }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <span style={{ fontSize: "18px" }}>
            {fileType === "pdf" ? "📕" : fileType === "docx" || fileType === "doc" ? "📘" : "📄"}
          </span>
          <span style={{ fontWeight: 600, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileMeta?.filename}
          </span>
          <span style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", background: "#1e293b", padding: "2px 8px", borderRadius: "4px" }}>
            {fileType}
          </span>
        </div>

        <button
          onClick={handleDownload}
          style={{ background: "rgba(14,165,233,0.15)", border: "1px solid #0ea5e940", color: "#38bdf8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
        >
          ↓ Download
        </button>
      </div>

      {/* File content area */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {fileType === "pdf" && fileUrl && (
          <PdfViewer file={fileUrl} />
        )}

        {(fileType === "docx" || fileType === "doc") && fileUrl && (
          <DocxViewer file={fileUrl} />
        )}

        {fileType === "txt" && (
          <div style={{ height: "100%", overflowY: "auto", padding: "32px", display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "100%", maxWidth: "850px", background: "#fff", borderRadius: "4px",
              padding: "40px 60px", boxShadow: "0 4px 40px rgba(0,0,0,0.5)", color: "#1e293b",
              fontFamily: "'Courier New', monospace", fontSize: "14px", lineHeight: "1.8",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {textContent || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>This file is empty.</span>}
            </div>
          </div>
        )}

        {!["pdf", "docx", "doc", "txt"].includes(fileType) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
              <div style={{ fontSize: "16px" }}>Preview not available for .{fileType} files</div>
              <button onClick={handleDownload} style={{ marginTop: "16px", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Download File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
