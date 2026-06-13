const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const assetRoutes = require("./routes/assetRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// HTTP request logging
// 0

app.get("/", (req, res) => {
  res.send("Investment Portfolio Backend is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/assets", assetRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route Not Found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
