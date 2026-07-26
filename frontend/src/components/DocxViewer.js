import React, { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

function DocxViewer({ file }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;

    const loadDoc = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("Failed to fetch document");

        const blob = await response.blob();
        containerRef.current.innerHTML = "";

        await renderAsync(blob, containerRef.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
        });
      } catch (err) {
        console.error("DOCX render error:", err);
        setError("Failed to render document. The file may be corrupted or in an unsupported format.");
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [file]);

  if (!file) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📘</div>
          <div>No document loaded.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#e2e8f0", padding: "24px" }}>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #cbd5e1", borderTop: "3px solid #0ea5e9", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ color: "#64748b", fontSize: "14px" }}>Rendering document...</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <div style={{ textAlign: "center", background: "#fff", padding: "32px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
            <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: "8px" }}>Render Error</div>
            <div style={{ color: "#64748b", fontSize: "14px" }}>{error}</div>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ display: loading ? "none" : "block" }} />

      <style>{`
        .docx-wrapper {
          margin: 0 auto;
          max-width: 100%;
        }
        .docx-wrapper > section.docx {
          background: white;
          padding: 40px;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          border-radius: 2px;
        }
        .docx-wrapper > section.docx table {
          border-collapse: collapse;
          width: 100%;
        }
        .docx-wrapper > section.docx table td,
        .docx-wrapper > section.docx table th {
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
        }
        .docx-wrapper > section.docx img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}

export default DocxViewer;