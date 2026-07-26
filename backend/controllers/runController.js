exports.runCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        errorType: "Invalid Input",
        message: "Code and language are required",
      });
    }

    // Map requested languages to JDoodle languages and version index
    const languageMap = {
      c: { lang: "c", versionIndex: "5" }, // GCC 11.1.0
      cpp: { lang: "cpp", versionIndex: "5" }, // GCC 11.1.0
      java: { lang: "java", versionIndex: "4" }, // JDK 17.0.1
      javascript: { lang: "nodejs", versionIndex: "4" }, // Node 17.1.0
      python: { lang: "python3", versionIndex: "4" }, // Python 3.9.9
    };

    const jDoodleConfig = languageMap[language.toLowerCase()];
    if (!jDoodleConfig) {
      return res.status(400).json({
        success: false,
        errorType: "Unsupported Language",
        message: `Language '${language}' is not supported. Supported languages are C, C++, Java, Python, and JavaScript.`,
      });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        errorType: "Configuration Error",
        message: "JDoodle API keys are missing in the .env file.",
      });
    }

    // Unescape literal \n or \t sequences entered by user in the input textarea
    const processedStdin = (stdin || "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");

    // Prepare payload for JDoodle API including stdin for interactive input
    const url = "https://api.jdoodle.com/v1/execute";
    const payload = {
      clientId,
      clientSecret,
      script: code,
      stdin: processedStdin,
      language: jDoodleConfig.lang,
      versionIndex: jDoodleConfig.versionIndex,
    };

    console.log("Sending payload to JDoodle (language:", jDoodleConfig.lang, ", stdin length:", (stdin || "").length, ")");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("JDoodle API Error:", errText);
      
      let parsedMsg = "Failed to reach code execution engine";
      try {
        const errObj = JSON.parse(errText);
        if (errObj.message) parsedMsg = errObj.message;
        else if (errObj.error) parsedMsg = errObj.error;
      } catch (e) {
        parsedMsg = errText;
      }

      return res.status(500).json({
        success: false,
        errorType: "Server Error",
        message: `JDoodle Error: ${parsedMsg}`,
      });
    }

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        success: false,
        errorType: "Execution Error",
        message: data.error,
      });
    }

    const outputText = data.output || "";
    const memoryUsed = data.memory ? `${(data.memory / 1024).toFixed(2)} MB` : "N/A";
    const executionTime = data.cpuTime ? `${data.cpuTime}s` : "N/A";

    // Classify error types if any
    let errorType = null;
    let isError = false;

    if (
      outputText.includes("Command terminated by signal 9") ||
      outputText.includes("Time Limit Exceeded") ||
      outputText.includes("JDoodle - Timeout") ||
      outputText.includes("Execution Timed Out") ||
      outputText.includes("CPU time limit exceeded") ||
      data.statusCode === 137
    ) {
      isError = true;
      errorType = "Time Limit Exceeded";
    } else if (outputText.includes("Segmentation fault") || outputText.includes("SIGSEGV") || outputText.includes("segmentation fault")) {
      isError = true;
      errorType = "Segmentation Fault";
    } else if (outputText.includes("StackOverflowError") || outputText.includes("stack overflow") || outputText.includes("RecursionError")) {
      isError = true;
      errorType = "Stack Overflow";
    } else if (outputText.includes("OutOfMemoryError") || outputText.includes("Memory Limit Exceeded") || outputText.includes("std::bad_alloc") || outputText.includes("std::length_error")) {
      isError = true;
      errorType = "Memory Limit Exceeded";
    } else if (
      outputText.includes("error:") ||
      outputText.includes("SyntaxError:") ||
      outputText.includes("compilation error") ||
      outputText.includes("cannot find symbol") ||
      outputText.includes("fatal error:") ||
      outputText.includes("IndentationError:")
    ) {
      isError = true;
      errorType = "Compilation Error";
    } else if (
      outputText.includes("Command terminated by signal") ||
      outputText.includes("terminate called") ||
      outputText.includes("what():") ||
      outputText.includes("SIGABRT") ||
      outputText.includes("Exception in thread") ||
      outputText.includes("Traceback (most recent call last)") ||
      outputText.includes("RuntimeError") ||
      outputText.includes("TypeError:") ||
      outputText.includes("ReferenceError:") ||
      outputText.includes("ZeroDivisionError") ||
      outputText.includes("std::out_of_range") ||
      outputText.includes("std::invalid_argument") ||
      outputText.includes("uncaught exception")
    ) {
      isError = true;
      errorType = "Runtime Error";
    }

    if (isError) {
      return res.json({
        success: false,
        output: "",
        error: outputText,
        errorType: errorType || "Runtime Error",
        executionTime,
        memoryUsed,
      });
    }

    return res.json({
      success: true,
      output: outputText,
      error: "",
      errorType: null,
      executionTime,
      memoryUsed,
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