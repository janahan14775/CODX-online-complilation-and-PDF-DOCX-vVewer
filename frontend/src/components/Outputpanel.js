import React from "react";

const errorColors = {
  "Time Limit Exceeded": { bg: "rgba(245,158,11,0.1)", border: "#f59e0b40", title: "#fbbf24", icon: "⏱" },
  "Compilation/Runtime Error": { bg: "rgba(239,68,68,0.1)", border: "#ef444440", title: "#f87171", icon: "⚠" },
  "Warning/Error": { bg: "rgba(249,115,22,0.1)", border: "#f9731640", title: "#fb923c", icon: "⚡" },
  "Connection Error": { bg: "rgba(148,163,184,0.1)", border: "#94a3b840", title: "#94a3b8", icon: "🔌" },
  "Error": { bg: "rgba(239,68,68,0.1)", border: "#ef444440", title: "#f87171", icon: "✖" },
};

function OutputPanel({ output, error, errorType }) {
  const errStyle = errorColors[errorType] || errorColors["Error"];

  return (
    <div style={{
      height: "200px", background: "#020617", borderTop: "1px solid #1f2937",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {/* Header tabs */}
      <div style={{ height: "38px", background: "#111827", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", padding: "0 16px", gap: "16px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: error ? "#f87171" : "#10b981" }}>
          {error ? "⚠ Error" : "✓ Output"}
        </span>
        {errorType && <span style={{ fontSize: "11px", color: "#64748b" }}>{errorType}</span>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {error ? (
          <div style={{
            background: errStyle.bg, border: `1px solid ${errStyle.border}`,
            borderRadius: "8px", padding: "12px",
          }}>
            <div style={{ color: errStyle.title, fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
              {errStyle.icon} {errorType || "Error"}
            </div>
            <pre style={{ color: "#fca5a5", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", margin: 0, fontFamily: "monospace" }}>
              {error}
            </pre>
          </div>
        ) : (
          <pre style={{ color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", margin: 0, fontFamily: "monospace" }}>
            {output || <span style={{ color: "#334155" }}>No output yet. Press ▶ Run or Ctrl+Enter to execute.</span>}
          </pre>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;