const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Portfolio",
    required: true
  },
  assetName: {
    type: String,
    required: [true, "Asset name is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(?=.*[A-Za-z])[A-Za-z0-9\s&().'-]{2,100}$/.test(v);
      },
      message: "Asset name must contain at least one letter and may only include letters, numbers, spaces, -, ., &, ', and ()."
    }
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
