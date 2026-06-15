const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const nameRegex = /^[a-zA-Z]+( [a-zA-Z]+)*$/;

// Blacklist of weak passwords commonly guessed
const passwordBlacklist = [
  "password123", "admin123", "qwerty123", "portfolio123",
  "welcome123", "password@123", "12345678", "letmein123",
  "portfolio@123", "investment123", "groww1234", "zerodha123"
];

// Simple sanitization helper to strip HTML tags
const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
};

// Helper to check decimal digits length
const countDecimals = (num) => {
  if (Math.floor(num) === num) return 0;
  const str = num.toString();
  if (str.includes(".")) {
    return str.split(".")[1].length;
  }
  return 0;
};

exports.validateSignup = (req, res, next) => {
  console.log("[Validation] Validating Signup Request body.");
  const errors = {};

  let { name, email, password } = req.body;

  // Sanitization & Normalization
  name = typeof name === "string" ? name.trim() : "";
  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  password = typeof password === "string" ? password : "";

  // Update request body with sanitized values
  req.body.name = name;
  req.body.email = email;

  // Name validation
  if (!name) {
    errors.name = "Name is required";
  } else if (name.length < 2 || name.length > 50) {
    errors.name = "Name must be between 2 and 50 characters";
  } else if (!nameRegex.test(name)) {
    errors.name = "Name can only contain alphabetic letters and single spaces";
  }

  // Email validation
  if (!email) {
    errors.email = "Email is required";
  } else if (email.length > 254) {
    errors.email = "Email cannot exceed 254 characters";
  } else if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  // Password validation
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  } else if (passwordBlacklist.includes(password.toLowerCase())) {
    errors.password = "This password is too common and easily guessed. Please use a stronger password.";
  } else if (!passwordRegex.test(password)) {
    errors.password = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)";
  }

  if (Object.keys(errors).length > 0) {
    console.warn("[Validation Warning] Signup request validation failed:", errors);
    return res.status(400).json({ errors });
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  console.log("[Validation] Validating Login Request body.");
  const errors = {};

  let { email, password } = req.body;

  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  password = typeof password === "string" ? password : "";

  req.body.email = email;

  if (!email) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  if (Object.keys(errors).length > 0) {
    console.warn("[Validation Warning] Login request validation failed:", errors);
    return res.status(400).json({ errors });
  }

  next();
};

exports.validatePortfolio = (req, res, next) => {
  console.log("[Validation] Validating Portfolio Request body.");
  const errors = {};

  let { name, description } = req.body;

  name = sanitizeString(name);
  description = description ? sanitizeString(description) : "";

  req.body.name = name;
  req.body.description = description;

  if (!name) {
    errors.name = "Portfolio name is required";
  } else if (name.length > 100) {
    errors.name = "Portfolio name cannot exceed 100 characters";
  }

  if (description && description.length > 500) {
    errors.description = "Description cannot exceed 500 characters";
  }

  if (Object.keys(errors).length > 0) {
    console.warn("[Validation Warning] Portfolio request validation failed:", errors);
    return res.status(400).json({ errors });
  }

  next();
};

exports.validateAsset = (req, res, next) => {
  console.log("[Validation] Validating Asset Request body.");
  const errors = {};

  let { type, name, quantity, purchasePrice, currentPrice } = req.body;

  name = sanitizeString(name);
  req.body.name = name;

  const allowedTypes = ["stock", "crypto", "bond", "real_estate", "other"];
  if (!type) {
    errors.type = "Asset type is required";
  } else if (!allowedTypes.includes(type)) {
    errors.type = "Invalid asset type";
  }

  if (!name) {
    errors.name = "Asset name is required";
  } else if (name.length > 100) {
    errors.name = "Asset name cannot exceed 100 characters";
  }

  // Parse and validate numbers
  quantity = Number(quantity);
  purchasePrice = Number(purchasePrice);

  if (isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive number greater than 0";
  } else if (quantity > 100000000) {
    errors.quantity = "Quantity cannot exceed 100,000,000";
  }

  if (isNaN(purchasePrice) || !isFinite(purchasePrice) || purchasePrice < 0) {
    errors.purchasePrice = "Purchase price must be a positive number (>= 0)";
  } else if (purchasePrice > 10000000000) {
    errors.purchasePrice = "Purchase price cannot exceed 10,000,000,000";
  }

  // Asset type specific decimal rules
  let maxQtyDecimals = 4;
  let maxPriceDecimals = 2;

  if (type === "crypto") {
    maxQtyDecimals = 8;
    maxPriceDecimals = 8;
  } else if (type === "bond") {
    maxQtyDecimals = 0;
    maxPriceDecimals = 2;
  } else if (type === "real_estate") {
    maxQtyDecimals = 2;
    maxPriceDecimals = 2;
  }

  if (!errors.quantity) {
    if (countDecimals(quantity) > maxQtyDecimals) {
      errors.quantity = `Quantity for ${type} cannot exceed ${maxQtyDecimals} decimal places`;
    } else {
      req.body.quantity = parseFloat(quantity.toFixed(maxQtyDecimals));
    }
  }

  if (!errors.purchasePrice) {
    if (countDecimals(purchasePrice) > maxPriceDecimals) {
      errors.purchasePrice = `Purchase price for ${type} cannot exceed ${maxPriceDecimals} decimal places`;
    } else {
      req.body.purchasePrice = parseFloat(purchasePrice.toFixed(maxPriceDecimals));
    }
  }

  if (currentPrice !== undefined && currentPrice !== "") {
    currentPrice = Number(currentPrice);
    if (isNaN(currentPrice) || !isFinite(currentPrice) || currentPrice < 0) {
      errors.currentPrice = "Current price must be a positive number (>= 0)";
    } else if (currentPrice > 10000000000) {
      errors.currentPrice = "Current price cannot exceed 10,000,000,000";
    } else if (countDecimals(currentPrice) > maxPriceDecimals) {
      errors.currentPrice = `Current price for ${type} cannot exceed ${maxPriceDecimals} decimal places`;
    } else {
      req.body.currentPrice = parseFloat(currentPrice.toFixed(maxPriceDecimals));
    }
  }

  if (Object.keys(errors).length > 0) {
    console.warn("[Validation Warning] Asset request validation failed:", errors);
    return res.status(400).json({ errors });
  }

  next();
};
