import React, { useState, useEffect } from "react";

const errorStyles = {
  "Compilation Error": { bg: "rgba(249,115,22,0.1)", border: "#f9731650", title: "#fb923c", text: "#fed7aa", icon: "🛠" },
  "Runtime Error": { bg: "rgba(239,68,68,0.1)", border: "#ef444450", title: "#f87171", text: "#fca5a5", icon: "⚠" },
  "Time Limit Exceeded": { bg: "rgba(245,158,11,0.1)", border: "#f59e0b50", title: "#fbbf24", text: "#fde68a", icon: "⏱" },
  "Memory Limit Exceeded": { bg: "rgba(234,179,8,0.1)", border: "#eab30850", title: "#facc15", text: "#fef08a", icon: "💾" },
  "Segmentation Fault": { bg: "rgba(236,72,153,0.1)", border: "#ec489950", title: "#f472b6", text: "#fbcfe8", icon: "⚡" },
  "Stack Overflow": { bg: "rgba(168,85,247,0.1)", border: "#a855f750", title: "#c084fc", text: "#e9d5ff", icon: "💥" },
  "Invalid Input": { bg: "rgba(148,163,184,0.1)", border: "#94a3b850", title: "#cbd5e1", text: "#e2e8f0", icon: "⌨" },
  "Unsupported Language": { bg: "rgba(148,163,184,0.1)", border: "#94a3b850", title: "#cbd5e1", text: "#e2e8f0", icon: "🌐" },
  "Connection Error": { bg: "rgba(148,163,184,0.1)", border: "#94a3b850", title: "#cbd5e1", text: "#e2e8f0", icon: "🔌" },
  "Error": { bg: "rgba(239,68,68,0.1)", border: "#ef444450", title: "#f87171", text: "#fca5a5", icon: "✖" },
};

function OutputPanel({ stdin, setStdin, output, error, errorType, executionTime, memoryUsed, onRun, running }) {
  const [activeTab, setActiveTab] = useState("stdin"); // "stdin", "output", "error"

  // Automatically switch tab when output or error changes
  useEffect(() => {
    if (error) {
      setActiveTab("error");
    } else if (output) {
      setActiveTab("output");
    }
  }, [output, error]);

  const currentErrStyle = errorStyles[errorType] || errorStyles["Error"];

  const tabBtnStyle = (tabKey, color = "#94a3b8") => ({
    background: activeTab === tabKey ? "#1e293b" : "transparent",
    color: activeTab === tabKey ? color : "#64748b",
    border: "none",
    borderBottom: activeTab === tabKey ? `2px solid ${color}` : "2px solid transparent",
    padding: "6px 16px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });

  return (
    <div style={{
      height: "230px", background: "#020617", borderTop: "1px solid #1f2937",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {/* Header bar with tabs & stats */}
      <div style={{
        height: "38px", background: "#111827", borderBottom: "1px solid #1f2937",
        display: "flex", alignItems: "center", padding: "0 12px", gap: "4px",
      }}>
        {/* Tabs */}
        <button type="button" onClick={() => setActiveTab("stdin")} style={tabBtnStyle("stdin", "#38bdf8")}>
          📥 Standard Input (stdin)
          {stdin?.trim() && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />}
        </button>

        <button type="button" onClick={() => setActiveTab("output")} style={tabBtnStyle("output", "#10b981")}>
          ✓ Output
          {output && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />}
        </button>

        <button type="button" onClick={() => setActiveTab("error")} style={tabBtnStyle("error", "#f87171")}>
          {error ? `⚠ ${errorType || "Error"}` : "Errors"}
          {error && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />}
        </button>

        <div style={{ flex: 1 }} />

        {/* Execution Metrics */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "#94a3b8", paddingRight: "8px" }}>
          {executionTime && executionTime !== "N/A" && (
            <span title="Execution Time" style={{ background: "#1e293b", padding: "2px 8px", borderRadius: "4px", border: "1px solid #334155" }}>
              ⏱ {executionTime}
            </span>
          )}

          {memoryUsed && memoryUsed !== "N/A" && (
            <span title="Memory Usage" style={{ background: "#1e293b", padding: "2px 8px", borderRadius: "4px", border: "1px solid #334155" }}>
              💾 {memoryUsed}
            </span>
          )}

          {activeTab === "stdin" && stdin && (
            <button
              type="button"
              onClick={() => setStdin("")}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "11px" }}
            >
              Clear Input
            </button>
          )}
        </div>
      </div>

      {/* Panel Body Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        
        {/* ── STDIN INPUT TAB ── */}
        {activeTab === "stdin" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
              <span>Enter custom input below (fed to cin, scanf, input(), Scanner, etc. when you click ▶ Run):</span>
              <span style={{ color: "#38bdf8" }}>Separate multiple values with newlines</span>
            </div>
            <textarea
              value={stdin || ""}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g. 10&#10;20&#10;hello"
              rows={4}
              style={{
                flex: 1,
                width: "100%",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#e2e8f0",
                fontFamily: "monospace",
                fontSize: "13px",
                padding: "8px 12px",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* ── STANDARD OUTPUT TAB ── */}
        {activeTab === "output" && (
          <div style={{ height: "100%" }}>
            {output ? (
              <div>
                <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, marginBottom: "6px" }}>
                  Standard Output (stdout):
                </div>
                <pre style={{
                  color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word",
                  fontSize: "13px", margin: 0, fontFamily: "monospace", lineHeight: "1.6"
                }}>
                  {output}
                </pre>
              </div>
            ) : (
              <div style={{ color: "#475569", fontSize: "13px", fontStyle: "italic", paddingTop: "8px" }}>
                No output yet. Enter code and optional input, then press ▶ Run or Ctrl+Enter to execute.
              </div>
            )}
          </div>
        )}

        {/* ── ERRORS TAB ── */}
        {activeTab === "error" && (
          <div style={{ height: "100%" }}>
            {error ? (
              <div style={{
                background: currentErrStyle.bg,
                border: `1px solid ${currentErrStyle.border}`,
                borderRadius: "8px",
                padding: "12px 16px",
              }}>
                <div style={{ color: currentErrStyle.title, fontWeight: 700, fontSize: "13px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{currentErrStyle.icon}</span>
                  <span>{errorType || "Execution Error"}</span>
                </div>
                <pre style={{
                  color: currentErrStyle.text,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "13px",
                  margin: 0,
                  fontFamily: "monospace",
                  lineHeight: "1.6"
                }}>
                  {error}
                </pre>
              </div>
            ) : (
              <div style={{ color: "#475569", fontSize: "13px", fontStyle: "italic", paddingTop: "8px" }}>
                ✓ No compilation or runtime errors detected.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default OutputPanel;