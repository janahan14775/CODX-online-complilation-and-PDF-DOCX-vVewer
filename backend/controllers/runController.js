exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: "Code and language are required",
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
        error: "Unsupported language",
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

    // Prepare payload for JDoodle API
    const url = "https://api.jdoodle.com/v1/execute";
    const payload = {
      clientId,
      clientSecret,
      script: code,
      language: jDoodleConfig.lang,
      versionIndex: jDoodleConfig.versionIndex,
    };

    console.log("Sending payload to JDoodle:", { ...payload, clientSecret: "***" });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("JDoodle Response Status:", response.status);

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
        errorType: "Internal Server Error",
        message: `JDoodle Error: ${parsedMsg}`,
        debug: errText
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

    // JDoodle outputs memory in bytes and cpuTime in seconds
    const memoryUsed = data.memory ? `${(data.memory / 1024).toFixed(2)}MB` : "N/A";
    const executionTime = data.cpuTime ? `${data.cpuTime}s` : "N/A";

    return res.json({
      success: true,
      output: data.output || "",
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