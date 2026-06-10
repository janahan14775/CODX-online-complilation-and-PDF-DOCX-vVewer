require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./db");

const authRoutes = require("./routes/authRoutes");
const runRoutes = require("./routes/runRoutes");

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Routes
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/run",
  runRoutes
);

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Online IDE Backend Running",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(
  (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error",
    });
  }
);

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});