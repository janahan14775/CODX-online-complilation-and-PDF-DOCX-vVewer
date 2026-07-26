const express = require("express");
const router = express.Router();

const {
  uploadMiddleware,
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  renameFile,
  getFileContent,
} = require("../controllers/fileController");

const authMiddleware = require("../middleware/authMiddleware");

// All routes are protected
router.use(authMiddleware);

router.post("/upload", uploadMiddleware, uploadFile);
router.get("/", getFiles);
router.get("/download/:id", downloadFile);
router.get("/:id/content", getFileContent);
router.put("/:id/rename", renameFile);
router.delete("/:id", deleteFile);

module.exports = router;
