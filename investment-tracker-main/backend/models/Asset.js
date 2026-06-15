const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Portfolio",
    required: true
  },
  type: {
    type: String,
    enum: ["stock", "crypto", "bond", "real_estate", "other"],
    required: [true, "Asset type is required"]
  },
  name: {
    type: String,
    required: [true, "Asset name is required"],
    trim: true,
    maxlength: [100, "Asset name cannot exceed 100 characters"]
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.0001, "Quantity must be positive and greater than 0"],
    max: [100000000, "Quantity cannot exceed 100,000,000"]
  },
  purchasePrice: {
    type: Number,
    required: [true, "Purchase price is required"],
    min: [0, "Purchase price cannot be negative"],
    max: [10000000000, "Purchase price cannot exceed 10,000,000,000"]
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: [0, "Current price cannot be negative"],
    max: [10000000000, "Current price cannot exceed 10,000,000,000"]
  }
}, { timestamps: true });

assetSchema.index({ portfolio: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Asset", assetSchema);
