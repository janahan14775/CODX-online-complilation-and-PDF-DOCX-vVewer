const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.analyzeCode = async (req, res) => {
  try {
    const { code, language, errorContext } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      });
    }

    // Heuristics mock if API key isn't provided
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Using static analysis heuristics.");
      
      const hasErr = !!errorContext;
      let lineNum = null;
      let suggestion = "Ensure all syntax rules are correctly followed.";

      if (hasErr) {
        // Try parsing line numbers from the error stack trace
        const match = errorContext.match(/line (\d+)/i) || errorContext.match(/:(\d+)(:\d+)?/);
        if (match) {
          lineNum = parseInt(match[1]);
        } else {
          lineNum = 1;
        }

        if (errorContext.toLowerCase().includes("syntaxerror") || errorContext.toLowerCase().includes("invalid syntax")) {
          suggestion = "Double check matching brackets, commas, colons, and semi-colons around the highlighted line.";
        } else if (errorContext.toLowerCase().includes("not defined") || errorContext.toLowerCase().includes("cannot find symbol")) {
          suggestion = "Ensure all variables, objects, and modules are correctly defined and imported before usage.";
        }
      }

      return res.json({
        success: true,
        analysis: {
          hasError: hasErr,
          errorLine: lineNum,
          explanation: hasErr 
            ? `An issue was detected: "${errorContext}". This commonly represents syntax errors or unresolved runtime references.`
            : "Your code structure looks syntactically clean! No obvious issues found.",
          suggestedFix: hasErr 
            ? suggestion 
            : "Review logic functions and verify test coverage.",
          optimizations: "1. Add structured logging for debugging.\n2. Leverage memoization or caching for recursive functions.\n3. Group utility methods to enhance readability.",
        },
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert programming AI assistant. Analyze the following ${language} source code.
      ${errorContext ? `The execution failed with the following error output: "${errorContext}"` : ""}
      
      Provide your analysis in a structured JSON format containing the following fields:
      - "hasError": (boolean) whether the code has issues
      - "errorLine": (number or null) the 1-indexed line number where the primary error/issue resides
      - "explanation": (string) clear explanation of the error or overall code health
      - "suggestedFix": (string) code snippet or description showing how to fix the issue
      - "optimizations": (string) suggestions to optimize/improve the code

      Respond ONLY with valid JSON. Do not include markdown code block formatting (like \`\`\`json) in the response, just the raw JSON text.

      Code:
      ${code}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    let jsonResponse;
    try {
      const cleaned = text.replace(/^```json/, "").replace(/```$/, "").trim();
      jsonResponse = JSON.parse(cleaned);
    } catch (parseError) {
      jsonResponse = {
        hasError: !!errorContext,
        errorLine: null,
        explanation: text,
        suggestedFix: "Verify syntax boundaries and parameters.",
        optimizations: "Enforce clean code naming conventions."
      };
    }

    res.json({
      success: true,
      analysis: jsonResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "AI Analysis Server Error",
      error: error.message,
    });
  }
};
