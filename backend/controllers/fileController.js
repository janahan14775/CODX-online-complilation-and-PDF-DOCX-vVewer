const multer = require("multer");
const path = require("path");
const fs = require("fs");
const File = require("../models/File");

// Create upload directory
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

exports.uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single("file");

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = await File.create({
      filename: req.file.originalname,
      filetype: path.extname(req.file.originalname).substring(1).toLowerCase(),
      filepath: req.file.filename,
      size: req.file.size,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error uploading file",
    });
  }
};

// Get files list
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error listing files",
    });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const fullPath = path.join(uploadDir, file.filepath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: "File path not found on server storage",
      });
    }

    res.download(fullPath, file.filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error downloading file",
    });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const fullPath = path.join(uploadDir, file.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await File.findByIdAndDelete(file._id);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error deleting file",
    });
  }
};
