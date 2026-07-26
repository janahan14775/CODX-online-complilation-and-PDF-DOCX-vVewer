import React, { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BTN = ({ onClick, children, disabled, title, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      background: active ? "rgba(14,165,233,0.2)" : disabled ? "#1e293b" : "#1e293b",
      border: active ? "1px solid #38bdf8" : "1px solid #334155",
      color: active ? "#38bdf8" : disabled ? "#475569" : "white",
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
  const [scale, setScale] = useState(1.2);
  const [viewMode, setViewMode] = useState("all"); // "all" or "single"
  const [singlePage, setSinglePage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef(null);

  const onDocumentLoad = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setSinglePage(1);
  }, []);

  const goToPrev = () => setSinglePage((p) => Math.max(1, p - 1));
  const goToNext = () => setSinglePage((p) => Math.min(numPages || p, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)));
  const resetZoom = () => setScale(1.2);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchText.trim() || !containerRef.current) return;
    // Use browser's built-in find
    if (window.find) {
      window.find(searchText, false, false, true);
    }
  };

  if (!file) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
          <div>No PDF file loaded.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f172a" }}>
      {/* Toolbar */}
      <div style={{
        background: "#111827", borderBottom: "1px solid #1f2937",
        padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* View mode toggle */}
        <BTN onClick={() => setViewMode("all")} active={viewMode === "all"} title="View all pages">All Pages</BTN>
        <BTN onClick={() => setViewMode("single")} active={viewMode === "single"} title="Single page view">Single</BTN>

        <div style={{ width: "1px", height: "24px", background: "#334155", margin: "0 4px" }} />

        {/* Navigation (single page mode) */}
        {viewMode === "single" && (
          <>
            <BTN onClick={goToPrev} disabled={singlePage <= 1} title="Previous page">◀ Prev</BTN>
            <span style={{ color: "#94a3b8", fontSize: "13px", whiteSpace: "nowrap", minWidth: "90px", textAlign: "center" }}>
              Page {singlePage} / {numPages || "..."}
            </span>
            <BTN onClick={goToNext} disabled={!numPages || singlePage >= numPages} title="Next page">Next ▶</BTN>
            <div style={{ width: "1px", height: "24px", background: "#334155", margin: "0 4px" }} />
          </>
        )}

        {viewMode === "all" && numPages && (
          <span style={{ color: "#94a3b8", fontSize: "13px" }}>
            {numPages} page{numPages > 1 ? "s" : ""}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <BTN onClick={() => setShowSearch(s => !s)} active={showSearch} title="Search in document">🔍 Search</BTN>

        {showSearch && (
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "4px" }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search text..."
              autoFocus
              style={{
                width: "150px", background: "#1e293b", border: "1px solid #334155",
                color: "white", padding: "6px 10px", borderRadius: "6px",
                fontSize: "13px", outline: "none",
              }}
            />
            <BTN onClick={handleSearch} title="Find">Find</BTN>
          </form>
        )}

        <div style={{ width: "1px", height: "24px", background: "#334155", margin: "0 4px" }} />

        {/* Zoom */}
        <BTN onClick={zoomOut} disabled={scale <= 0.5} title="Zoom out">−</BTN>
        <span style={{ color: "#94a3b8", fontSize: "13px", minWidth: "48px", textAlign: "center" }}>
          {Math.round(scale * 100)}%
        </span>
        <BTN onClick={zoomIn} disabled={scale >= 3} title="Zoom in">+</BTN>
        <BTN onClick={resetZoom} title="Reset zoom">Reset</BTN>
      </div>

      {/* PDF pages */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoad}
          loading={
            <div style={{ color: "#64748b", marginTop: "40px", textAlign: "center" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid #334155", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              Loading PDF...
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          }
          error={<div style={{ color: "#f87171", marginTop: "40px" }}>Failed to load PDF.</div>}
        >
          {viewMode === "all" && numPages ? (
            // Render ALL pages
            Array.from({ length: numPages }, (_, i) => (
              <div key={i + 1} style={{ marginBottom: "16px", position: "relative" }}>
                <div style={{
                  position: "absolute", top: "-8px", right: "-8px", background: "#1e293b",
                  border: "1px solid #334155", borderRadius: "12px", padding: "2px 10px",
                  color: "#64748b", fontSize: "11px", fontWeight: 600, zIndex: 1,
                }}>
                  {i + 1}
                </div>
                <Page
                  pageNumber={i + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div style={{ width: `${Math.round(612 * scale)}px`, height: `${Math.round(792 * scale)}px`, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", borderRadius: "4px" }}>
                      Loading page {i + 1}...
                    </div>
                  }
                />
              </div>
            ))
          ) : (
            // Single page mode
            <Page
              pageNumber={singlePage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={<div style={{ color: "#64748b" }}>Loading page...</div>}
            />
          )}
        </Document>
      </div>
    </div>
  );
}

export default PdfViewer;