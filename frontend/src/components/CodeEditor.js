import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

function CodeEditor({ code, setCode, language, theme = "vs-dark", markers = [] }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply any initial markers
    applyMarkers(editor, monaco, markers);

    // Add keyboard shortcut: Ctrl+/ to toggle comment
    editor.addAction({
      id: "toggle-comment",
      label: "Toggle Line Comment",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      run: (ed) => ed.getAction("editor.action.commentLine").run(),
    });
  };

  const applyMarkers = (editor, monaco, markerList) => {
    if (!editor || !monaco) return;
    monaco.editor.setModelMarkers(
      editor.getModel(),
      "owner",
      markerList.map((m) => ({
        startLineNumber: m.startLineNumber || 1,
        endLineNumber: m.endLineNumber || 1,
        startColumn: m.startColumn || 1,
        endColumn: m.endColumn || 200,
        message: m.message || "Error",
        severity: m.severity || monaco.MarkerSeverity.Error,
      }))
    );
  };

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      applyMarkers(editorRef.current, monacoRef.current, markers);
    }
  }, [markers]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        height="100%"
        language={language === "cpp" ? "cpp" : language === "python" ? "python" : language === "javascript" ? "javascript" : language === "java" ? "java" : language === "c" ? "c" : language}
        value={code}
        theme={theme}
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderWhitespace: "selection",
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          bracketPairColorization: { enabled: true },
          lineNumbers: "on",
          glyphMargin: true,
          folding: true,
          renderLineHighlight: "all",
          showFoldingControls: "always",
          smoothScrolling: true,
          mouseWheelZoom: true,
          find: { addExtraSpaceOnTop: false, autoFindInSelection: "never", seedSearchStringFromSelection: "selection" },
        }}
      />
    </div>
  );
}

export default CodeEditor;