import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import CodeEditor from "./components/CodeEditor";
import OutputPanel from "./components/Outputpanel";
import PdfViewer from "./components/PdfViewer";
import DocxViewer from "./components/DocxViewer";

const API = "http://localhost:5000/api";

function getToken() { return localStorage.getItem("token"); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

const LANG_EXT = { cpp: "cpp", c: "c", java: "java", python: "py", javascript: "js" };
const LANG_DEFAULT_CODE = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
  python: `print("Hello, World!")\n`,
  javascript: `console.log("Hello, World!");\n`,
};

export default function App() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([{ name: "main.cpp", content: LANG_DEFAULT_CODE.cpp }]);
  const [activeFile, setActiveFile] = useState(0);
  const [language, setLanguage] = useState("cpp");
  const [theme, setTheme] = useState("vs-dark");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showExplorer, setShowExplorer] = useState(true);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [docxFile, setDocxFile] = useState(null);
  const fileInputRef = useRef(null);

  // Load project if projectId is provided
  useEffect(() => {
    if (!getToken()) { navigate("/"); return; }
    if (projectId) {
      axios.get(`${API}/projects/${projectId}`, { headers: authHeaders() })
        .then((res) => {
          const p = res.data.project;
          setProject(p);
          setLanguage(p.language);
          if (p.files && p.files.length > 0) {
            setFiles(p.files.map(f => ({ name: f.name, content: f.content })));
          } else {
            setFiles([{ name: `main.${LANG_EXT[p.language] || "txt"}`, content: p.sourceCode || LANG_DEFAULT_CODE[p.language] || "" }]);
          }
          setActiveFile(0);
        })
        .catch(() => navigate("/dashboard"));
    } else {
      const saved = localStorage.getItem("ide_files");
      const savedLang = localStorage.getItem("ide_language");
      if (saved) try { setFiles(JSON.parse(saved)); } catch (_) {}
      if (savedLang) setLanguage(savedLang);
    }
  }, [projectId, navigate]);

  // Auto-save to localStorage when not in cloud project
  useEffect(() => {
    if (!projectId) {
      localStorage.setItem("ide_files", JSON.stringify(files));
      localStorage.setItem("ide_language", language);
    }
  }, [files, language, projectId]);

  const activeCode = files[activeFile]?.content || "";
  const setActiveCode = (val) => {
    setFiles((prev) => {
      const next = [...prev];
      next[activeFile] = { ...next[activeFile], content: val };
      return next;
    });
    setSaveStatus("unsaved");
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput("Running...");
    setError("");
    setErrorType("");

    try {
      const res = await axios.post(
        `${API}/run`,
        { code: activeCode, language },
        { headers: authHeaders() }
      );
      const data = res.data;
      if (data.success) {
        setOutput(data.output || "No output");
        setError("");
      } else {
        setError(data.message || "Error");
        setErrorType(data.errorType || "Error");
        setOutput("");
      }
    } catch (err) {
      setError("Could not connect to server");
      setErrorType("Connection Error");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API}/projects/${projectId}`,
        { sourceCode: activeCode, files: files.map(f => ({ name: f.name, content: f.content })) },
        { headers: authHeaders() }
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts: Ctrl+S to save, Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const handleDownload = () => {
    const blob = new Blob([activeCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = files[activeFile]?.name || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      setPdfFile(URL.createObjectURL(file));
      setDocxFile(null);
      setLanguage("pdf");
      return;
    }
    if (ext === "docx") {
      setDocxFile(URL.createObjectURL(file));
      setPdfFile(null);
      setLanguage("docx");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const extLang = { cpp: "cpp", cc: "cpp", c: "c", java: "java", py: "python", js: "javascript", txt: "plaintext" };
      const detectedLang = extLang[ext] || "plaintext";
      setLanguage(detectedLang);
      setFiles((prev) => {
        const exists = prev.findIndex(f => f.name === file.name);
        if (exists !== -1) {
          const next = [...prev];
          next[exists] = { name: file.name, content: ev.target.result };
          setActiveFile(exists);
          return next;
        }
        setActiveFile(prev.length);
        return [...prev, { name: file.name, content: ev.target.result }];
      });
    };
    reader.readAsText(file);
  };

  const addNewFile = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split(".").pop().toLowerCase();
    const extLang = { cpp: "cpp", cc: "cpp", c: "c", java: "java", py: "python", js: "javascript" };
    const detectedLang = extLang[ext] || language;
    setFiles(prev => [...prev, { name: newFileName, content: LANG_DEFAULT_CODE[detectedLang] || "" }]);
    setActiveFile(files.length);
    setLanguage(detectedLang);
    setNewFileName("");
    setShowNewFile(false);
  };

  const removeFile = (idx) => {
    if (files.length === 1) return;
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setActiveFile(Math.max(0, idx - 1));
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setPdfFile(null);
    setDocxFile(null);
    const ext = LANG_EXT[lang] || "txt";
    if (files[activeFile]) {
      const parts = files[activeFile].name.split(".");
      parts[parts.length - 1] = ext;
      setFiles(prev => {
        const next = [...prev];
        next[activeFile] = { ...next[activeFile], name: parts.join(".") };
        return next;
      });
    }
  };

  const isViewerMode = language === "pdf" || language === "docx";

  const tbBtn = (onClick, label, bg = "#1e293b", color = "white", title = "") => (
    <button
      onClick={onClick}
      title={title || label}
      style={{
        background: bg, border: "1px solid #334155", color,
        padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
        fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* ── Top Toolbar ── */}
      <div style={{ height: "52px", background: "#111827", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", flexShrink: 0 }}>
        <span
          onClick={() => navigate("/dashboard")}
          style={{ fontWeight: 800, fontSize: "15px", background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor: "pointer", marginRight: "8px", whiteSpace: "nowrap" }}
        >
          OnlineCodX
        </span>

        {tbBtn(() => setShowExplorer(v => !v), "⊟ Files")}

        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{ background: "#1f2937", color: "white", border: "1px solid #334155", padding: "5px 10px", borderRadius: "6px", fontSize: "12px", outline: "none" }}
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        {tbBtn(
          () => setTheme(t => t === "vs-dark" ? "light" : "vs-dark"),
          theme === "vs-dark" ? "☀ Light" : "🌙 Dark"
        )}

        <label style={{ background: "#1e293b", border: "1px solid #334155", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
          ↑ Upload
          <input type="file" hidden accept=".cpp,.c,.java,.py,.js,.txt,.pdf,.docx" onChange={handleFileUpload} ref={fileInputRef} />
        </label>

        <div style={{ flex: 1 }} />

        {project && <span style={{ color: "#64748b", fontSize: "12px" }}>{project.title}</span>}

        {saveStatus === "saved" && <span style={{ color: "#22c55e", fontSize: "12px" }}>✓ Saved</span>}
        {saveStatus === "unsaved" && <span style={{ color: "#f59e0b", fontSize: "12px" }}>● Unsaved</span>}
        {saveStatus === "error" && <span style={{ color: "#ef4444", fontSize: "12px" }}>✗ Save failed</span>}

        {tbBtn(handleSave, saving ? "Saving..." : "💾 Save", "#1e293b", "#94a3b8", "Ctrl+S")}
        {tbBtn(handleDownload, "↓ Download")}

        {!isViewerMode && (
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              background: running ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
              border: "none", color: "white", padding: "7px 20px", borderRadius: "6px",
              cursor: running ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "13px",
            }}
          >
            {running ? "⟳ Running..." : "▶ Run"}
          </button>
        )}
      </div>

      {/* ── Main body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* File Explorer Sidebar */}
        {showExplorer && !isViewerMode && (
          <div style={{ width: "200px", background: "#111827", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "12px 12px 6px", fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Explorer
              <button onClick={() => setShowNewFile(v => !v)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px" }}>+</button>
            </div>

            {showNewFile && (
              <div style={{ padding: "6px 10px", display: "flex", gap: "4px" }}>
                <input
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addNewFile(); if (e.key === "Escape") setShowNewFile(false); }}
                  placeholder="filename.cpp"
                  style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", outline: "none" }}
                />
              </div>
            )}

            {files.map((f, i) => (
              <div
                key={i}
                onClick={() => setActiveFile(i)}
                style={{
                  padding: "8px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", fontSize: "13px",
                  background: i === activeFile ? "rgba(14,165,233,0.1)" : "transparent",
                  color: i === activeFile ? "#38bdf8" : "#94a3b8",
                  borderLeft: i === activeFile ? "2px solid #38bdf8" : "2px solid transparent",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {f.name}</span>
                {files.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", padding: "0 2px" }}
                  >✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Editor area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>

          {/* File tabs */}
          {!isViewerMode && (
            <div style={{ height: "36px", background: "#0f172a", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", overflow: "hidden", flexShrink: 0 }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setActiveFile(i)}
                  style={{
                    padding: "0 16px", height: "100%", display: "flex", alignItems: "center",
                    cursor: "pointer", fontSize: "13px",
                    background: i === activeFile ? "#1e293b" : "transparent",
                    color: i === activeFile ? "white" : "#64748b",
                    borderBottom: i === activeFile ? "2px solid #38bdf8" : "2px solid transparent",
                    borderRight: "1px solid #1f2937",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
              ))}
            </div>
          )}

          {/* Editor / Viewer */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {language === "pdf" && pdfFile ? (
              <PdfViewer file={pdfFile} />
            ) : language === "docx" && docxFile ? (
              <DocxViewer file={docxFile} />
            ) : (
              <CodeEditor code={activeCode} setCode={setActiveCode} language={language} theme={theme} />
            )}
          </div>

          {/* Output panel */}
          {!isViewerMode && (
            <OutputPanel output={output} error={error} errorType={errorType} />
          )}
        </div>
      </div>
    </div>
  );
}