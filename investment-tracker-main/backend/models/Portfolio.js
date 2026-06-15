const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: [true, "Portfolio name is required"],
    trim: true,
    maxlength: [100, "Portfolio name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);
