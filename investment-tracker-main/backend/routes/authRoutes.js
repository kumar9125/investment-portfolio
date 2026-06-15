const express = require("express");
const { signup, login, getMe, deleteMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateSignup, validateLogin } = require("../middleware/validation");

const router = express.Router();

//   Register new user
router.post("/signup", validateSignup, signup);

//     Login user
router.post("/login", validateLogin, login);

//  Get current logged in user
router.get("/me", protect, getMe);

//  Delete user account
router.delete("/me", protect, deleteMe);

module.exports = router;
