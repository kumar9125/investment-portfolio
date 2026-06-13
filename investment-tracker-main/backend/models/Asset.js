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
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Asset", assetSchema);
