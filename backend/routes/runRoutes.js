const express = require("express");

const router = express.Router();

const {
  runCode,
} = require(
  "../controllers/runController"
);

const authMiddleware = require(
  "../middleware/authMiddleware"
);

// Protected Run API
router.post(
  "/",
  authMiddleware,
  runCode
);

module.exports = router;