import React, {
  useEffect,
  useRef,
} from "react";

import { renderAsync } from "docx-preview";

function DocxViewer({ file }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const loadDoc = async () => {
      const response = await fetch(file);

      const blob = await response.blob();

      containerRef.current.innerHTML = "";

      await renderAsync(
        blob,
        containerRef.current,
        null,
        {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
        }
      );
    };

    loadDoc();
  }, [file]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#f3f4f6",
        padding: "20px",
      }}
    >
      <div ref={containerRef} />
    </div>
  );
}

export default DocxViewer;