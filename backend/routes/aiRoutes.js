const express = require("express");
const router = express.Router();

const { analyzeCode } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

// Route is protected
router.post("/analyze", authMiddleware, analyzeCode);

module.exports = router;
