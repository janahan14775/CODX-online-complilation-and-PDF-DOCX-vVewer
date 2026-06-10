// src/components/OutputPanel.jsx

import React from "react";

function OutputPanel({
  output,
  error
}) {
  return (
    <div className="output-panel">

      <div className="console-header">
        Console
      </div>

      <div className="console-body">

        {error ? (
          <div className="error-section">

            <div className="error-title">
              ❌ Error
            </div>

            <pre className="error-text">
              {error}
            </pre>

          </div>
        ) : (
          <div className="output-section">

            <div className="output-title">
              ✅ Output
            </div>

            <pre className="output-text">
              {output || "No output"}
            </pre>

          </div>
        )}

      </div>

    </div>
  );
}

export default OutputPanel;