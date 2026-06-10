import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import DocumentEditor from "./components/DocumentEditor";
import PdfViewer from "./components/PdfViewer";
import DocxViewer from "./components/DocxViewer";

import Toolbar from "./components/Toolbar";
import CodeEditor from "./components/CodeEditor";
import OutputPanel from "./components/Outputpanel";

function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("untitled.cpp");
  const [pdfFile, setPdfFile] = useState(null);
const [docxFile, setDocxFile] = useState(null);
  useEffect(() => {
    const savedCode = localStorage.getItem("ide_code");
    const savedLanguage = localStorage.getItem("ide_language");

    if (savedCode) setCode(savedCode);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem("ide_code", code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem("ide_language", language);
  }, [language]);

  const handleRun = async () => {
    try {
      setOutput("Running...");
      setError("");

      const token =
  localStorage.getItem("token");

  const response = await axios.post(
    "http://localhost:5000/api/run",
    {
    code,
    language,
    },
    {
      headers: {
       Authorization:
        `Bearer ${token}`,
     },
    }
    );

      const data = await response.data;

      if (data.error) {
        setError(data.error);
        setOutput("");
      } else {
        setOutput(data.output);
        setError("");
      }
    } catch (err) {
      setError("Unable to connect to server");
      setOutput("");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], {
      type: "text/plain",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
  };

 const handleUpload = (
  content,
  name,
  detectedLanguage,
  pdfUrl,
  docxUrl
) => {

  setCode("");
  localStorage.removeItem("ide_code");

  setPdfFile(null);
  setDocxFile(null);

  if (pdfUrl) {
    setPdfFile(pdfUrl);
  }
  if (docxUrl) {
    setDocxFile(docxUrl);
  }

  if (detectedLanguage === "pdf" || detectedLanguage === "docx") {
    setCode("");
    localStorage.removeItem("ide_code");
  }
  setFileName(name);
  setLanguage(detectedLanguage);
};

  return (
    <div className="app-container">
      <Toolbar
        language={language}
        setLanguage={setLanguage}
        onRun={handleRun}
        onDownload={handleDownload}
        onUpload={handleUpload}
      />

      <div className="editor-container">
        {language === "pdf" ? (
          <PdfViewer file={pdfFile} />
        ) : language === "plaintext" ? (
          <DocumentEditor code={code} setCode={setCode} />
        ) : language === "docx" ? (
          <DocxViewer file={docxFile} />
        ) : (
          <CodeEditor code={code} setCode={setCode} language={language} />
        )}
      </div>
      {![
  "plaintext",
  "pdf",
  "docx",
].includes(language) && (
  <OutputPanel
        output={output}
        error={error}
      />
    )}
    </div>
  );
}

export default App;