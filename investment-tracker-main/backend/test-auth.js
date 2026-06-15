const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User");

// Ensure JWT secret and MONGO_URI are present
const JWT_SECRET = process.env.JWT_SECRET || "fallback_test_secret";
const MONGO_URI = process.env.MONGO_URI;

console.log("=== Auth Logic Test Start ===");

// 1. Test JWT Generation & Verification
try {
  console.log("Testing JWT Generation...");
  const payload = { id: new mongoose.Types.ObjectId() };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  console.log(`- Token generated: ${token.substring(0, 15)}...`);

  console.log("Testing JWT Verification...");
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.id === payload.id.toString()) {
    console.log("✅ JWT logic passes!");
  } else {
    throw new Error("Decoded payload ID mismatch.");
  }
} catch (err) {
  console.error("❌ JWT Test failed:", err);
  process.exit(1);
}

// 2. Test Password Hashing
try {
  console.log("Testing Password Hashing...");
  const password = "mySecurePassword123";
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password, salt);
  console.log(`- Password hashed: ${hash}`);

  console.log("Testing Password Comparison...");
  const match = bcrypt.compareSync(password, hash);
  const noMatch = bcrypt.compareSync("wrongPassword", hash);

  if (match && !noMatch) {
    console.log("✅ Password hashing/comparison passes!");
  } else {
    throw new Error("Password verification mismatch.");
  }
} catch (err) {
  console.error("❌ Password hashing test failed:", err);
  process.exit(1);
}

// 3. Test Schema validation
if (!MONGO_URI) {
  console.warn("⚠️ MONGO_URI not defined. Skipping DB Auth integration check.");
  console.log("✅ Basic Auth logic tests pass!");
  process.exit(0);
} else {
  console.log("Testing User DB Registration flow...");
  mongoose.connect(MONGO_URI)
    .then(async () => {
      const testEmail = `test_${Date.now()}@example.com`;
      try {
        const passwordHash = bcrypt.hashSync("testpass123", 12);
        const user = await User.create({
          name: "Test User",
          email: testEmail,
          password: passwordHash
        });
        console.log(`- User successfully registered: ${user._id}`);

        // Try lookup
        const lookup = await User.findOne({ email: testEmail });
        if (lookup && lookup.name === "Test User") {
          console.log("- User lookup successful.");
        } else {
          throw new Error("Registered user not found or details mismatch.");
        }

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log("- Temporary test user cleaned up.");
        console.log("✅ Auth integration tests pass!");
        await mongoose.disconnect();
        process.exit(0);
      } catch (err) {
        console.error("❌ Auth integration test failed:", err);
        await mongoose.disconnect();
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("❌ Failed to connect to DB for integration test:", err);
      process.exit(1);
    });
}
