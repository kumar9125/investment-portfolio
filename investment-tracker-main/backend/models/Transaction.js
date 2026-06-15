const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Portfolio",
    required: true
  },
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  assetType: {
    type: String,
    enum: ["stock", "crypto", "bond", "real_estate", "other"],
    required: true
  },
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
