// src/components/CodeEditor.jsx

import React, { useRef } from "react";
import Editor from "@monaco-editor/react";

function CodeEditor({
  code,
  setCode,
  language,
  markers = []
}) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    if (markers.length > 0) {
      monaco.editor.setModelMarkers(
        editor.getModel(),
        "owner",
        markers
      );
    }
  };

  const handleChange = (value) => {
    setCode(value || "");
  };

  return (
    <div className="code-editor-wrapper">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 15,
          minimap: {
            enabled: true,
          },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderWhitespace: "selection",
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: {
            enabled: true,
          },
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}

export default CodeEditor;