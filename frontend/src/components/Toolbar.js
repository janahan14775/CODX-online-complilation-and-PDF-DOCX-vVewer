// src/components/Toolbar.jsx

import React from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

function Toolbar({
  language,
  setLanguage,
  onRun,
  onDownload,
  onUpload,
}) {
  const detectLanguage = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();

    switch (ext) {
      case "cpp":
      case "cc":
        return "cpp";

      case "c":
        return "c";

      case "java":
        return "java";

      case "py":
        return "python";

      case "js":
        return "javascript";

      case "txt":
         return "plaintext";
      case "docx":
        return "docx";
      case "pdf":
        return "pdf";
      case "doc":
        return "plaintext";
      default:
        return "plaintext";
    }
  };

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const ext = file.name
    .split(".")
    .pop()
    .toLowerCase();

  const detectedLanguage =
    detectLanguage(file.name);

  try {

    // DOCX
    if (ext === "docx") {

      
      const docxurl = URL.createObjectURL(file);
        onUpload("",file.name, "docx", null, docxurl);
      return;
    }

    // PDF
    if (ext === "pdf") {

      const pdfurl = URL.createObjectURL(file);
      onUpload("",file.name, "pdf", pdfurl,null);
      return;
    }

    // OLD DOC FILES
    if (ext === "doc") {

      alert(
        ".doc files are not fully supported. Please convert to .docx."
      );

      return;
    }

    // CODE/TEXT FILES
    const reader = new FileReader();

    reader.onload = (event) => {

      const content =
        event.target.result;

      onUpload(
        content,
        file.name,
        detectedLanguage
      );
    };

    reader.readAsText(file);

  } catch (err) {

    console.error(err);

    alert(
      "Unable to read file."
    );
  }
};
  return (
    <div className="toolbar">

      <div className="toolbar-left">

        <label className="upload-btn">
          Upload
          <input
            type="file"
            hidden
            accept=".cpp,.c,.java,.py,.js,.txt,.docx,.pdf,.doc"
            onChange={handleFileUpload}
          />
        </label>

        <select
          value={language}
          onChange={(e) => {
            const lang = e.target.value;
            if (lang === "plaintext") {
                onUpload("", "Untitled.txt", "plaintext");
          }
          setLanguage(lang);
        }}
          className="language-select"
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">
            JavaScript
          </option>
          <option value="plaintext">
            New File
          </option>
        </select>
      </div>

      <div className="toolbar-right">

        <button
          className="download-btn"
          onClick={onDownload}
        >
          Download
        </button>
    {![
  "plaintext",
  "pdf",
  "docx",
].includes(language) && (
  <button className="run-btn" onClick={onRun}>
    Run
  </button>
    )}

      </div>

    </div>
  );
}

export default Toolbar;