import React, {
  useState,
} from "react";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PdfViewer({ file }) {

  const [numPages,
    setNumPages] =
    useState(null);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#f3f4f6",
        padding: "30px",
      }}
    >
      <Document
        file={file}
        onLoadSuccess={({
          numPages,
        }) =>
          setNumPages(
            numPages
          )
        }
      >
        {Array.from(
          new Array(
            numPages
          ),
          (_, index) => (
            <div
              key={index}
              style={{
                marginBottom:
                  "30px",
                display:
                  "flex",
                justifyContent:
                  "center",
              }}
            >
              <Page
                pageNumber={
                  index + 1
                }
                width={900}
              />
            </div>
          )
        )}
      </Document>
    </div>

  );
}

export default PdfViewer;