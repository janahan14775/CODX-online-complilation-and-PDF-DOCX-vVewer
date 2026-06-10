import React from "react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

import html2pdf from "html2pdf.js";

import {
  Document,
  Packer,
  Paragraph,
} from "docx";

import { saveAs } from "file-saver";

function DocumentEditor({
  code,
  setCode,
}) {
  const editor = useEditor({
  extensions: [
    StarterKit,

    Image,

    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
  ],

  content: code,

  onUpdate: ({ editor }) => {
    if (typeof setCode === "function") {
      setCode(editor.getHTML());
    }
  },
});

  const insertImage = () => {
    const url = prompt(
      "Enter image URL"
    );

    if (!url) return;

    editor
      ?.chain()
      .focus()
      .setImage({
        src: url,
      })
      .run();
  };

  const exportPDF = () => {
    const element =
      document.querySelector(
        ".document-content"
      );

    html2pdf()
      .from(element)
      .save("document.pdf");
  };

  const exportDOCX = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph(
              editor?.getText() || ""
            ),
          ],
        },
      ],
    });

    const blob =
      await Packer.toBlob(doc);

    saveAs(blob, "document.docx");
  };

  if (!editor) {
    return null;
  }

  return (
    <div
   style={{
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  }}
>
  <div
       style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }}
>
      {/* Toolbar */}

      <div
        style={{
          padding: "10px",
          borderBottom:
            "1px solid #ddd",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          background: "#f8fafc",
        }}
      >
        <button
        className="btn btn-dark"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          Bold
        </button>

        <button
        className="btn btn-dark"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          Italic
        </button>
        <select
  className="form-select"
  style={{ width: "180px" }}
  onChange={(e) => {
    const value = e.target.value;

    switch (value) {
      case "p":
        editor.chain().focus().setParagraph().run();
        break;

      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;

      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;

      default:
        break;
    }
  }}
>
  <option value="">Format</option>
  <option value="p">Paragraph</option>
  <option value="h1">Heading 1</option>
  <option value="h2">Heading 2</option>
</select>
<select
  className="form-select"
  style={{ width: "180px" }}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "bullet") {
      editor.chain().focus().toggleBulletList().run();
    }

    if (value === "ordered") {
      editor.chain().focus().toggleOrderedList().run();
    }
  }}
>
  <option value="">Lists</option>
  <option value="bullet">Bullet List</option>
  <option value="ordered">Numbered List</option>
</select>
<select
  className="form-select"
  style={{ width: "180px" }}
  onChange={(e) => {
    editor
      .chain()
      .focus()
      .setTextAlign(e.target.value)
      .run();
  }}
>
  <option value="">Alignment</option>
  <option value="left">Left</option>
  <option value="center">Center</option>
  <option value="right">Right</option>
  <option value="justify">Justify</option>
</select>
        

        <button
        className="btn btn-secondary"
          onClick={insertImage}
        >
          Insert Image
        </button>

        <button
          className="btn btn-primary"
          onClick={exportPDF}
        >
          Export PDF
        </button>

        <button
          className="btn btn-sucess"
          onClick={exportDOCX}
        >
          Export DOCX
        </button>
      </div>

      {/* Editor */}

      <div
        className="document-content"
         style={{
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    color: "#000",
    background: "#fff",
  }}
>
        <EditorContent
          editor={editor}
        />
      </div>
    </div>
</div>
  );
    
}

export default DocumentEditor;