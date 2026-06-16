exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: "Code and language are required",
      });
    }

    // Map requested languages to Judge0 CE language IDs
    const languageMap = {
      c: 50,
      cpp: 54,
      java: 62,
      javascript: 63,
      python: 71,
    };

    const language_id = languageMap[language.toLowerCase()];
    if (!language_id) {
      return res.status(400).json({
        success: false,
        error: "Unsupported language",
      });
    }

    const apiKey = process.env.JUDGE0_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Judge0 API key not configured on server",
      });
    }

    // Prepare payload for Judge0 API
    // We use wait=true so the API holds the connection until execution finishes.
    const url = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
    const payload = {
      language_id,
      source_code: code,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Judge0 API Error:", errText);
      return res.status(500).json({
        success: false,
        errorType: "Internal Server Error",
        message: "Failed to reach code execution engine",
      });
    }

    const data = await response.json();
    const statusId = data.status?.id;
    const statusDesc = data.status?.description || "Unknown Error";

    const executionTime = data.time ? `${data.time}s` : "0s";
    const memoryUsed = data.memory ? `${(data.memory / 1024).toFixed(2)}MB` : "0MB";

    // Status 3 = Accepted (Success)
    if (statusId === 3) {
      return res.json({
        success: true,
        output: data.stdout || "",
        executionTime,
        memoryUsed,
      });
    }

    // Status 6 = Compilation Error
    if (statusId === 6) {
      const compileOutput = data.compile_output || "";
      // Best-effort line number extraction (e.g. file.cpp:5:10)
      const lineMatch = compileOutput.match(/:(\d+):/);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;

      return res.json({
        success: false,
        errorType: "Compilation Error",
        lineNumber,
        message: compileOutput,
      });
    }

    // Status 5 = Time Limit Exceeded
    if (statusId === 5) {
      return res.json({
        success: false,
        errorType: "Time Limit Exceeded",
        message: "Your program took too long to execute (Infinite Loop or slow algorithm).",
      });
    }

    // Status 4 = Memory Limit Exceeded
    if (statusId === 4) {
      return res.json({
        success: false,
        errorType: "Memory Limit Exceeded",
        message: "Your program consumed too much memory (possible memory leak or infinite recursion).",
      });
    }

    // Status 7-12 = Runtime Errors
    if (statusId >= 7 && statusId <= 12) {
      let errorType = "Runtime Error";
      let msg = data.stderr || data.message || "An exception occurred during execution.";

      if (statusId === 7) errorType = "Segmentation Fault";
      if (statusDesc.includes("NullPointer")) errorType = "Null Pointer Exception";
      if (statusDesc.includes("StackOverflow")) errorType = "Stack Overflow Error";
      
      // Some generic cleanup for Python/Java tracebacks
      if (msg.includes("ZeroDivisionError") || msg.includes("ArithmeticException")) {
        msg = "Division by zero";
      }

      return res.json({
        success: false,
        errorType,
        message: msg,
      });
    }

    // Fallback for other errors (e.g., Internal Error)
    return res.json({
      success: false,
      errorType: statusDesc,
      message: data.stderr || data.compile_output || "An unexpected error occurred.",
    });

  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({
      success: false,
      errorType: "Server Error",
      message: "An internal server error occurred while processing the request.",
    });
  }
};