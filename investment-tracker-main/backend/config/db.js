const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Attempting database connection to MONGO_URI...");
    if (!process.env.MONGO_URI) {
      console.error("❌ Error: MONGO_URI environment variable is undefined!");
      throw new Error("MONGO_URI is undefined");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connection SUCCESS: Connected to host ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection ERROR: ${error.message}`);
    console.error(error.stack);
    throw error; // Propagate the error so startServer can handle it
  }
};

module.exports = connectDB;
