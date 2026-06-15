const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

// ── Load env vars FIRST before anything else reads them ──────────────────────
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const assetRoutes = require("./routes/assetRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL;

console.log("=========================================");
console.log("BACKEND CONFIGURATION DETAILS:");
console.log(`- PORT: ${PORT}`);
console.log(`- NODE_ENV: ${NODE_ENV}`);
console.log(`- FRONTEND_URL: ${FRONTEND_URL}`);
console.log("=========================================");

// ── CORS ──────────────────────────────────────────────────────────────────────
// CORS must run before body parsing and routes so preflight OPTIONS requests succeed.
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "https://investment-portfolio-1.onrender.com",
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

// ── Security Headers ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
  next();
});

// ── Rate Limiting ─────────────────────────────────────────────
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 150;

// Clean up memory cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitCache.entries()) {
    if (now - data.resetTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitCache.delete(ip);
    }
  }
}, 5 * 60 * 1000); // every 5 minutes

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();

  let ipData = rateLimitCache.get(ip);
  if (!ipData || now - ipData.resetTime > RATE_LIMIT_WINDOW_MS) {
    ipData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimitCache.set(ip, ipData);
  }

  ipData.count += 1;

  if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[Rate Limit Block] IP: ${ip} blocked from request: ${req.method} ${req.originalUrl}`);
    return res.status(429).json({
      message: "Too many requests from this IP, please try again after 15 minutes."
    });
  }

  next();
};

app.use(rateLimiter);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── HTTP request logging (dev only) ──────────────────────────────────────────
if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  // Simple custom logger for requests in production to track routes being hit
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── Health check / root route ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("API is running");
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Support both standard prefix and API prefix for robust client integration
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/portfolio", portfolioRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.use("/assets", assetRoutes);
app.use("/api/assets", assetRoutes);

app.use("/transactions", transactionRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/watchlist", watchlistRoutes);
app.use("/api/watchlist", watchlistRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`[404 Not Found] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route Not Found" });
});

// ── Start server after MongoDB connects ───────────────────────────────────────
const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB connection function completed.");
    return app.listen(PORT, () => {
      console.log(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

