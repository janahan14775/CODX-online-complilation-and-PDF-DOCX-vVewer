const express = require("express");
const router = express.Router();

const {
  uploadMiddleware,
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

const authMiddleware = require("../middleware/authMiddleware");

// All routes are protected
router.use(authMiddleware);

router.post("/upload", uploadMiddleware, uploadFile);
router.get("/", getFiles);
router.get("/download/:id", downloadFile);
router.delete("/:id", deleteFile);

module.exports = router;
