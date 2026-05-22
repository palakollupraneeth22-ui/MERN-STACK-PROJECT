require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const connectDB = require("./config/db");
const initSocket = require("./socket");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const gameRoutes = require("./routes/gameRoutes");
const { getVideo } = require("./controllers/videoController");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, app);

// Connect to database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve uploaded videos (public endpoint - URL obscurity provides security)
app.get("/api/videos/:filename", getVideo);

// API routes
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server Running" });
});

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error"
  });
});

const PORT = process.env.PORT || 5000;

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the process using it or set a different PORT environment variable.`);
    process.exit(1);
  }

  console.error("Server error:", err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Server Running on Port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`CORS Origin: ${corsOptions.origin}`);
  console.log(`========================================\n`);
});