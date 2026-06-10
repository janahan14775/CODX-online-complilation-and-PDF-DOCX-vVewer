const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: "Code and language are required",
      });
    }

    const tempDir = path.join(
      __dirname,
      "../temp"
    );

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    let fileName = "";
    let compileCommand = "";

    switch (language) {
      case "javascript":
        fileName = `script_${Date.now()}.js`;

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        compileCommand = `node "${path.join(
          tempDir,
          fileName
        )}"`;
        break;

      case "python":
        fileName = `script_${Date.now()}.py`;

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        compileCommand = `python "${path.join(
          tempDir,
          fileName
        )}"`;
        break;

      case "c":
        fileName = `program_${Date.now()}.c`;

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        compileCommand = `gcc "${path.join(
          tempDir,
          fileName
        )}" -o "${path.join(
          tempDir,
          "program.exe"
        )}" && "${path.join(
          tempDir,
          "program.exe"
        )}"`;
        break;

      case "cpp":
        fileName = `program_${Date.now()}.cpp`;

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        compileCommand = `g++ "${path.join(
          tempDir,
          fileName
        )}" -o "${path.join(
          tempDir,
          "program.exe"
        )}" && "${path.join(
          tempDir,
          "program.exe"
        )}"`;
        break;

      case "java":
        fileName = "Main.java";

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        compileCommand = `javac "${path.join(
          tempDir,
          fileName
        )}" && java -cp "${tempDir}" Main`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Unsupported language",
        });
    }

    exec(
      compileCommand,
      {
        timeout: 5000,
      },
      (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            errorType:
              "Compilation/Runtime Error",
            message:
              stderr || error.message,
          });
        }

        if (stderr) {
          return res.json({
            success: false,
            errorType: "Error",
            message: stderr,
          });
        }

        return res.json({
          success: true,
          output: stdout,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};