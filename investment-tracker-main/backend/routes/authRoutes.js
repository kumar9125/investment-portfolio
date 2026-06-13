const express = require("express");
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

//   Register new user
router.post("/signup", signup);

//     Login user
router.post("/login", login);

//  Get current logged in user
router.get("/me", protect, getMe);

module.exports = router;
