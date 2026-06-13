const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const assetRoutes = require("./routes/assetRoutes");

// ── Load env vars FIRST before anything else reads them ──────────────────────
dotenv.config();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// CORS must run before body parsing and routes so preflight OPTIONS requests succeed.
app.use(
  cors({
    origin: "https://investment-portfolio-1.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── HTTP request logging (dev only) ──────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── Health check / root route (required by Render) ───────────────────────────
app.get("/", (req, res) => {
  res.send("Investment Portfolio Backend is running!");
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/assets", assetRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route Not Found" });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
