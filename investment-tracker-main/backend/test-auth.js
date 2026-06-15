const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const mongoose = require("mongoose");
const { startServer } = require("./server");
const User = require("./models/User");

const TEST_PORT = 5001;
process.env.PORT = TEST_PORT; // Force server to run on test port

console.log("=== Integration Auth Endpoint Tests ===");
if (!process.env.MONGO_URI) {
  console.error("❌ Test Failed: MONGO_URI is not defined.");
  process.exit(1);
}

// Helper function to make HTTP requests
const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        let parsedBody = null;
        try {
          parsedBody = body ? JSON.parse(body) : null;
        } catch (e) {
          parsedBody = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedBody,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  let serverInstance;
  const testEmail = `integration_auth_${Date.now()}@example.com`;
  const testPassword = "securepass123";

  try {
    // Start the server
    console.log("Starting test server...");
    serverInstance = await startServer();
    console.log(`✅ Test server running on port ${TEST_PORT}`);

    // Test 1: Sign Up
    console.log("\nTesting POST /api/auth/signup...");
    const signupPayload = {
      name: "Integration Test User",
      email: testEmail,
      password: testPassword,
    };
    const signupRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/signup",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }, signupPayload);

    console.log(`- Status Code: ${signupRes.statusCode}`);
    console.log("- Response Data:", signupRes.data);

    if (signupRes.statusCode !== 201) {
      throw new Error(`Signup failed with status code ${signupRes.statusCode}`);
    }
    if (!signupRes.data.token) {
      throw new Error("Signup response did not include a JWT token");
    }
    console.log("✅ Signup flow PASSED");

    // Test 2: Login
    console.log("\nTesting POST /api/auth/login...");
    const loginPayload = {
      email: testEmail,
      password: testPassword,
    };
    const loginRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }, loginPayload);

    console.log(`- Status Code: ${loginRes.statusCode}`);
    console.log("- Response Data:", loginRes.data);

    if (loginRes.statusCode !== 200) {
      throw new Error(`Login failed with status code ${loginRes.statusCode}`);
    }
    const token = loginRes.data.token;
    if (!token) {
      throw new Error("Login response did not include a JWT token");
    }
    console.log("✅ Login flow PASSED");

    // Test 3: Protected Route (GET /api/auth/me)
    console.log("\nTesting GET /api/auth/me (Protected)...");
    const meRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/me",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log(`- Status Code: ${meRes.statusCode}`);
    console.log("- Response Data:", meRes.data);

    if (meRes.statusCode !== 200) {
      throw new Error(`Accessing protected route failed with status code ${meRes.statusCode}`);
    }
    if (meRes.data.email !== testEmail) {
      throw new Error("Fetched user email does not match registered email");
    }
    console.log("✅ Protected Route flow PASSED");

    // Cleanup
    console.log("\nCleaning up database test user...");
    await User.deleteOne({ email: testEmail });
    console.log("✅ Cleanup complete");

    // Shutdown
    console.log("Shutting down test server...");
    await new Promise((resolve) => serverInstance.close(resolve));
    await mongoose.disconnect();
    console.log("✅ Server shutdown complete");

    console.log("\n=== ALL AUTH INTEGRATION TESTS PASSED ===");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test Failed with Exception:", error.message);
    console.error(error.stack);
    
    // Attempt cleanup
    try {
      await User.deleteOne({ email: testEmail });
    } catch (e) {}

    if (serverInstance) {
      try {
        serverInstance.close();
      } catch (e) {}
    }
    try {
      await mongoose.disconnect();
    } catch (e) {}
    
    process.exit(1);
  }
};

runTests();
