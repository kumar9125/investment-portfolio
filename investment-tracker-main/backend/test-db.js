const connectDB = require("./config/db");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

console.log("=== DB Connection Test Start ===");
connectDB()
  .then((conn) => {
    console.log("✅ DB Test Result: SUCCESS! Connection verified.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ DB Test Result: FAIL! Connection failed.");
    console.error(err);
    process.exit(1);
  });
