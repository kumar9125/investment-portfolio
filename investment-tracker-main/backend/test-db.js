const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("./models/User");

console.log("=== MongoDB Integration Test ===");
if (!process.env.MONGO_URI) {
  console.error("❌ Test Failed: MONGO_URI environment variable is not defined.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Step 1: MongoDB Connection Established Successfully.");

    // Check if User model can be queried
    try {
      console.log("Checking User collection...");
      const count = await User.countDocuments();
      console.log(`✅ Step 2: User collection is accessible. Current document count: ${count}`);

      // Write test
      console.log("Attempting write operation (creating test user)...");
      const tempEmail = `test_db_${Date.now()}@example.com`;
      const tempUser = await User.create({
        name: "Database Test User",
        email: tempEmail,
        password: "hashedpassword123"
      });
      console.log(`✅ Step 3: Write Test Success! Created user ID: ${tempUser._id}`);

      // Read test
      console.log("Attempting read operation (finding test user)...");
      const foundUser = await User.findOne({ email: tempEmail });
      if (foundUser && foundUser.name === "Database Test User") {
        console.log(`✅ Step 4: Read Test Success! Found user ID: ${foundUser._id}`);
      } else {
        throw new Error("Read verification failed - user not found or details mismatch.");
      }

      // Cleanup
      console.log("Cleaning up test user...");
      await User.deleteOne({ _id: tempUser._id });
      console.log("✅ Cleanup complete.");

      await mongoose.disconnect();
      console.log("=== All DB Tests PASSED ===");
      process.exit(0);
    } catch (err) {
      console.error("❌ Collection/Write/Read test failed:", err.message);
      console.error(err.stack);
      await mongoose.disconnect();
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("❌ Step 1 failed: MongoDB connection could not be established.", err.message);
    process.exit(1);
  });
