import React, { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";

import html2pdf from "html2pdf.js";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("token"); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

export default function DocumentEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docId = searchParams.get("docId");

  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p>Start writing your document...</p>",
    onUpdate: () => { setSaveStatus("unsaved"); },
  });

  // Load document
  useEffect(() => {
    if (!getToken()) { navigate("/"); return; }
    if (docId && editor) {
      axios.get(`${API}/documents/${docId}`, { headers: authHeaders() })
        .then((res) => {
          const d = res.data.document;
          setDocTitle(d.title);
          editor.commands.setContent(d.content || "<p>Start writing...</p>");
          setSaveStatus("");
        })
        .catch(() => navigate("/dashboard"));
    }
  }, [docId, editor, navigate]);

  // Save function
  const handleSave = useCallback(async () => {
    if (!editor || !docId) return;
    setSaving(true);
    try {
      await axios.put(
        `${API}/documents/${docId}`,
        { title: docTitle, content: editor.getHTML() },
        { headers: authHeaders() }
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [editor, docId, docTitle]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const insertImage = () => {
    const url = prompt("Enter image URL");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertLink = () => {
    const url = prompt("Enter URL");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  const exportPDF = () => {
    const el = document.querySelector(".document-content");
    html2pdf().set({ margin: 1, filename: `${docTitle}.pdf`, jsPDF: { unit: "in", format: "letter" } }).from(el).save();
  };

  const exportDOCX = async () => {
    const doc = new Document({ sections: [{ children: [new Paragraph(editor?.getText() || "")] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${docTitle}.docx`);
  };

  if (!editor) return null;

  // ── Toolbar helpers ──
  const ToolBtn = ({ onClick, label, active, title }) => (
    <button
      onClick={onClick}
      title={title || label}
      style={{
        background: active ? "rgba(14,165,233,0.2)" : "transparent",
        border: active ? "1px solid #38bdf8" : "1px solid transparent",
        color: active ? "#38bdf8" : "#94a3b8",
        padding: "4px 10px", borderRadius: "5px", cursor: "pointer",
        fontSize: "13px", fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
      }}
    >{label}</button>
  );

  const Sep = () => <div style={{ width: "1px", background: "#334155", margin: "0 4px", height: "20px" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "10px 20px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <span
          onClick={() => navigate("/dashboard")}
          style={{ fontWeight: 800, fontSize: "15px", background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor: "pointer", marginRight: "8px" }}
        >OnlineCodX</span>

        <input
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          style={{ background: "transparent", border: "none", color: "white", fontWeight: 600, fontSize: "15px", outline: "none", flex: 1 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {saveStatus === "saved" && <span style={{ color: "#22c55e", fontSize: "12px" }}>✓ Saved</span>}
          {saveStatus === "unsaved" && <span style={{ color: "#f59e0b", fontSize: "12px" }}>● Unsaved</span>}
          {saveStatus === "error" && <span style={{ color: "#ef4444", fontSize: "12px" }}>✗ Save failed</span>}
          <button onClick={handleSave} disabled={saving} style={{ background: "#1e293b", border: "1px solid #334155", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={exportPDF} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef444440", color: "#f87171", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Export PDF</button>
          <button onClick={exportDOCX} style={{ background: "rgba(14,165,233,0.15)", border: "1px solid #0ea5e940", color: "#38bdf8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Export DOCX</button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "8px 20px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", flexShrink: 0 }}>
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} label="B" active={editor.isActive("bold")} title="Bold (Ctrl+B)" />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} label="I" active={editor.isActive("italic")} title="Italic (Ctrl+I)" />
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} label="U" active={editor.isActive("underline")} title="Underline" />
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} label="S̶" active={editor.isActive("strike")} title="Strikethrough" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} label="🖍" active={editor.isActive("highlight")} title="Highlight" />
        <Sep />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} label="¶" active={editor.isActive("paragraph")} title="Paragraph" />
        {[1, 2, 3].map(l => (
          <ToolBtn key={l} onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()} label={`H${l}`} active={editor.isActive("heading", { level: l })} title={`Heading ${l}`} />
        ))}
        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} label="• List" active={editor.isActive("bulletList")} />
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1. List" active={editor.isActive("orderedList")} />
        <Sep />

        {/* Alignment */}
        {["left", "center", "right", "justify"].map(a => (
          <ToolBtn key={a} onClick={() => editor.chain().focus().setTextAlign(a).run()} label={{ left: "⬅", center: "↔", right: "➡", justify: "≡" }[a]} active={editor.isActive({ textAlign: a })} title={`Align ${a}`} />
        ))}
        <Sep />

        {/* Text color */}
        <label title="Text Color" style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#94a3b8", fontSize: "13px" }}>
          A
          <input type="color" defaultValue="#e2e8f0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} style={{ width: "22px", height: "22px", border: "none", borderRadius: "4px", cursor: "pointer", padding: 0, background: "transparent" }} />
        </label>
        <Sep />

        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} label="↩ Undo" title="Undo (Ctrl+Z)" />
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} label="↪ Redo" title="Redo (Ctrl+Y)" />
        <Sep />

        {/* Insert */}
        <ToolBtn onClick={insertLink} label="🔗 Link" active={editor.isActive("link")} />
        <ToolBtn onClick={insertImage} label="🖼 Image" />
        <ToolBtn onClick={insertTable} label="⊞ Table" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝ Quote" active={editor.isActive("blockquote")} />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="— Rule" />
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px", display: "flex", justifyContent: "center", background: "#0f172a" }}>
        <div
          className="document-content"
          style={{
            width: "100%",
            maxWidth: "850px",
            background: "#fff",
            borderRadius: "4px",
            minHeight: "1100px",
            padding: "60px 72px",
            boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
            color: "#000",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <style>{`
        .ProseMirror { min-height: 900px; outline: none; font-size: 16px; line-height: 1.8; color: #1e293b; }
        .ProseMirror p { margin-bottom: 12px; }
        .ProseMirror h1 { font-size: 28px; font-weight: 700; margin-bottom: 16px; }
        .ProseMirror h2 { font-size: 22px; font-weight: 600; margin-bottom: 12px; }
        .ProseMirror h3 { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin-bottom: 12px; }
        .ProseMirror blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #64748b; font-style: italic; }
        .ProseMirror table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #e2e8f0; padding: 8px 12px; }
        .ProseMirror th { background: #f1f5f9; font-weight: 600; }
        .ProseMirror img { max-width: 100%; border-radius: 4px; }
        .ProseMirror a { color: #0ea5e9; text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 20px 0; }
      `}</style>
    </div>
  );
}