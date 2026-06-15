const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  console.log(`[JWT] Generating token for user ID: ${id}`);
  if (!process.env.JWT_SECRET) {
    console.error("❌ Error: JWT_SECRET environment variable is undefined!");
    throw new Error("JWT_SECRET is undefined");
  }
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  console.log(`[JWT] Token generated successfully: ${token.substring(0, 15)}...`);
  return token;
};

//sign up
exports.signup = async (req, res) => {
  console.log("[signup] Incoming registration request.");
  console.log("[signup] Request body:", { ...req.body, password: req.body.password ? "[REDACTED]" : undefined });
  try {
    const { name, email, password } = req.body;

    // Check if all fields exist
    if (!name || !email || !password) {
      console.warn("[signup] Missing registration fields.");
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    console.log(`[signup] Checked if user exists with email: ${email}. Found:`, !!userExists);
    if (userExists) {
      console.warn(`[signup] User already exists with email: ${email}`);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    console.log("[signup] Hashing user password...");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("[signup] Password hashed successfully.");

    // Create user
    console.log("[signup] Creating user in database...");
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log(`[signup] User created successfully: ID ${user._id}`);

    const token = generateToken(user._id);

    // Return response with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("❌ [signup] Exception caught:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//login
exports.login = async (req, res) => {
  console.log("[login] Incoming login request.");
  console.log("[login] Request body:", { ...req.body, password: req.body.password ? "[REDACTED]" : undefined });
  try {
    const { email, password } = req.body;

    // Check if fields provided
    if (!email || !password) {
      console.warn("[login] Missing credentials.");
      return res.status(400).json({ message: "Please provide email & password" });
    }

    // Find user
    const user = await User.findOne({ email });
    console.log(`[login] Looked up user with email: ${email}. Found user:`, !!user);
    if (!user) {
      console.warn(`[login] Credentials mismatch (User not found): ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Match password
    console.log("[login] Verifying password match...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[login] Password comparison result: ${isMatch}`);
    if (!isMatch) {
      console.warn(`[login] Credentials mismatch (Password incorrect): ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // Send response with token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("❌ [login] Exception caught:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get logged in user
exports.getMe = async (req, res) => {
  console.log("[getMe] Fetching user info. req.user:", req.user ? req.user._id : undefined);
  try {
    if (!req.user) {
      console.warn("[getMe] No user context available on request.");
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    });
  } catch (error) {
    console.error("❌ [getMe] Exception caught:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
