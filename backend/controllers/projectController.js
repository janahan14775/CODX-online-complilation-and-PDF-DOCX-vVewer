const CodeProject = require("../models/CodeProject");

// Create Project
exports.createProject = async (req, res) => {
  try {
    const { title, language, sourceCode, files } = req.body;

    if (!title || !language) {
      return res.status(400).json({
        success: false,
        message: "Title and language are required",
      });
    }

    const defaultFiles = files || [
      { name: `main.${language === "python" ? "py" : language === "javascript" ? "js" : language === "c" ? "c" : language === "java" ? "java" : "cpp"}`, content: sourceCode || "" }
    ];

    const project = await CodeProject.create({
      title,
      language,
      sourceCode: defaultFiles[0].content,
      files: defaultFiles,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error creating project",
    });
  }
};

// Get All User Projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await CodeProject.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error loading projects",
    });
  }
};

// Get Single Project
exports.getProject = async (req, res) => {
  try {
    const project = await CodeProject.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error loading project",
    });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { title, language, sourceCode, files, output } = req.body;

    const project = await CodeProject.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (title) project.title = title;
    if (language) project.language = language;
    if (sourceCode !== undefined) project.sourceCode = sourceCode;
    if (files) project.files = files;
    if (output !== undefined) project.output = output;

    await project.save();

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error updating project",
    });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await CodeProject.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error deleting project",
    });
  }
};
