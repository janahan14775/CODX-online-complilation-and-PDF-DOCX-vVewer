import React, { useEffect, useCallback, useState, useRef } from "react";
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
import { FontFamily } from "@tiptap/extension-font-family";

import html2pdf from "html2pdf.js";
import { Document as DocxDoc, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
function getToken() { return localStorage.getItem("token"); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

// ── Custom FontSize extension ──
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

// ── A4 Page Constants ──
const PAGE_WIDTH = 794;  // A4 width in pixels at 96dpi
const PAGE_HEIGHT = 1123; // A4 height in pixels at 96dpi
const PAGE_PADDING_TOP = 72;
const PAGE_PADDING_BOTTOM = 72;
const PAGE_PADDING_LEFT = 72;
const PAGE_PADDING_RIGHT = 72;
const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;

const FONT_FAMILIES = [
  "Default", "Arial", "Times New Roman", "Courier New", "Georgia",
  "Verdana", "Helvetica", "Trebuchet MS", "Palatino", "Garamond",
  "Comic Sans MS", "Impact",
];

const FONT_SIZES = [
  "8px", "9px", "10px", "11px", "12px", "14px", "16px", "18px",
  "20px", "24px", "28px", "32px", "36px", "48px", "64px", "72px",
];

export default function DocumentEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const docId = searchParams.get("docId");

  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const editorContainerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Underline,
      FontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p>Start writing your document...</p>",
    onUpdate: () => {
      setSaveStatus("unsaved");
      updatePageCount();
    },
  });

  // ── A4 Page Count Calculation ──
  const updatePageCount = useCallback(() => {
    if (!editorContainerRef.current) return;
    const editorEl = editorContainerRef.current.querySelector(".ProseMirror");
    if (!editorEl) return;
    const contentHeight = editorEl.scrollHeight;
    const pages = Math.max(1, Math.ceil(contentHeight / CONTENT_HEIGHT));
    setPageCount(pages);
  }, []);

  useEffect(() => {
    const timer = setInterval(updatePageCount, 1000);
    return () => clearInterval(timer);
  }, [updatePageCount]);

  // Observe content changes for page count
  useEffect(() => {
    if (!editorContainerRef.current) return;
    const observer = new ResizeObserver(() => updatePageCount());
    const editorEl = editorContainerRef.current.querySelector(".ProseMirror");
    if (editorEl) observer.observe(editorEl);
    return () => observer.disconnect();
  }, [editor, updatePageCount]);

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
          setTimeout(updatePageCount, 200);
        })
        .catch(() => navigate("/dashboard"));
    }
  }, [docId, editor, navigate, updatePageCount]);

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

  // ── Export PDF ──
  const exportPDF = () => {
    const el = document.querySelector(".document-pages-container");
    if (!el) return;

    html2pdf().set({
      margin: [0.5, 0.75, 0.5, 0.75],
      filename: `${docTitle}.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        before: ".page-break-before",
        after: ".page-break-after",
      },
    }).from(el).save();
  };

  // ── Export DOCX ──
  const exportDOCX = async () => {
    if (!editor) return;
    const html = editor.getHTML();

    // Parse HTML to extract content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const children = [];
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim()) {
          const runs = [];
          const parentEl = node.parentElement;
          const computedStyle = parentEl ? window.getComputedStyle(parentEl) : null;

          runs.push(new TextRun({
            text: text,
            bold: parentEl?.closest("strong, b") !== null,
            italics: parentEl?.closest("em, i") !== null,
            underline: parentEl?.closest("u") !== null ? {} : undefined,
            strike: parentEl?.closest("s, del") !== null,
            font: computedStyle?.fontFamily?.split(",")[0]?.replace(/['"]/g, "") || "Calibri",
            size: parseInt(computedStyle?.fontSize || "12") * 2,
          }));
          return runs;
        }
        return [];
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return [];

      const tag = node.tagName.toLowerCase();
      const runs = [];

      if (tag === "br") {
        return [new TextRun({ text: "", break: 1 })];
      }

      // Process children to get text runs
      for (const child of node.childNodes) {
        runs.push(...processNode(child));
      }

      return runs;
    };

    const processBlockElement = (el) => {
      const tag = el.tagName?.toLowerCase();
      const runs = [];
      for (const child of el.childNodes) {
        runs.push(...processNode(child));
      }
      if (runs.length === 0) runs.push(new TextRun(""));

      // Determine alignment
      const style = el.getAttribute("style") || "";
      let alignment = AlignmentType.LEFT;
      if (style.includes("text-align: center") || style.includes("text-align:center")) alignment = AlignmentType.CENTER;
      if (style.includes("text-align: right") || style.includes("text-align:right")) alignment = AlignmentType.RIGHT;
      if (style.includes("text-align: justify") || style.includes("text-align:justify")) alignment = AlignmentType.JUSTIFIED;

      // Determine heading level
      let heading;
      if (tag === "h1") heading = HeadingLevel.HEADING_1;
      else if (tag === "h2") heading = HeadingLevel.HEADING_2;
      else if (tag === "h3") heading = HeadingLevel.HEADING_3;

      return new Paragraph({
        children: runs,
        heading,
        alignment,
        spacing: { after: 200 },
      });
    };

    // Process top-level elements
    for (const child of tempDiv.children) {
      const para = processBlockElement(child);
      if (para) children.push(para);
    }

    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun("")] }));
    }

    const doc = new DocxDoc({
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // Letter size in twips
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${docTitle}.docx`);
  };

  if (!editor) return null;

  // ── Toolbar helpers ──
  const ToolBtn = ({ onClick, label, active, title, style: extraStyle }) => (
    <button
      onClick={onClick}
      title={title || label}
      type="button"
      style={{
        background: active ? "rgba(14,165,233,0.25)" : "transparent",
        border: active ? "1px solid #38bdf8" : "1px solid transparent",
        color: active ? "#38bdf8" : "#94a3b8",
        padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
        fontSize: "13px", fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        ...extraStyle,
      }}
    >{label}</button>
  );

  const Sep = () => <div style={{ width: "1px", background: "#334155", margin: "0 4px", height: "20px", flexShrink: 0 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "white", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* Top Header Bar */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "10px 24px", display: "flex", alignItems: "center", gap: "14px", flexShrink: 0, zIndex: 30 }}>
        <span
          onClick={() => navigate("/dashboard")}
          style={{ fontWeight: 800, fontSize: "16px", background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", cursor: "pointer", marginRight: "4px" }}
        >ComView</span>

        <input
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="Document Title"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #334155", borderRadius: "6px", padding: "6px 12px", color: "white", fontWeight: 600, fontSize: "15px", outline: "none", flex: 1, maxWidth: "360px" }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px", background: "#1e293b", padding: "3px 10px", borderRadius: "12px", border: "1px solid #334155" }}>
            📄 {pageCount} {pageCount === 1 ? "Page" : "Pages"}
          </span>

          {saveStatus === "saved" && <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>✓ Saved</span>}
          {saveStatus === "unsaved" && <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: 600 }}>● Unsaved</span>}
          {saveStatus === "error" && <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>✗ Save failed</span>}

          <button onClick={handleSave} disabled={saving} style={{ background: "#1e293b", border: "1px solid #334155", color: "white", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px", transition: "all 0.15s" }}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={exportPDF} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef444450", color: "#f87171", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Export PDF</button>
          <button onClick={exportDOCX} style={{ background: "rgba(14,165,233,0.15)", border: "1px solid #0ea5e950", color: "#38bdf8", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Export DOCX</button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "6px 20px", display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap", flexShrink: 0, zIndex: 20 }}>

        {/* Font Family */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === "Default") {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(val).run();
            }
          }}
          style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", padding: "5px 8px", borderRadius: "5px", fontSize: "12px", outline: "none", maxWidth: "130px", cursor: "pointer" }}
          title="Font Family"
        >
          {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => {
            editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run();
          }}
          style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", padding: "5px 8px", borderRadius: "5px", fontSize: "12px", outline: "none", width: "65px", cursor: "pointer" }}
          title="Font Size"
          defaultValue="16px"
        >
          {FONT_SIZES.map(s => <option key={s} value={s}>{parseInt(s)}pt</option>)}
        </select>

        <Sep />

        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} label="B" active={editor.isActive("bold")} title="Bold (Ctrl+B)" style={{ fontWeight: 700 }} />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} label="I" active={editor.isActive("italic")} title="Italic (Ctrl+I)" style={{ fontStyle: "italic" }} />
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} label="U" active={editor.isActive("underline")} title="Underline" style={{ textDecoration: "underline" }} />
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
        <label title="Text Color" style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#94a3b8", fontSize: "13px", padding: "2px 6px", borderRadius: "4px" }}>
          A
          <input type="color" defaultValue="#1e293b" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} style={{ width: "20px", height: "20px", border: "none", borderRadius: "3px", cursor: "pointer", padding: 0, background: "transparent" }} />
        </label>

        {/* Highlight color */}
        <label title="Highlight Color" style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#94a3b8", fontSize: "13px", padding: "2px 6px", borderRadius: "4px" }}>
          🖍
          <input type="color" defaultValue="#fef08a" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} style={{ width: "20px", height: "20px", border: "none", borderRadius: "3px", cursor: "pointer", padding: 0, background: "transparent" }} />
        </label>
        <Sep />

        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} label="↩" title="Undo (Ctrl+Z)" />
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} label="↪" title="Redo (Ctrl+Y)" />
        <Sep />

        {/* Insert */}
        <ToolBtn onClick={insertLink} label="🔗" active={editor.isActive("link")} title="Insert Link" />
        <ToolBtn onClick={insertImage} label="🖼" title="Insert Image" />
        <ToolBtn onClick={insertTable} label="⊞" title="Insert Table" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} label="❝" active={editor.isActive("blockquote")} title="Blockquote" />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="—" title="Horizontal Rule" />
      </div>

      {/* Editor Body Workspace (#f3f3f3 Light Gray Background) */}
      <div
        className="workspace-container"
        onClick={() => editor?.chain().focus().run()}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#f3f3f3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 16px",
          width: "100%",
          boxSizing: "border-box",
          cursor: "text",
        }}
      >
        <div
          className="pages-workspace-wrapper document-pages-container"
          ref={editorContainerRef}
          style={{
            position: "relative",
            width: `${PAGE_WIDTH}px`,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Render distinct white A4 Page Background Sheets */}
          <div className="page-sheets-layer" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="a4-page-sheet"
                style={{
                  width: `${PAGE_WIDTH}px`,
                  maxWidth: "100%",
                  height: `${PAGE_HEIGHT}px`,
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)",
                  borderRadius: "3px",
                  position: "absolute",
                  top: `${i * (PAGE_HEIGHT + 24)}px`,
                  left: 0,
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>

          {/* Editor Content Layer */}
          <div
            className="document-content editor-foreground-layer"
            style={{
              position: "relative",
              zIndex: 2,
              width: `${PAGE_WIDTH}px`,
              maxWidth: "100%",
              minHeight: `${pageCount * PAGE_HEIGHT + (pageCount - 1) * 24}px`,
              boxSizing: "border-box",
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Page Break Gap Dividers */}
          {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, i) => (
            <div
              key={i}
              className="page-break-gap-label"
              style={{
                position: "absolute",
                top: `${(i + 1) * PAGE_HEIGHT + i * 24}px`,
                left: 0,
                width: `${PAGE_WIDTH}px`,
                maxWidth: "100%",
                height: "24px",
                backgroundColor: "#f3f3f3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                background: "#e2e8f0",
                padding: "2px 14px",
                borderRadius: "10px",
                letterSpacing: "0.5px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                Page {i + 1} • Page {i + 2}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ProseMirror {
          min-height: ${CONTENT_HEIGHT}px;
          outline: none;
          font-size: 16px;
          line-height: 1.8;
          color: #1e293b;
          padding: ${PAGE_PADDING_TOP}px ${PAGE_PADDING_RIGHT}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_LEFT}px;
          box-sizing: border-box;
          background: transparent;
        }
        .ProseMirror p { margin-bottom: 12px; }
        .ProseMirror h1 { font-size: 28px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
        .ProseMirror h2 { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .ProseMirror h3 { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #0f172a; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 28px; margin-bottom: 12px; }
        .ProseMirror blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #475569; font-style: italic; margin: 16px 0; }
        .ProseMirror table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #cbd5e1; padding: 8px 12px; }
        .ProseMirror th { background: #f8fafc; font-weight: 600; }
        .ProseMirror img { max-width: 100%; border-radius: 4px; }
        .ProseMirror a { color: #0ea5e9; text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 20px 0; }
        .ProseMirror:focus { outline: none; }

        @media (max-width: 840px) {
          .pages-workspace-wrapper,
          .a4-page-sheet,
          .document-content,
          .page-break-gap-label {
            width: 95vw !important;
          }
          .ProseMirror {
            padding: 36px 24px !important;
          }
        }

        @media print {
          .page-sheets-layer, .page-break-gap-label { display: none !important; }
          .document-content { background: #ffffff !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}