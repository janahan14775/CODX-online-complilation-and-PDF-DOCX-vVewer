import React, { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BTN = ({ onClick, children, disabled, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: disabled ? "#1e293b" : "#1e293b",
      border: "1px solid #334155",
      color: disabled ? "#475569" : "white",
      padding: "6px 14px",
      borderRadius: "6px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "13px",
      fontWeight: 600,
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

function PdfViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [jumpInput, setJumpInput] = useState("");

  const onDocumentLoad = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNext = () => setPageNumber((p) => Math.min(numPages || p, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)));
  const resetZoom = () => setScale(1.2);

  const handleJump = (e) => {
    e.preventDefault();
    const p = parseInt(jumpInput);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      setPageNumber(p);
    }
    setJumpInput("");
  };

  if (!file) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569" }}>
        No PDF file loaded.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f172a" }}>
      {/* Toolbar */}
      <div style={{
        background: "#111827", borderBottom: "1px solid #1f2937",
        padding: "8px 16px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
      }}>
        <BTN onClick={goToPrev} disabled={pageNumber <= 1} title="Previous page">◀ Prev</BTN>

        <span style={{ color: "#94a3b8", fontSize: "13px", whiteSpace: "nowrap" }}>
          Page {pageNumber} / {numPages || "..."}
        </span>

        <BTN onClick={goToNext} disabled={!numPages || pageNumber >= numPages} title="Next page">Next ▶</BTN>

        {/* Jump to page */}
        <form onSubmit={handleJump} style={{ display: "flex", gap: "4px" }}>
          <input
            type="number"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="Go to..."
            min={1}
            max={numPages || 1}
            style={{
              width: "80px", background: "#1e293b", border: "1px solid #334155",
              color: "white", padding: "6px 8px", borderRadius: "6px",
              fontSize: "13px", outline: "none",
            }}
          />
          <BTN onClick={handleJump} title="Go to page">Go</BTN>
        </form>

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <BTN onClick={zoomOut} disabled={scale <= 0.5} title="Zoom out">🔍−</BTN>
        <span style={{ color: "#94a3b8", fontSize: "13px", minWidth: "48px", textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <BTN onClick={zoomIn} disabled={scale >= 3} title="Zoom in">🔍+</BTN>
        <BTN onClick={resetZoom} title="Reset zoom">Reset</BTN>
      </div>

      {/* PDF pages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoad}
          loading={<div style={{ color: "#64748b", marginTop: "40px" }}>Loading PDF...</div>}
          error={<div style={{ color: "#f87171", marginTop: "40px" }}>Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={<div style={{ color: "#64748b" }}>Loading page...</div>}
          />
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;