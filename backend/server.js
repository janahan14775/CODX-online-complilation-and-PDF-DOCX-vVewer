require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db");

const authRoutes = require("./routes/authRoutes");
const runRoutes = require("./routes/runRoutes");
const projectRoutes = require("./routes/projectRoutes");
const documentRoutes = require("./routes/documentRoutes");
const fileRoutes = require("./routes/fileRoutes");


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

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/files",
  fileRoutes
);



// Serve frontend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"));
  });
} else {
  // Test Route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Online IDE Backend Running",
    });
  });
}

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