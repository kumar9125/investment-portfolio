const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 5000;
console.log("=== API Reachability Test Start ===");
console.log(`Attempting to hit API on http://localhost:${PORT}/ ...`);

const req = http.get(`http://localhost:${PORT}/`, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`- Response Status: ${res.statusCode}`);
    console.log(`- Response Data: ${data}`);
    if (res.statusCode === 200 && data === "API is running") {
      console.log("✅ API is reachable and healthy!");
      process.exit(0);
    } else {
      console.error("❌ API returned incorrect response.");
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error("❌ API connection failed. Ensure the server is running.");
  console.error(err.message);
  process.exit(1);
});
