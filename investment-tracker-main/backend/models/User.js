const mongoose = require("mongoose");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [254, "Email cannot exceed 254 characters"],
    match: [emailRegex, "Please provide a valid email address"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
